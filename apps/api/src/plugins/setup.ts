/**
 * Regista todos os plugins Fastify na instância raiz.
 * Ordem importa: security → jwt → cookie → swagger → multipart → static → decorators.
 */
import type { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { join, resolve } from 'node:path';
import { config } from '../config.ts';
import { unauthorized } from '../shared/errors.ts';
import type { JwtPayload } from '../types.ts';

const MB = 1024 * 1024;

export async function setupPlugins(app: FastifyInstance): Promise<void> {
  // ── Segurança ───────────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // a API não serve HTML
  });

  await app.register(fastifyCors, {
    origin: [config.WEB_URL, 'http://localhost:4200', 'http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyRateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  // ── Autenticação ────────────────────────────────────────────────────────
  await app.register(fastifyCookie, {
    secret: config.JWT_SECRET, // assina cookies
  });

  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: 'refresh_token', signed: false },
    sign: { expiresIn: '15m' },
  });

  // Decorator: valida JWT obrigatório
  app.decorate(
    'authenticate',
    async function authenticate(req: Parameters<typeof app.authenticate>[0], rep: Parameters<typeof app.authenticate>[1]) {
      try {
        await req.jwtVerify();
      } catch {
        unauthorized(rep);
      }
    },
  );

  // Decorator: valida JWT opcional (não bloqueia se ausente)
  app.decorate(
    'authenticateOptional',
    async function authenticateOptional(req: Parameters<typeof app.authenticateOptional>[0]) {
      try {
        await req.jwtVerify();
      } catch {
        // ignorar — não autenticado é aceitável
      }
    },
  );

  // ── Upload de ficheiros ─────────────────────────────────────────────────
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 15 * MB,
      files: 40,
    },
  });

  // ── Servir uploads ──────────────────────────────────────────────────────
  await app.register(fastifyStatic, {
    root: resolve(config.UPLOAD_DIR),
    prefix: '/uploads/',
    cacheControl: true,
    maxAge: '365d',
    immutable: true,
  });

  // ── OpenAPI / Swagger ──────────────────────────────────────────────────
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Private Motors API',
        description: 'API REST para o site e backoffice do stand automóvel.',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });
}
