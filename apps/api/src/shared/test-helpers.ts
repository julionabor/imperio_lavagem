/**
 * Utilitários para testes de integração da API.
 * Usa app.inject() contra a base pm_test.
 * A base é limpa antes de cada ficheiro de testes.
 */
import { type FastifyInstance } from 'fastify';
import { prisma } from './prisma-client.ts';
import { hashPassword } from './password.ts';
import type { UserRole } from '@prisma/client';

// ── Limpeza da base de dados ──────────────────────────────────────────────

/** Limpa todas as tabelas pela ordem inversa das dependências. */
export async function cleanDatabase(): Promise<void> {
  const tables = [
    'AuditLog',
    'Task',
    'Activity',
    'TradeIn',
    'Lead',
    'VehicleInterest',
    'Contact',
    'PipelineStage',
    'Tag',
    'FeaturedPlacement',
    'VehicleBadge',
    'VehicleEquipment',
    'VehicleImage',
    'Vehicle',
    'RefreshToken',
    'User',
    'AssistantStep',
    'AssistantSettings',
    'FinancingProduct',
    'Badge',
    'EquipmentItem',
    'Model',
    'Brand',
    'SearchSynonym',
    'Testimonial',
    'Advantage',
    'QuickFilter',
    'SearchExample',
    'NavItem',
    'HomeContent',
    'AboutContent',
    'SiteSettings',
    'LegalPage',
  ];
  // Usa transação para velocidade
  const ops = tables.map((t) =>
    (prisma as unknown as Record<string, { deleteMany: () => Promise<unknown> }>)[
      t.charAt(0).toLowerCase() + t.slice(1)
    ].deleteMany(),
  );
  await prisma.$transaction(ops as unknown as Parameters<typeof prisma.$transaction>[0]);
}

// ── Fixtures ─────────────────────────────────────────────────────────────

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

let _userCounter = 0;

export async function createTestUser(
  role: UserRole = 'ADMIN',
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<TestUser> {
  _userCounter++;
  const password = overrides.password ?? 'TestPassword1!';
  const email = overrides.email ?? `test${_userCounter}@privatemotors.pt`;
  const name = overrides.name ?? `Test User ${_userCounter}`;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      active: true,
    },
  });
  return { id: user.id, email, password, role, name };
}

/** Faz login e devolve o access token. */
export async function loginUser(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });
  const body = res.json<{ accessToken: string }>();
  return body.accessToken;
}

/** Cria e faz login de um utilizador de teste, devolvendo o token. */
export async function createAndLoginUser(
  app: FastifyInstance,
  role: UserRole = 'ADMIN',
): Promise<{ user: TestUser; token: string }> {
  const user = await createTestUser(role);
  const token = await loginUser(app, user.email, user.password);
  return { user, token };
}

/** Header de autorização Bearer. */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

// ── Setup/teardown para vitest ─────────────────────────────────────────────

/** Usa em beforeAll de cada spec para limpar a base. */
export async function setupTestDb(): Promise<void> {
  await cleanDatabase();
  _userCounter = 0;
}

/** Fecha o PrismaClient depois dos testes. */
export async function teardownTestDb(): Promise<void> {
  await prisma.$disconnect();
}
