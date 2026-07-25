import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// ── GET /api/events ───────────────────────────────────────
// Query: category, search, date (YYYY-MM-DD), isFree, page, limit
router.get('/', async (req: Request, res: Response) => {
  const { category, search, date, isFree, upcoming = 'true', page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = { isActive: true };

  if (upcoming === 'true') {
    where.date = { gte: new Date() };
  }

  if (date) {
    const start = new Date(String(date));
    const end   = new Date(String(date));
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  if (category) {
    const cats = String(category).toUpperCase().split(',');
    where.category = { in: cats };
  }

  if (search) {
    where.OR = [
      { title:       { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (isFree === 'true')  where.isFree = true;
  if (isFree === 'false') where.isFree = false;

  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where, skip, take: Number(limit),
      orderBy: { date: 'asc' },
      include: { place: { select: { id: true, name: true, address: true, lat: true, lng: true } } },
    }),
  ]);

  return res.json({ data: events, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) });
});

// ── GET /api/events/:id ───────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: String(req.params.id) },
    include: { place: true },
  });
  if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });
  return res.json({ data: event });
});

// ── POST /api/events (admin) ──────────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const schema = z.object({
    title:       z.string().min(1),
    description: z.string().optional(),
    category:    z.string(),
    date:        z.string().datetime(),
    endDate:     z.string().datetime().optional(),
    address:     z.string().optional(),
    lat:         z.number().optional(),
    lng:         z.number().optional(),
    imageUrl:    z.string().url().optional(),
    isFree:      z.boolean().optional(),
    price:       z.number().optional(),
    priceLabel:  z.string().optional(),
    ticketUrl:   z.string().url().optional(),
    placeId:     z.string().optional(),
  });
  const parsed = schema.safeParse(_req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados inválidos.' });

  const event = await prisma.event.create({ data: { ...parsed.data, date: new Date(parsed.data.date) } as Parameters<typeof prisma.event.create>[0]['data'] });
  return res.status(201).json({ data: event });
});

export default router;
