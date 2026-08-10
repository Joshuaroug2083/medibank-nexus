// vitest.config.js — MediBank Nexus API test configuration
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node environment (Express runs in Node)
    environment: 'node',

    // Glob pattern for test files
    include: ['src/tests/**/*.test.js'],

    // Clear mock state between tests
    clearMocks:   true,
    restoreMocks: true,

    // Show verbose output (useful in CI)
    reporter: ['verbose'],

    // Coverage configuration (run with: npm test -- --coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      exclude: [
        'src/tests/**',
        'src/index.js',     // entry point — hard to unit test
        'src/migrations/**',
        'src/scripts/**',
      ],
    },

    // Setup files run before each test file
    // setupFiles: ['./src/tests/setup.js'],

    // Timeout per test (ms)
    testTimeout: 10_000,
  },
});
