import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as service from './auth.service.ts';
import * as repo from './auth.repository.ts';
import { problem, problemFromZod, unauthorized } from '../../shared/errors.ts';
import type { JwtPayload } from '../../types.ts';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/login
  app.post('/auth/login', async (req, rep) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const result = await service.login(parsed.data.email, parsed.data.password);
    if (!result) return problem(rep, 401, 'Credenciais inválidas', 'Email ou password incorretos.');

    const { user, refreshTokenRaw } = result;
    const payload: JwtPayload = { id: user.id, role: user.role, name: user.name };
    const accessToken = app.jwt.sign(payload);

    rep.setCookie(REFRESH_COOKIE, refreshTokenRaw, COOKIE_OPTS);
    return rep.send({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // POST /auth/refresh
  app.post('/auth/refresh', async (req, rep) => {
    const raw = req.cookies[REFRESH_COOKIE];
    if (!raw) return unauthorized(rep, 'Refresh token em falta.');

    const result = await service.refresh(raw);
    if (!result) return unauthorized(rep, 'Refresh token inválido ou expirado.');

    const { user, refreshTokenRaw } = result;
    const payload: JwtPayload = { id: user.id, role: user.role, name: user.name };
    const accessToken = app.jwt.sign(payload);

    rep.setCookie(REFRESH_COOKIE, refreshTokenRaw, COOKIE_OPTS);
    return rep.send({ accessToken });
  });

  // POST /auth/logout
  app.post('/auth/logout', async (req, rep) => {
    const raw = req.cookies[REFRESH_COOKIE];
    if (raw) await service.logout(raw);
    rep.clearCookie(REFRESH_COOKIE, { path: COOKIE_OPTS.path });
    return rep.send({ ok: true });
  });

  // GET /auth/me
  app.get('/auth/me', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = await repo.findUserById(req.user!.id);
    if (!user || !user.active) return unauthorized(rep);
    return rep.send({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  // POST /auth/forgot
  app.post('/auth/forgot', async (req, rep) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const origin = req.headers['origin'] ?? 'http://localhost:4200';
    await service.forgotPassword(parsed.data.email, origin as string);
    // Sempre 200 — não revelar se o email existe
    return rep.send({ ok: true });
  });

  // POST /auth/reset
  app.post('/auth/reset', async (req, rep) => {
    const schema = z.object({
      token: z.string().min(1),
      password: z.string().min(8),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const ok = await service.resetPassword(parsed.data.token, parsed.data.password);
    if (!ok) return problem(rep, 400, 'Token inválido', 'Token expirado ou já utilizado.');
    return rep.send({ ok: true });
  });
}
