import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Vite supabase client (src/lib/supabase.ts) calls createClient at module-load,
// which throws if VITE_SUPABASE_URL is empty. CI containers don't have a .env,
// so without these stubs every test that transitively imports supabase fails
// on import. Values are intentionally fake — tests don't actually network.
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
}