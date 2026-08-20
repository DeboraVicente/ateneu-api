import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// externalIds de seeds anteriores fora do escopo atual — removidos aqui pois
// upsert não apaga registros que saíram do seed:
// - demo-wine-tapas: categoria Gastronomia (fora de escopo)
// - demo-jazz-parque, demo-galeria-novos, demo-rock-city, demo-trilha-ecologica:
//   eventos fictícios de demonstração, substituídos por eventos reais cadastrados
//   manualmente (ver scripts avulsos já rodados em produção)
const STALE_EVENT_EXTERNAL_IDS = [
  'demo-wine-tapas',
  'demo-jazz-parque',
  'demo-galeria-novos',
  'demo-rock-city',
  'demo-trilha-ecologica',
];
const STALE_PLACE_EXTERNAL_IDS = ['demo-mac', 'demo-parque-ibira', 'demo-restaurante-1'];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.event.deleteMany({ where: { externalId: { in: STALE_EVENT_EXTERNAL_IDS } } });
  await prisma.place.deleteMany({ where: { externalId: { in: STALE_PLACE_EXTERNAL_IDS } } });

  // ── Places ──────────────────────────────────────────────
  // Apenas locais reais de Campinas, dentro do escopo do produto
  // (sem Gastronomia — ver services/openStreetMap.service.ts).
  const teatroMuni = {
    name: 'Teatro Municipal de Campinas',
    description: 'Histórico teatro do centro de Campinas, sede de óperas, balés e espetáculos teatrais.',
    category: 'TEATRO',
    address: 'Rua Regente Feijó, 43 — Campinas, SP',
    lat: -22.9068,
    lng: -47.0607,
    isFree: false,
    priceLevel: 2,
    openingHours: {
      'ter-sex': '14:00–20:00',
      'sab-dom': '10:00–18:00',
      'seg': 'Fechado',
    },
  };
  const catedral = {
    name: 'Catedral Metropolitana de Campinas',
    description: 'Imponente catedral neogótica no coração de Campinas, patrimônio histórico da cidade.',
    category: 'IGREJA',
    address: 'Praça Bento Quirino, s/n — Campinas, SP',
    lat: -22.9048,
    lng: -47.0601,
    isFree: true,
    openingHours: {
      'seg-sex': '07:00–19:00',
      'sab-dom': '07:00–20:00',
    },
  };
  const feiraOrganica = {
    name: 'Feira Orgânica do Largo do Rosário',
    description: 'Feira semanal com produtos orgânicos, artesanato e culinária regional.',
    category: 'FEIRA',
    address: 'Largo do Rosário — Campinas, SP',
    lat: -22.9027,
    lng: -47.0593,
    isFree: true,
    openingHours: {
      'sab': '07:00–13:00',
    },
  };

  const places = await Promise.all([
    prisma.place.upsert({ where: { externalId: 'demo-teatro-muni' }, update: teatroMuni, create: { ...teatroMuni, externalId: 'demo-teatro-muni' } }),
    prisma.place.upsert({ where: { externalId: 'demo-catedral' }, update: catedral, create: { ...catedral, externalId: 'demo-catedral' } }),
    prisma.place.upsert({ where: { externalId: 'demo-feira-organica' }, update: feiraOrganica, create: { ...feiraOrganica, externalId: 'demo-feira-organica' } }),
  ]);

  console.log(`✓ ${places.length} locais criados`);

  // ── Events ──────────────────────────────────────────────
  // Eventos reais de Campinas são cadastrados manualmente via scripts avulsos
  // (não fazem parte do seed — ver ROADMAP.md sobre a decisão de fonte de dados).

  console.log('✅ Seed concluído!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
