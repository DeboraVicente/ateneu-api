// Especificação OpenAPI escrita manualmente (em vez de swagger-jsdoc lendo
// comentários espalhados pelas rotas) — mantém a documentação centralizada e
// fácil de revisar num único lugar.
const BASE_URL = process.env.SWAGGER_SERVER_URL || 'http://localhost:3000';

const Place = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    category: { type: 'string', example: 'PARQUE' },
    address: { type: 'string' },
    lat: { type: 'number' },
    lng: { type: 'number' },
    phone: { type: 'string', nullable: true },
    website: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    isFree: { type: 'boolean' },
    priceLevel: { type: 'integer', nullable: true },
    isActive: { type: 'boolean' },
  },
};

const Event = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    category: { type: 'string', example: 'SHOWS' },
    date: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time', nullable: true },
    address: { type: 'string', nullable: true },
    isFree: { type: 'boolean' },
    price: { type: 'number', nullable: true },
    priceLabel: { type: 'string', nullable: true },
    ticketUrl: { type: 'string', nullable: true },
    place: { type: 'object', nullable: true },
  },
};

const User = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['USER', 'ADMIN'] },
    avatarUrl: { type: 'string', nullable: true },
  },
};

const paginated = (itemsRef: string) => ({
  type: 'object',
  properties: {
    data: { type: 'array', items: { $ref: itemsRef } },
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    pages: { type: 'integer' },
  },
});

const errorResponse = {
  description: 'Erro',
  content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } },
};

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Ateneu API',
    version: '1.0.0',
    description:
      'API REST do Ateneu — Guia Digital de Lazer e Economia Local de Campinas. ' +
      'Fornece dados de estabelecimentos, eventos culturais, favoritos e autenticação de usuários.',
  },
  servers: [{ url: BASE_URL }],
  tags: [
    { name: 'Auth', description: 'Cadastro, login e sessão do usuário' },
    { name: 'Places', description: 'Estabelecimentos e locais de lazer' },
    { name: 'Events', description: 'Eventos culturais' },
    { name: 'Favorites', description: 'Favoritos do usuário autenticado' },
    { name: 'Movies', description: 'Filmes em cartaz (integração TMDB)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { Place, Event, User },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cria uma nova conta de usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Conta criada',
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, refreshToken: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } },
          },
          400: errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica um usuário existente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login efetuado',
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, refreshToken: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } },
          },
          401: errorResponse,
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Retorna os dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Usuário atual', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          401: errorResponse,
        },
      },
    },
    '/api/places': {
      get: {
        tags: ['Places'],
        summary: 'Lista estabelecimentos, com filtros e paginação',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Uma ou mais categorias separadas por vírgula' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'Latitude do usuário, para busca por proximidade' },
          { name: 'lng', in: 'query', schema: { type: 'number' } },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 10 }, description: 'Raio em km (usado junto de lat/lng)' },
          { name: 'isFree', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Lista paginada', content: { 'application/json': { schema: paginated('#/components/schemas/Place') } } } },
      },
      post: {
        tags: ['Places'],
        summary: 'Cria um novo estabelecimento (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Place' } } } },
        responses: { 201: { description: 'Criado', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Place' } } } } } }, 400: errorResponse, 401: errorResponse, 403: errorResponse },
      },
    },
    '/api/places/sync-osm': {
      post: {
        tags: ['Places'],
        summary: 'Importa/atualiza locais de Campinas via OpenStreetMap Overpass API (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'category', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'Sincronizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } }, 401: errorResponse, 403: errorResponse, 500: errorResponse },
      },
    },
    '/api/places/{id}': {
      get: {
        tags: ['Places'],
        summary: 'Detalhe de um estabelecimento (com avaliações recentes)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Local encontrado', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Place' } } } } } }, 404: errorResponse },
      },
      patch: {
        tags: ['Places'],
        summary: 'Atualiza um estabelecimento (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Atualizado' }, 401: errorResponse, 403: errorResponse },
      },
      delete: {
        tags: ['Places'],
        summary: 'Desativa (soft delete) um estabelecimento (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Desativado' }, 401: errorResponse, 403: errorResponse },
      },
    },
    '/api/events': {
      get: {
        tags: ['Events'],
        summary: 'Lista eventos culturais, com filtros e paginação',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filtra por um dia específico (YYYY-MM-DD)' },
          { name: 'isFree', in: 'query', schema: { type: 'boolean' } },
          { name: 'upcoming', in: 'query', schema: { type: 'boolean', default: true }, description: 'Se true, retorna apenas eventos ainda não encerrados' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Lista paginada', content: { 'application/json': { schema: paginated('#/components/schemas/Event') } } } },
      },
      post: {
        tags: ['Events'],
        summary: 'Cria um novo evento (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
        responses: { 201: { description: 'Criado', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Event' } } } } } }, 400: errorResponse, 401: errorResponse, 403: errorResponse },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Detalhe de um evento (com o local associado)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Evento encontrado', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Event' } } } } } }, 404: errorResponse },
      },
    },
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Lista os favoritos do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Favoritos' }, 401: errorResponse },
      },
      post: {
        tags: ['Favorites'],
        summary: 'Adiciona um local ou evento aos favoritos',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { placeId: { type: 'string' }, eventId: { type: 'string' } } } } } },
        responses: { 201: { description: 'Adicionado' }, 400: errorResponse, 401: errorResponse },
      },
    },
    '/api/favorites/{id}': {
      delete: {
        tags: ['Favorites'],
        summary: 'Remove um favorito pelo id do registro de favorito',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Removido' }, 401: errorResponse, 404: errorResponse },
      },
    },
    '/api/favorites/place/{placeId}': {
      delete: {
        tags: ['Favorites'],
        summary: 'Remove um local dos favoritos pelo id do local',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'placeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Removido' }, 401: errorResponse },
      },
    },
    '/api/movies/now-playing': {
      get: {
        tags: ['Movies'],
        summary: 'Filmes em cartaz (metadados via TMDB, sem horário de sessão)',
        parameters: [{ name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }],
        responses: { 200: { description: 'Lista de filmes' }, 500: errorResponse },
      },
    },
  },
};
