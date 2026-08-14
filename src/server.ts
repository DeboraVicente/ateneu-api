import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import placesRoutes from './routes/places';
import eventsRoutes from './routes/events';
import favoritesRoutes from './routes/favorites';
import moviesRoutes from './routes/movies';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/movies', moviesRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
  const stack = err instanceof Error ? err.stack : undefined;
  console.error('[ERROR]', message, stack ?? '');
  res.status(500).json({ message });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});