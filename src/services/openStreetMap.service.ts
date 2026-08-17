import axios from 'axios';

// Instância pública oficial (overpass-api.de) tem apresentado indisponibilidade
// ("server too busy") mesmo para consultas pequenas — usando o mirror kumi.systems.
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

// Centro de Campinas/SP
const CAMPINAS_LAT = -22.9099;
const CAMPINAS_LNG = -47.0626;
const RADIUS_M = 15000;

// Gastronomia fica de fora: restaurante não é o foco de um guia de cultura/lazer
// (já bem servido por Google Maps/iFood), e é de longe a tag mais numerosa/genérica
// no OpenStreetMap — traria centenas de resultados sem nenhuma curadoria de relevância.
//
// Igreja também fica de fora pelo mesmo motivo: amenity=place_of_worship captura toda
// paróquia/congregação de bairro no OSM, sem distinguir relevância turística/cultural
// (a esmagadora maioria não tem visitação). Igrejas com valor cultural real (Catedral,
// Basílicas etc.) são cadastradas manualmente via POST /api/places.
const CATEGORY_TAG_MAP: Record<string, { key: string; value: string }> = {
  CINEMA:    { key: 'amenity', value: 'cinema' },
  TEATRO:    { key: 'amenity', value: 'theatre' },
  SHOWS:     { key: 'amenity', value: 'nightclub' },
  MUSEU:     { key: 'tourism', value: 'museum' },
  PARQUE:    { key: 'leisure', value: 'park' },
  FEIRA:     { key: 'amenity', value: 'marketplace' },
  EXPOSICAO: { key: 'tourism', value: 'gallery' },
  AR_LIVRE:  { key: 'leisure', value: 'nature_reserve' },
};

export interface OsmPlace {
  externalId: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  openingHours?: { geral: string };
  isFree: boolean;
}

interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildAddress(tags: Record<string, string>) {
  const street = tags['addr:street']
    ? `${tags['addr:street']}${tags['addr:housenumber'] ? ', ' + tags['addr:housenumber'] : ''}`
    : undefined;
  const parts = [street, tags['addr:suburb'], tags['addr:city'] ?? 'Campinas'].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Campinas, SP';
}

// Consulta a Overpass API (OpenStreetMap) por pontos de interesse em Campinas.
// Gratuita, sem chave de API. Documentação: https://wiki.openstreetmap.org/wiki/Overpass_API
export async function fetchOsmPlaces(category?: string): Promise<OsmPlace[]> {
  const normalizedCategory = category?.toUpperCase();
  const wanted = normalizedCategory && CATEGORY_TAG_MAP[normalizedCategory]
    ? [normalizedCategory]
    : Object.keys(CATEGORY_TAG_MAP);

  const clauses = wanted
    .map(cat => CATEGORY_TAG_MAP[cat])
    .filter((entry): entry is { key: string; value: string } => !!entry)
    .map(({ key, value }) =>
      `node["${key}"="${value}"](around:${RADIUS_M},${CAMPINAS_LAT},${CAMPINAS_LNG});\n` +
      `way["${key}"="${value}"](around:${RADIUS_M},${CAMPINAS_LAT},${CAMPINAS_LNG});`
    )
    .join('\n');

  const query = `[out:json][timeout:25];\n(\n${clauses}\n);\nout center tags;`;

  // A instância pública overpass-api.de rejeita (406) o User-Agent padrão do axios;
  // um User-Agent identificando a aplicação também é a etiqueta recomendada pela Overpass API.
  const { data } = await axios.post(OVERPASS_URL, query, {
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': 'Ateneu-TCC/1.0 (+https://github.com/DeboraVicente/ateneu-api)',
    },
  });

  const elements: OsmElement[] = data.elements ?? [];
  const places: OsmPlace[] = [];

  for (const el of elements) {
    const tags = el.tags;
    if (!tags?.name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    const categoryEntry = Object.entries(CATEGORY_TAG_MAP).find(([, v]) => tags[v.key] === v.value);
    const phone   = tags.phone ?? tags['contact:phone'];
    const website = tags.website ?? tags['contact:website'];

    places.push({
      externalId: `osm-${el.type}-${el.id}`,
      name:       tags.name,
      category:   categoryEntry?.[0] ?? 'OUTRO',
      address:    buildAddress(tags),
      lat,
      lng,
      isFree:     tags.fee === 'no',
      ...(phone ? { phone } : {}),
      ...(website ? { website } : {}),
      ...(tags.opening_hours ? { openingHours: { geral: tags.opening_hours } } : {}),
    });
  }

  return places;
}
