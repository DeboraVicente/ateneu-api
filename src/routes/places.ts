import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { fetchOsmPlaces } from '../services/openStreetMap.service';

const router = Router();

// ── GET /api/places ───────────────────────────────────────
// Query: category, search, lat, lng, radius (km), isFree, page, limit
router.get('/', async (req: Request, res: Response) => {
  const { category, search, lat, lng, radius = '10', isFree, page = '1', limit = '20' } = req.query;

  const where: Record<string, unknown> = { isActive: true };

  if (category) {
    const cats = String(category).toUpperCase().split(',');
    where.category = { in: cats };
  }

  if (search) {
    where.OR = [
      { name:        { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { address:     { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (isFree === 'true')  where.isFree = true;
  if (isFree === 'false') where.isFree = false;

  const pageNum  = Number(page);
  const limitNum = Number(limit);

  if (lat && lng) {
    // Busca por proximidade: precisa considerar TODO o conjunto que bate com os
    // filtros antes de paginar, senão o cálculo de distância só enxerga a página
    // alfabética atual (um local a 1km pode estar na "página 4" por nome e nunca
    // ser considerado). Pagina o array já filtrado/ordenado por distância, não a query.
    const userLat = parseFloat(String(lat));
    const userLng = parseFloat(String(lng));
    const R = 6371;

    const allMatching = await prisma.place.findMany({
      where,
      include: { _count: { select: { favorites: true, reviews: true } } },
    });

    const byDistance = allMatching
      .map(p => {
        const dLat = (p.lat - userLat) * (Math.PI / 180);
        const dLng = (p.lng - userLng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...p, distanceKm: parseFloat(dist.toFixed(2)) };
      })
      .filter(p => p.distanceKm <= Number(radius))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const total = byDistance.length;
    const skip  = (pageNum - 1) * limitNum;
    const page_ = byDistance.slice(skip, skip + limitNum);

    return res.json({ data: page_, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  }

  const skip = (pageNum - 1) * limitNum;
  const [total, places] = await Promise.all([
    prisma.place.count({ where }),
    prisma.place.findMany({
      where, skip, take: limitNum,
      orderBy: { name: 'asc' },
      include: { _count: { select: { favorites: true, reviews: true } } },
    }),
  ]);

  return res.json({ data: places, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

// ── POST /api/places/sync-osm (admin) ─────────────────────
// Importa/atualiza locais de Campinas a partir do OpenStreetMap (Overpass API).
router.post('/sync-osm', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const places = await fetchOsmPlaces(req.query.category ? String(req.query.category) : undefined);
    let created = 0, updated = 0;

    for (const p of places) {
      const existing = await prisma.place.findUnique({ where: { externalId: p.externalId } });
      const data = {
        name:      p.name,
        category:  p.category,
        address:   p.address,
        lat:       p.lat,
        lng:       p.lng,
        isFree:    p.isFree,
        sourceApi: 'openstreetmap',
        ...(p.phone        ? { phone: p.phone }               : {}),
        ...(p.website      ? { website: p.website }           : {}),
        ...(p.openingHours ? { openingHours: p.openingHours } : {}),
      };
      if (existing) {
        await prisma.place.update({ where: { externalId: p.externalId }, data });
        updated++;
      } else {
        await prisma.place.create({ data: { ...data, externalId: p.externalId } });
        created++;
      }
    }

    return res.json({ message: `${created} locais criados, ${updated} atualizados a partir do OpenStreetMap.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao sincronizar com o OpenStreetMap.';
    return res.status(500).json({ message: msg });
  }
});

// ── GET /api/places/:id ───────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const place = await prisma.place.findUnique({
    where: { id: String(req.params.id) },
    include: {
      reviews: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { favorites: true, reviews: true } },
    },
  });
  if (!place) return res.status(404).json({ message: 'Local não encontrado.' });

  return res.json({ data: place });
});

// ── POST /api/places (admin only) ─────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name:         z.string().min(1),
    description:  z.string().optional(),
    category:     z.string(),
    address:      z.string(),
    lat:          z.number(),
    lng:          z.number(),
    phone:        z.string().optional(),
    website:      z.string().url().optional(),
    imageUrl:     z.string().url().optional(),
    openingHours: z.record(z.string()).optional(),
    isFree:       z.boolean().optional(),
    priceLevel:   z.number().min(1).max(3).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados inválidos.', errors: parsed.error.flatten() });

  const place = await prisma.place.create({ data: parsed.data as Parameters<typeof prisma.place.create>[0]['data'] });
  return res.status(201).json({ data: place });
});

// ── PATCH /api/places/:id (admin only) ────────────────────
router.patch('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const place = await prisma.place.update({ where: { id: String(req.params.id) }, data: req.body });
  return res.json({ data: place });
});

// ── DELETE /api/places/:id (admin only) ───────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  await prisma.place.update({ where: { id: String(req.params.id) }, data: { isActive: false } });
  return res.json({ message: 'Local desativado.' });
});

export default router;
