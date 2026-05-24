import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

const sharedGlobals = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  require: 'readonly',
  module: 'readonly',
  exports: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  fetch: 'readonly',
  Headers: 'readonly',
  HeadersInit: 'readonly',
  RequestInit: 'readonly',
  AbortController: 'readonly',
  DOMException: 'readonly',
  document: 'readonly',
  window: 'readonly',
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  vi: 'readonly',
};

export default [
  {
    ignores: ['dist', 'build', 'node_modules', 'coverage', 'drizzle', 'vitest.config.ts', 'drizzle.config.ts'],
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: sharedGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: sharedGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
    },
  },
];
