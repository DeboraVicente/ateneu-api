import axios from 'axios';

const BASE  = 'https://api.themoviedb.org/3';
const TOKEN = () => process.env.TMDB_API_KEY ?? '';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export interface NowPlayingMovie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string;
  voteAverage: number;
}

// Filmes em cartaz no Brasil via TMDB (gratuita, precisa de conta + Read Access Token).
// Só traz metadados do filme (título, sinopse, pôster) — a TMDB não tem horário de sessão
// por cinema/sala, então isso é usado apenas como enriquecimento, não como Event real.
// Docs: https://developer.themoviedb.org/docs/getting-started
export async function fetchNowPlayingMovies(page = 1): Promise<NowPlayingMovie[]> {
  const { data } = await axios.get(`${BASE}/movie/now_playing`, {
    headers: { Authorization: `Bearer ${TOKEN()}` },
    params: { language: 'pt-BR', region: 'BR', page },
  });

  return (data.results ?? []).map((m: {
    id: number; title: string; overview: string;
    poster_path: string | null; release_date: string; vote_average: number;
  }) => ({
    id:          m.id,
    title:       m.title,
    overview:    m.overview,
    posterUrl:   m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
    releaseDate: m.release_date,
    voteAverage: m.vote_average,
  }));
}
