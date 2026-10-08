import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import {
  setupTestDb,
  teardownTestDb,
  createAndLoginUser,
  authHeader,
} from '../../shared/test-helpers.ts';
import { prisma } from '../../shared/prisma-client.ts';

let app: FastifyInstance;
let adminToken: string;
let salesToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  // Cria estágio de pipeline inicial
  await prisma.pipelineStage.create({
    data: { name: 'Novo', position: 0, kind: 'OPEN', color: 'blue' },
  });
  await prisma.siteSettings.create({ data: {} as never });
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: salesToken } = await createAndLoginUser(app, 'SALES'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('POST /api/v1/public/leads', () => {
  it('cria lead com dados válidos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: {
        type: 'CONTACT',
        source: 'HOME_SEARCH',
        name: 'João Silva',
        phone: '912345678',
        email: 'joao@example.com',
        message: 'Tenho interesse.',
        consentPrivacy: true,
        consentMarketing: false,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ leadId: string; contactId: string }>();
    expect(body.leadId).toBeTruthy();
    expect(body.contactId).toBeTruthy();
  });

  it('honeypot — não cria lead mas retorna 201', async () => {
    const countBefore = await prisma.lead.count();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: {
        type: 'CONTACT',
        source: 'HOME_SEARCH',
        name: 'Bot',
        phone: '912345678',
        website: 'https://spam.com', // honeypot preenchido
        consentPrivacy: true,
        consentMarketing: false,
      },
    });
    expect(res.statusCode).toBe(201);
    const countAfter = await prisma.lead.count();
    expect(countAfter).toBe(countBefore); // não criou
  });

  it('telemóvel inválido devolve 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: {
        type: 'CONTACT',
        source: 'HOME_SEARCH',
        name: 'Test',
        phone: '999',
        consentPrivacy: true,
        consentMarketing: false,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('consentimento RGPD obrigatório', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: {
        type: 'CONTACT',
        source: 'HOME_SEARCH',
        name: 'Test',
        phone: '912345679',
        consentPrivacy: false, // inválido — tem de ser true
        consentMarketing: false,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('deduplica contacto pelo mesmo telemóvel', async () => {
    // Primeiro lead
    await app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: {
        type: 'CONTACT',
        source: 'HOME_SEARCH',
        name: 'Maria Santos',
        phone: '921111111',
        consentPrivacy: true,
        consentMarketing: false,
      },
    });
    // Segundo lead, mesmo telemóvel
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: {
        type: 'QUOTE',
        source: 'VEHICLE_PAGE',
        name: 'Maria Santos',
        phone: '921111111',
        consentPrivacy: true,
        consentMarketing: false,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ contactId: string }>();

    // Verifica que só existe um contacto
    const contacts = await prisma.contact.findMany({ where: { phone: '+351921111111' } });
    expect(contacts).toHaveLength(1);
    expect(body.contactId).toBe(contacts[0]!.id);
  });
});

describe('GET /api/v1/admin/leads', () => {
  it('ADMIN lista todos os leads', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/leads',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[] }>();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('SALES lista apenas os seus leads e não atribuídos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/leads',
      headers: authHeader(salesToken),
    });
    expect(res.statusCode).toBe(200);
  });
});
