import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Places ──────────────────────────────────────────────
  const places = await Promise.all([
    prisma.place.upsert({
      where: { externalId: 'demo-mac' },
      update: {},
      create: {
        name: 'Museu de Arte Contemporânea',
        description: 'Um dos principais museus de arte moderna da América Latina, com acervo de mais de 10.000 obras.',
        category: 'MUSEU',
        address: 'Parque do Ibirapuera, Portão 3 — São Paulo, SP',
        lat: -23.5874,
        lng: -46.6576,
        isFree: true,
        externalId: 'demo-mac',
        openingHours: {
          'ter-dom': '10:00–18:00',
          'seg': 'Fechado',
        },
      },
    }),
    prisma.place.upsert({
      where: { externalId: 'demo-parque-ibira' },
      update: {},
      create: {
        name: 'Parque Ibirapuera',
        description: 'O maior parque urbano de São Paulo, com lagos, museus, anfiteatro e extensas áreas verdes.',
        category: 'PARQUE',
        address: 'Av. Pedro Álvares Cabral — São Paulo, SP',
        lat: -23.5872,
        lng: -46.6577,
        isFree: true,
        externalId: 'demo-parque-ibira',
        openingHours: {
          'todos os dias': '05:00–00:00',
        },
      },
    }),
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
    prisma.place.upsert({
      where: { externalId: 'demo-restaurante-1' },
      update: {},
      create: {
        name: 'Pasta & Vino Gourmet',
        description: 'Restaurante italiano com massas artesanais e carta de vinhos cuidadosamente selecionada.',
        category: 'GASTRONOMIA',
        address: 'Rua Coronel Quirino, 1400 — Campinas, SP',
        lat: -22.9081,
        lng: -47.0612,
        isFree: false,
        priceLevel: 3,
        externalId: 'demo-restaurante-1',
        openingHours: {
          'seg-sab': '12:00–22:30',
          'dom': '12:00–16:00',
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
        address: 'Parque Ibirapuera — São Paulo, SP',
        lat: -23.5872,
        lng: -46.6577,
        isFree: false,
        price: 50,
        priceLabel: 'R$ 50,00',
        sourceApi: 'manual',
        placeId: places[1].id,
      },
    }),
    prisma.event.upsert({
      where: { externalId: 'demo-wine-tapas' },
      update: {},
      create: {
        externalId: 'demo-wine-tapas',
        title: 'Noite de Degustação Wine & Tapas',
        description: 'Degustação com vinhos nacionais e tapas espanholas artesanais. Experiência guiada por sommeliers.',
        category: 'GASTRONOMIA',
        date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 20, 30),
        endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59),
        isFree: false,
        price: 120,
        priceLabel: 'R$ 120,00',
        sourceApi: 'manual',
        placeId: places[5].id,
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
        isFree: true,
        priceLabel: 'Grátis',
        sourceApi: 'manual',
        placeId: places[0].id,
      },
    }),
    prisma.event.upsert({
      where: { externalId: 'demo-rock-city' },
      update: {},
      create: {
        externalId: 'demo-rock-city',
        title: 'Rock in the City 2024',
        description: 'O maior evento de rock alternativo do ano chega à capital com mais de 30 bandas internacionais e experiências gastronômicas.',
        category: 'SHOWS',
        date: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 18, 0),
        endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1, 2, 0),
        address: 'Parque Ibirapuera — São Paulo, SP',
        lat: -23.5872,
        lng: -46.6577,
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
        description: 'Caminhada guiada pela Serra da Cantareira ao nascer do sol. Inclui café da manhã orgânico.',
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
