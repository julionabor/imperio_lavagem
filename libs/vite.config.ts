import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts', '**/index.ts', '**/vite.config.ts', '**/contracts/**'],
      thresholds: {
        lines: 95,
        functions: 80,
        branches: 93,
        statements: 95,
      },
    },
  },
});
