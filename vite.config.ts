/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import { vendorChunkFor } from './scripts/lib/vendor-chunks';

// Redirect Vite's cache outside node_modules so it works in environments
// where node_modules/.vite isn't writable (sandboxes, read-only mounts).
// Falls back to OS tmpdir, which is portable across Linux/macOS/Windows/CI.
const cacheDir = process.env.VITE_CACHE_DIR ?? path.join(os.tmpdir(), 'tiger-english-vite-cache');

export default defineConfig({
  cacheDir,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunkFor,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/e2e/**',
        'src/test/**',
        'src/main.tsx',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
