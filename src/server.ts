import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});