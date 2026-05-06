/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

// Redirect Vite's cache outside node_modules so it works in environments
// where node_modules/.vite isn't writable (sandboxes, read-only mounts).
// Falls back to OS tmpdir, which is portable across Linux/macOS/Windows/CI.
const cacheDir = process.env.VITE_CACHE_DIR ?? path.join(os.tmpdir(), 'tiger-english-vite-cache');

// Vendor chunk grouping. Splitting heavy third-party deps out of the main
// app bundle lets browsers cache them independently — bumping an app-only
// change doesn't invalidate React's cached chunk, etc. Anything not matched
// here (small utilities like clsx, sonner) ends up in the default vendor
// chunk Rollup builds for shared dependencies.
function vendorChunkFor(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (id.includes('/react-router')) return 'vendor-router';
  if (id.includes('/@supabase/')) return 'vendor-supabase';
  if (id.includes('/i18next') || id.includes('/react-i18next')) return 'vendor-i18n';
  if (
    id.includes('/react-hook-form') ||
    id.includes('/@hookform/') ||
    id.includes('/zod')
  )
    return 'vendor-forms';
  if (
    id.includes('/@headlessui/') ||
    id.includes('/lucide-react') ||
    id.includes('/sonner')
  )
    return 'vendor-ui';
  // React itself goes last so the more specific buckets above (which
  // include react-* packages depending on react) catch first.
  if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
    return 'vendor-react';
  }
  return undefined;
}

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
