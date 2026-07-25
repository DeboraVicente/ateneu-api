# Ateneu — API

Backend do Ateneu, uma fonte unificada de informações sobre cultura e lazer em Campinas. Serve locais, eventos, favoritos e um enriquecimento de "filmes em cartaz" para o frontend em [`ateneu-web`](../ateneu-web).

## Stack

- Node.js + Express 5 + TypeScript
- Prisma ORM + SQLite (`dev.db`)
- JWT (`jsonwebtoken`) para autenticação, `bcryptjs` para hash de senha
- Zod para validação de payload
- Fontes de dados externas: OpenStreetMap (Overpass API, locais) e TMDB (metadados de filmes em cartaz)

## Pré-requisitos

- Node.js 20+

## Configuração

Crie um `.env` na raiz com:

```
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=<segredo para assinar os tokens>
TMDB_API_KEY=<Read Access Token da TMDB, https://developer.themoviedb.org/docs/getting-started>
```

`DATABASE_URL` é opcional (o schema já usa `file:./dev.db` por padrão). A sincronização de locais via OpenStreetMap (`POST /api/places/sync-osm`) não precisa de chave.

## Rodando o projeto

```bash
npm install
npx prisma migrate dev   # aplica as migrations e gera o client
npm run db:seed          # popula dados iniciais (prisma/seed.ts)
npm run dev               # servidor de desenvolvimento (ts-node-dev, watch)
npm run build              # compila para JS (tsc)
npm run typecheck          # type-check sem emitir
```

Não há suite de testes automatizados ainda (`npm test` é um placeholder).

## Estrutura

```
src/
  server.ts        # bootstrap do Express, monta as rotas
  routes/           # auth, places, events, favorites, movies
  middlewares/       # authMiddleware / adminMiddleware (JWT)
  services/          # integrações externas: OpenStreetMap, TMDB
  lib/                # client do Prisma
prisma/
  schema.prisma       # models: User, Place, Event, Favorite, Review
  migrations/
  seed.ts
scripts/
  spike-apis.ts        # script exploratório usado para validar cobertura de APIs externas
```

## Endpoints

Base: `/api`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | — | Cadastro de usuário |
| POST | `/auth/login` | — | Login, retorna token JWT |
| GET | `/places` | não | Lista locais (filtros: `category`, `search`, `lat`/`lng`+`radius`, `isFree`, paginação) |
| GET | `/places/:id` | não | Detalhe de um local (com reviews) |
| POST | `/places` | admin | Cria local |
| PATCH | `/places/:id` | admin | Atualiza local |
| DELETE | `/places/:id` | admin | Desativa local (soft delete) |
| POST | `/places/sync-osm` | admin | Importa/atualiza locais de Campinas via OpenStreetMap |
| GET | `/events` | não | Lista eventos (filtros: `category`, `search`, `date`, `isFree`, `upcoming`, paginação) |
| GET | `/events/:id` | não | Detalhe de um evento |
| POST | `/events` | admin | Cria evento (cadastro manual, fonte principal de eventos) |
| GET | `/favorites` | sim | Lista favoritos do usuário logado |
| POST | `/favorites` | sim | Favorita um local ou evento |
| DELETE | `/favorites/:id` | sim | Remove um favorito |
| DELETE | `/favorites/place/:placeId` | sim | Remove favorito de um local pelo id do local |
| GET | `/movies/now-playing` | não | Filmes em cartaz no Brasil (metadados via TMDB, sem horário de sessão) |

Login é opcional em toda a navegação; só é exigido para favoritar e para listar favoritos.

## Status do projeto

Este é o backend de um TCC em desenvolvimento ativo. O andamento, decisões de escopo (fontes de dados, dedup, fluxo de organizador) e próximos passos estão documentados em [`ROADMAP.md`](../ROADMAP.md), na raiz do repositório.

Limitações conhecidas: sem `POST /api/auth/refresh` (o frontend já espera por ele, mas ainda não está implementado no backend); sem testes automatizados; distância geográfica calculada via haversine em memória, sem índice espacial (suficiente para o volume atual, não escalável).
