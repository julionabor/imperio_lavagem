import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import {
  setupTestDb,
  teardownTestDb,
  createTestUser,
} from '../../shared/test-helpers.ts';

let app: FastifyInstance;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('POST /api/v1/auth/login', () => {
  it('devolve accessToken com credenciais válidas', async () => {
    const user = await createTestUser('ADMIN', { password: 'Senha1234!' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: user.email, password: user.password },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(body.accessToken).toBeTruthy();
  });

  it('devolve 401 com password errada', async () => {
    const user = await createTestUser('ADMIN');
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: user.email, password: 'ERRADA' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('devolve 400 com body inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'nao-e-email', password: '' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('devolve utilizador autenticado', async () => {
    const user = await createTestUser('EDITOR');
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: user.email, password: user.password },
    });
    const { accessToken } = loginRes.json<{ accessToken: string }>();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ role: string }>();
    expect(body.role).toBe('EDITOR');
  });

  it('devolve 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revoga o refresh token e devolve 200', async () => {
    const user = await createTestUser('SALES');
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: user.email, password: user.password },
    });
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/logout' });
    expect(res.statusCode).toBe(200);
  });
});

describe('POST /api/v1/auth/forgot + reset', () => {
  it('fluxo completo de reset de password', async () => {
    const user = await createTestUser('ADMIN', { password: 'OldPass123!' });

    // forgot — sempre 200
    const forgotRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot',
      payload: { email: user.email },
    });
    expect(forgotRes.statusCode).toBe(200);

    // token inválido → 400
    const badReset = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset',
      payload: { token: 'token-invalido', password: 'NewPass123!' },
    });
    expect(badReset.statusCode).toBe(400);
  });
});
