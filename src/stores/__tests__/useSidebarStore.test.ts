import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetItem = vi.fn();
const mockSetItem = vi.fn();

vi.stubGlobal('localStorage', {
  getItem: mockGetItem,
  setItem: mockSetItem,
});

// Re-import fresh store instance each test via resetModules
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('useSidebarStore', () => {
  it('defaults to collapsed: false when localStorage key is absent', async () => {
    mockGetItem.mockReturnValue(null);
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('reads persisted collapsed: true from localStorage on init', async () => {
    mockGetItem.mockReturnValue('true');
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it('reads persisted collapsed: false from localStorage on init', async () => {
    mockGetItem.mockReturnValue('false');
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('defaults to false when localStorage value is invalid', async () => {
    mockGetItem.mockReturnValue('not-a-boolean');
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('toggleCollapsed flips collapsed and writes to localStorage', async () => {
    mockGetItem.mockReturnValue('false');
    const { useSidebarStore } = await import('../useSidebarStore');
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().collapsed).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith('sidebar_collapsed', 'true');
  });
});
