import { mkdirSync } from 'node:fs';
import Fastify from 'fastify';
import { config } from './config.ts';
import { setupPlugins } from './plugins/setup.ts';
import { prisma } from './shared/prisma-client.ts';

// Garante que o diretório de uploads existe antes de arrancar
mkdirSync(config.UPLOAD_DIR, { recursive: true });

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // Plugins (security, JWT, CORS, Swagger, etc.)
  await setupPlugins(app);

  // ── Rotas — prefixo /api/v1 ──────────────────────────────────────────────
  await app.register(async (v1) => {
    // Saúde
    v1.get('/health', async () => ({ status: 'ok', env: config.NODE_ENV }));
    v1.get('/ready', async (_req, reply) => {
      await prisma.$queryRaw`SELECT 1`;
      reply.send({ status: 'ok' });
    });

    // Módulos
    const { authRoutes } = await import('./modules/auth/auth.routes.ts');
    const { vehicleRoutes } = await import('./modules/vehicles/vehicles.routes.ts');
    const { imageRoutes } = await import('./modules/images/images.routes.ts');
    const { catalogRoutes } = await import('./modules/catalog/catalog.routes.ts');
    const { financingRoutes } = await import('./modules/financing/financing.routes.ts');
    const { featuredRoutes } = await import('./modules/featured/featured.routes.ts');
    const { contentRoutes } = await import('./modules/content/content.routes.ts');
    const { settingsRoutes } = await import('./modules/settings/settings.routes.ts');
    const { usersRoutes } = await import('./modules/users/users.routes.ts');
    const { auditRoutes } = await import('./modules/audit/audit.routes.ts');
    const { assistantRoutes } = await import('./modules/assistant/assistant.routes.ts');
    const { dashboardRoutes } = await import('./modules/dashboard/dashboard.routes.ts');
    const { leadsRoutes } = await import('./modules/leads/leads.routes.ts');

    await v1.register(authRoutes);
    await v1.register(vehicleRoutes);
    await v1.register(imageRoutes);
    await v1.register(catalogRoutes);
    await v1.register(financingRoutes);
    await v1.register(featuredRoutes);
    await v1.register(contentRoutes);
    await v1.register(settingsRoutes);
    await v1.register(usersRoutes);
    await v1.register(auditRoutes);
    await v1.register(assistantRoutes);
    await v1.register(dashboardRoutes);
    await v1.register(leadsRoutes);
  }, { prefix: '/api/v1' });

  return app;
}

// ── Arranque ──────────────────────────────────────────────────────────────

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`API em http://${config.HOST}:${config.PORT}`);
    app.log.info(`Docs em http://${config.HOST}:${config.PORT}/api/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('A encerrar...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Só arranca se for o ponto de entrada (não quando importado nos testes)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  start();
}
