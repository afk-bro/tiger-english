import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWaveform } from '../useWaveform';

describe('useWaveform', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mounts without error when stream is null', () => {
    const { result, unmount } = renderHook(() =>
      useWaveform({ stream: null, isActive: false })
    );
    expect(result.current.canvasRef).toBeDefined();
    expect(() => unmount()).not.toThrow();
  });

  it('mounts without error when AudioContext is unavailable', () => {
    // jsdom doesn't have AudioContext — this verifies graceful skip
    const fakeStream = { getTracks: () => [] } as unknown as MediaStream;
    const { unmount } = renderHook(() =>
      useWaveform({ stream: fakeStream, isActive: true })
    );
    expect(() => unmount()).not.toThrow();
  });

  it('mounts and unmounts when AudioContext IS available', () => {
    const ctxMock: {
      state: string;
      createMediaStreamSource: ReturnType<typeof vi.fn>;
      createAnalyser: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    } = {
      state: 'running',
      createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createAnalyser: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn(),
      })),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ctxMock)
    );
    vi.stubGlobal('requestAnimationFrame', (_cb: FrameRequestCallback) => {
      // do not actually loop in tests
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const fakeStream = {} as MediaStream;
    const { unmount } = renderHook(() =>
      useWaveform({ stream: fakeStream, isActive: true })
    );
    unmount();
    expect(ctxMock.close).toHaveBeenCalled();
  });
});
