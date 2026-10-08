import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/app/**'],
      exclude: ['src/app/**/*.spec.ts', 'src/app/**/*.d.ts'],
    },
  },
});
