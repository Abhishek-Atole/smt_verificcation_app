import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.pnpm-store/',
        'dist/',
        'build/',
      ],
    },
  },
  resolve: {
    alias: {
      '@smt': path.resolve(__dirname, './packages'),
      '@apps': path.resolve(__dirname, './apps'),
    },
  },
});
