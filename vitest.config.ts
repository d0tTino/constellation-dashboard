import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Ensure React's `act` is enabled in the Vitest environment
    // by executing our setup file before each test suite.
    setupFiles: './tests/setup.ts',
  },
});
