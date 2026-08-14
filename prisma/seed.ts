import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// externalIds de um seed anterior fora do escopo atual (locais de São
// Paulo e categoria Gastronomia) — removidos aqui pois upsert não apaga
// registros que saíram do seed.
const STALE_EVENT_EXTERNAL_IDS = ['demo-wine-tapas'];
const STALE_PLACE_EXTERNAL_IDS = ['demo-mac', 'demo-parque-ibira', 'demo-restaurante-1'];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.event.deleteMany({ where: { externalId: { in: STALE_EVENT_EXTERNAL_IDS } } });
  await prisma.place.deleteMany({ where: { externalId: { in: STALE_PLACE_EXTERNAL_IDS } } });

  // ── Places ──────────────────────────────────────────────
  // Apenas locais reais de Campinas, dentro do escopo do produto
  // (sem Gastronomia — ver services/openStreetMap.service.ts).
  const places = await Promise.all([
    prisma.place.upsert({
      where: { externalId: 'demo-teatro-muni' },
      update: {},
      create: {
        name: 'Teatro Municipal de Campinas',
        description: 'Histórico teatro do centro de Campinas, sede de óperas, balés e espetáculos teatrais.',
        category: 'TEATRO',
        address: 'Rua Regente Feijó, 43 — Campinas, SP',
        lat: -22.9068,
        lng: -47.0607,
        isFree: false,
        priceLevel: 2,
        externalId: 'demo-teatro-muni',
        openingHours: {
          'ter-sex': '14:00–20:00',
          'sab-dom': '10:00–18:00',
          'seg': 'Fechado',
        },
      },
    }),
    prisma.place.upsert({
      where: { externalId: 'demo-catedral' },
      update: {},
      create: {
        name: 'Catedral Metropolitana de Campinas',
        description: 'Imponente catedral neogótica no coração de Campinas, patrimônio histórico da cidade.',
        category: 'IGREJA',
        address: 'Praça Bento Quirino, s/n — Campinas, SP',
        lat: -22.9048,
        lng: -47.0601,
        isFree: true,
        externalId: 'demo-catedral',
        openingHours: {
          'seg-sex': '07:00–19:00',
          'sab-dom': '07:00–20:00',
        },
      },
    }),
    prisma.place.upsert({
      where: { externalId: 'demo-feira-organica' },
      update: {},
      create: {
        name: 'Feira Orgânica do Largo do Rosário',
        description: 'Feira semanal com produtos orgânicos, artesanato e culinária regional.',
        category: 'FEIRA',
        address: 'Largo do Rosário — Campinas, SP',
        lat: -22.9027,
        lng: -47.0593,
        isFree: true,
        externalId: 'demo-feira-organica',
        openingHours: {
          'sab': '07:00–13:00',
        },
      },
    }),
  ]);

  console.log(`✓ ${places.length} locais criados`);

  // ── Events ──────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);

  const events = await Promise.all([
    prisma.event.upsert({
      where: { externalId: 'demo-jazz-parque' },
      update: {},
      create: {
        externalId: 'demo-jazz-parque',
        title: 'Festival de Jazz no Parque',
        description: 'Uma tarde inesquecível com os melhores músicos de jazz da cena nacional. Leve sua cadeira de praia!',
        category: 'SHOWS',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0),
        address: 'Campinas, SP',
        isFree: false,
        price: 50,
        priceLabel: 'R$ 50,00',
        sourceApi: 'manual',
      },
    }),
    prisma.event.upsert({
      where: { externalId: 'demo-galeria-novos' },
      update: {},
      create: {
        externalId: 'demo-galeria-novos',
        title: 'Galeria Aberta: Novos Talentos',
        description: 'Exposição coletiva de artistas emergentes da cena urbana regional. Entrada franca.',
        category: 'EXPOSICAO',
        date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
        endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0),
        address: 'Campinas, SP',
        isFree: true,
        priceLabel: 'Grátis',
        sourceApi: 'manual',
      },
    }),
    prisma.event.upsert({
      where: { externalId: 'demo-rock-city' },
      update: {},
      create: {
        externalId: 'demo-rock-city',
        title: 'Rock in the City',
        description: 'O maior evento de rock alternativo do ano chega a Campinas com mais de 30 bandas regionais e experiências gastronômicas.',
        category: 'SHOWS',
        date: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 18, 0),
        endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1, 2, 0),
        address: 'Campinas, SP',
        isFree: false,
        price: 180,
        priceLabel: 'R$ 180,00',
        ticketUrl: 'https://www.ticketmaster.com.br',
        sourceApi: 'manual',
      },
    }),
    prisma.event.upsert({
      where: { externalId: 'demo-trilha-ecologica' },
      update: {},
      create: {
        externalId: 'demo-trilha-ecologica',
        title: 'Trilha Ecológica ao Amanhecer',
        description: 'Caminhada guiada pela mata ao nascer do sol. Inclui café da manhã orgânico.',
        category: 'AR_LIVRE',
        date: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1, 5, 0),
        endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1, 10, 0),
        isFree: false,
        price: 40,
        priceLabel: 'R$ 40,00',
        sourceApi: 'manual',
      },
    }),
  ]);

  console.log(`✓ ${events.length} eventos criados`);
  console.log('✅ Seed concluído!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
