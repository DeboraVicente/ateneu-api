import { Router, Request, Response } from 'express';
import { fetchNowPlayingMovies } from '../services/tmdb.service';

const router = Router();

// ── GET /api/movies/now-playing ────────────────────────────
// Enriquecimento de "cinema em cartaz" via TMDB (metadados de filme,
// sem horário de sessão — ver services/tmdb.service.ts).
router.get('/now-playing', async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const movies = await fetchNowPlayingMovies(page);
    return res.json({ data: movies });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao consultar TMDB.';
    return res.status(500).json({ message: msg });
  }
});

export default router;
