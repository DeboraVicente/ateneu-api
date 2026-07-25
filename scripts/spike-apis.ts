import 'dotenv/config';
import { fetchOsmPlaces } from '../src/services/openStreetMap.service';
import { fetchNowPlayingMovies } from '../src/services/tmdb.service';

async function main() {
  console.log('--- Spike de cobertura das APIs para Campinas (OpenStreetMap + TMDB) ---\n');

  console.log('TMDB_API_KEY definida?', !!process.env.TMDB_API_KEY);
  console.log('');

  console.log('--- OpenStreetMap (Overpass, Campinas) ---');
  const categories = ['MUSEU', 'PARQUE', 'TEATRO', 'GASTRONOMIA', 'IGREJA'];
  for (const cat of categories) {
    try {
      const places = await fetchOsmPlaces(cat);
      console.log(`${cat}: ${places.length} resultado(s)`);
      for (const p of places.slice(0, 3)) {
        console.log(`  - ${p.name} | ${p.address}`);
      }
    } catch (err: any) {
      console.log(`${cat}: ERRO ->`, err.message);
    }
  }
  console.log('');

  console.log('--- TMDB (filmes em cartaz, region=BR) ---');
  try {
    const movies = await fetchNowPlayingMovies();
    console.log(`Filmes retornados: ${movies.length}`);
    for (const m of movies.slice(0, 5)) {
      console.log(`- ${m.title} (${m.releaseDate})`);
    }
  } catch (err: any) {
    console.log('ERRO ao chamar TMDB:', err?.response?.status, err?.response?.data ?? err.message);
  }
}

main().catch((err) => {
  console.error('Falha geral no spike:', err);
  process.exit(1);
});
