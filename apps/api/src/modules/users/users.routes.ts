import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './users.repository.ts';
import { notFound, forbidden, conflict, problemFromZod } from '../../shared/errors.ts';
import { hashPassword } from '../../shared/password.ts';
import { auditLog } from '../../shared/audit.ts';
import { sendMail } from '../../shared/mailer.ts';
import { randomBytes } from 'node:crypto';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/users
  app.get('/admin/users', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const q = req.query as { page?: string; pageSize?: string };
    const [users, total] = await repo.listUsers(Number(q.page) || 1, Number(q.pageSize) || 20);
    return rep.send({ data: users, meta: { total } });
  });

  // GET /admin/users/:id
  app.get('/admin/users/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const { id } = req.params as { id: string };
    const user = await repo.findUserById(id);
    if (!user) return notFound(rep);
    return rep.send(user);
  });

  // POST /admin/users
  app.post('/admin/users', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(['ADMIN', 'EDITOR', 'SALES']),
      password: z.string().min(8).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    // Gera password aleatória se não fornecida
    const password = parsed.data.password ?? randomBytes(12).toString('hex');
    const passwordHash = await hashPassword(password);

    const user = await repo.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
    }).catch(() => null);

    if (!user) return conflict(rep, 'Já existe um utilizador com este email.');

    await auditLog({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      diff: { name: user.name, email: user.email, role: user.role },
    });

    return rep.status(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    });
  });

  // PATCH /admin/users/:id
  app.patch('/admin/users/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const { id } = req.params as { id: string };
    const user = await repo.findUserById(id);
    if (!user) return notFound(rep);

    const schema = z.object({
      name: z.string().min(2).optional(),
      role: z.enum(['ADMIN', 'EDITOR', 'SALES']).optional(),
      active: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const updated = await repo.updateUser(id, parsed.data);
    await auditLog({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      diff: parsed.data,
    });
    return rep.send(updated);
  });

  // POST /admin/users/:id/invite — reenvia email com reset de password
  app.post('/admin/users/:id/invite', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const { id } = req.params as { id: string };
    const user = await repo.findUserById(id);
    if (!user) return notFound(rep);

    await sendMail({
      to: user.email,
      subject: 'Convite para o backoffice — Private Motors',
      text: `Olá ${user.name},\n\nFoi criada uma conta para si no backoffice da Private Motors.\nAceda a /admin e defina a sua password.\n\nEquipa Private Motors`,
    });
    return rep.send({ ok: true });
  });
}
