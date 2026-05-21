import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Include patterns
    include: ['tests/**/*.test.ts'],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      lines: 80,
      functions: 85,
      branches: 75,
      statements: 80,
    },
    
    // Global setup/teardown
    globals: true,
    
    // Reporters
    reporters: ['default'],
    
    // Pool settings
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
