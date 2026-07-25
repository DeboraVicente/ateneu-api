import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas exigem auth
router.use(authMiddleware);

// ── GET /api/favorites ────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      place: true,
      event: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ data: favorites });
});

// ── POST /api/favorites ───────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const { placeId, eventId } = req.body;
  if (!placeId && !eventId) {
    return res.status(400).json({ message: 'placeId ou eventId é obrigatório.' });
  }

  try {
    const fav = await prisma.favorite.create({
      data: { userId: req.user!.id, placeId: placeId || null, eventId: eventId || null },
    });
    return res.status(201).json({ data: fav });
  } catch {
    return res.status(400).json({ message: 'Já está nos favoritos.' });
  }
});

// ── DELETE /api/favorites/:id ─────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const fav = await prisma.favorite.findFirst({
    where: { id: String(req.params.id), userId: req.user!.id },
  });
  if (!fav) return res.status(404).json({ message: 'Favorito não encontrado.' });

  await prisma.favorite.delete({ where: { id: String(req.params.id) } });
  return res.json({ message: 'Removido dos favoritos.' });
});

// ── DELETE /api/favorites/place/:placeId ──────────────────
router.delete('/place/:placeId', async (req: AuthRequest, res: Response) => {
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.id, placeId: String(req.params.placeId) },
  });
  return res.json({ message: 'Removido dos favoritos.' });
});

export default router;
