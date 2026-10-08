import { defineConfig } from 'vitest/config';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'node:path';

dotenvConfig({ path: resolve(import.meta.dirname, '.env') });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    // Testes correm sequencialmente (base de dados partilhada)
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.spec.ts'],
    },
    // Variáveis de ambiente para testes
    env: {
      NODE_ENV: 'test',
      // DATABASE_URL_TEST sobrepõe DATABASE_URL — ver shared/prisma-client.ts
    },
  },
});
