import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock the telemetry module BEFORE importing the hook.
vi.mock('@/features/ai-tutor/api/events', () => ({
  reportTutorEvent: vi.fn(() => Promise.resolve()),
}));

import { useMicRecorder, coarseUserAgent } from '../useMicRecorder';
import { reportTutorEvent } from '../../api/events';

// ---------- Fakes ----------

class FakeMediaStreamTrack {
  stop = vi.fn();
}

class FakeMediaStream {
  private tracks = [new FakeMediaStreamTrack(), new FakeMediaStreamTrack()];
  getTracks() {
    return this.tracks;
  }
}

interface FakeRecorderCtorArgs {
  mimeType: string;
}

// Class form because the hook does `new MediaRecorder(stream, opts)`.
class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType: string;
  ondataavailable: ((ev: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  start = vi.fn(() => {
    this.state = 'recording';
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
    // synthesize a data event then stop event
    this.ondataavailable?.({ data: new Blob(['fake'], { type: this.mimeType }) });
    this.onstop?.();
  });

  constructor(_stream: MediaStream, opts: FakeRecorderCtorArgs) {
    this.mimeType = opts.mimeType;
    FakeMediaRecorder.instances.push(this);
  }
}

const getUserMedia = vi.fn();

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  FakeMediaRecorder.isTypeSupported = vi.fn(() => true);
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue(new FakeMediaStream() as unknown as MediaStream);

  vi.stubGlobal('MediaRecorder', FakeMediaRecorder as unknown as typeof MediaRecorder);

  // jsdom's navigator has no mediaDevices; patch it without replacing the
  // whole navigator object (so userAgent/platform stay valid).
  Object.defineProperty(global.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  // Use a realistic UA so coarseUserAgent can bucket it (Chrome on macOS).
  Object.defineProperty(global.navigator, 'userAgent', {
    configurable: true,
    value:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  (reportTutorEvent as unknown as ReturnType<typeof vi.fn>).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ---------- Tests ----------

describe('useMicRecorder', () => {
  it('start() happy path: idle → requesting → recording, MediaRecorder created with negotiated MIME', async () => {
    const { result } = renderHook(() => useMicRecorder());
    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.start();
    });

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(FakeMediaRecorder.instances).toHaveLength(1);
    expect(FakeMediaRecorder.instances[0].mimeType).toBe('audio/webm;codecs=opus');
    expect(FakeMediaRecorder.instances[0].start).toHaveBeenCalled();
    expect(result.current.state).toBe('recording');
    expect(result.current.mimeType).toBe('audio/webm;codecs=opus');
    expect(result.current.stream).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('stop() resolves with the final Blob + mimeType and transitions to stopped', async () => {
    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    let stopResult: { blob: Blob | null; mimeType: string } | undefined;
    await act(async () => {
      stopResult = await result.current.stop();
    });

    expect(stopResult).toBeDefined();
    expect(stopResult!.blob).toBeInstanceOf(Blob);
    expect(stopResult!.blob!.type).toBe('audio/webm;codecs=opus');
    expect(stopResult!.blob!.size).toBeGreaterThan(0);
    expect(stopResult!.mimeType).toBe('audio/webm;codecs=opus');

    expect(result.current.state).toBe('stopped');
    expect(result.current.blob).toBeInstanceOf(Blob);
    expect(result.current.blob?.type).toBe('audio/webm;codecs=opus');
    expect(result.current.blob?.size).toBeGreaterThan(0);
    expect(result.current.stream).toBeNull(); // stream tracks released
  });

  it('stop() on an inactive recorder resolves with null blob immediately', async () => {
    const { result } = renderHook(() => useMicRecorder());
    // No start() — recorder is null.
    const stopResult = await result.current.stop();
    expect(stopResult.blob).toBeNull();
    expect(stopResult.mimeType).toBe('');
  });

  it('cancel() discards the blob and returns to idle', async () => {
    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.blob).toBeNull();
    expect(result.current.stream).toBeNull();
  });

  it('mic_denied: NotAllowedError sets error AND fires reportTutorEvent', async () => {
    const denied = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    getUserMedia.mockRejectedValueOnce(denied);

    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toEqual({
      cause: 'mic_denied',
      message: expect.any(String),
    });
    // Payload is the coarsened {browser, os} bucket, NOT the raw UA string.
    expect(reportTutorEvent).toHaveBeenCalledWith('mic.denied', {
      browser: 'chrome',
      os: 'macos',
    });
    const payload = (reportTutorEvent as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('user_agent');
    expect(payload).not.toHaveProperty('platform');
    // Defense-in-depth: no field should leak the raw UA substring.
    for (const v of Object.values(payload)) {
      expect(String(v)).not.toContain('Mozilla');
      expect(String(v)).not.toContain('AppleWebKit');
    }
  });

  describe('coarseUserAgent', () => {
    it('buckets common browsers and OSes correctly', () => {
      // Chrome on macOS
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ),
      ).toEqual({ browser: 'chrome', os: 'macos' });

      // Safari on iOS
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
            '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        ),
      ).toEqual({ browser: 'safari', os: 'ios' });

      // Firefox on Windows
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        ),
      ).toEqual({ browser: 'firefox', os: 'windows' });

      // Edge on Windows (must match before chrome substring)
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        ),
      ).toEqual({ browser: 'edge', os: 'windows' });

      // Chrome on Android
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/120.0.0.0 Mobile Safari/537.36',
        ),
      ).toEqual({ browser: 'chrome', os: 'android' });

      // Unknown / empty
      expect(coarseUserAgent('')).toEqual({ browser: 'other', os: 'other' });
      expect(coarseUserAgent('curl/8.0.0')).toEqual({ browser: 'other', os: 'other' });
    });

    it('detects iOS-specific browser tokens (FxiOS, EdgiOS, CriOS) that contain "Safari" but are not Safari', () => {
      // Firefox iOS — UA contains "FxiOS/" and "Safari/" but is Firefox.
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
            '(KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/605.1.15',
        ),
      ).toEqual({ browser: 'firefox', os: 'ios' });

      // Edge iOS — UA contains "EdgiOS/" and "Safari/" but is Edge.
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
            '(KHTML, like Gecko) Version/17.0 EdgiOS/121.0 Mobile/15E148 Safari/604.1',
        ),
      ).toEqual({ browser: 'edge', os: 'ios' });

      // Chrome iOS — already detected via "CriOS", regression-pinning here.
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
            '(KHTML, like Gecko) CriOS/121.0.0.0 Mobile/15E148 Safari/604.1',
        ),
      ).toEqual({ browser: 'chrome', os: 'ios' });
    });

    it('detects Edge on Android via the "EdgA/" token despite "Chrome/" being present', () => {
      // Edge Android UA includes both "Chrome/" and "EdgA/" — without the
      // EdgA check it would bucket as chrome.
      expect(
        coarseUserAgent(
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 EdgA/124.0.0.0',
        ),
      ).toEqual({ browser: 'edge', os: 'android' });
    });

    it('disambiguates iPadOS desktop-mode from a real Mac via maxTouchPoints', () => {
      // iPad on iPadOS 13+ in desktop mode: UA contains "Macintosh", no
      // "iPad" token, but reports maxTouchPoints > 0. Desktop Macs report 0.
      const iPadDesktopModeUa =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) Version/17.0 Safari/605.1.15';

      // Without maxTouchPoints → looks like macOS Safari (the legacy false negative).
      expect(coarseUserAgent(iPadDesktopModeUa)).toEqual({
        browser: 'safari',
        os: 'macos',
      });
      // With maxTouchPoints > 1 → correctly classified as iOS.
      expect(coarseUserAgent(iPadDesktopModeUa, 5)).toEqual({
        browser: 'safari',
        os: 'ios',
      });
      // Real Mac (maxTouchPoints === 0 or undefined) stays as macos.
      expect(coarseUserAgent(iPadDesktopModeUa, 0)).toEqual({
        browser: 'safari',
        os: 'macos',
      });
    });
  });

  it('no_device: NotFoundError sets error, no telemetry', async () => {
    const notFound = Object.assign(new Error('no device'), { name: 'NotFoundError' });
    getUserMedia.mockRejectedValueOnce(notFound);

    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toEqual({
      cause: 'no_device',
      message: expect.any(String),
    });
    expect(reportTutorEvent).not.toHaveBeenCalled();
  });

  it('unsupported: when negotiateRecordMime returns empty (no supported MIMEs)', async () => {
    FakeMediaRecorder.isTypeSupported = vi.fn(() => false);

    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.error).toEqual({
      cause: 'unsupported',
      message: expect.any(String),
    });
  });

  it('hard 20s cap: auto-stops after maxMs', async () => {
    // Use fake timers only for setTimeout — keep microtasks real so the
    // awaited getUserMedia Promise can resolve.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { result } = renderHook(() => useMicRecorder({ maxMs: 20_000 }));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('recording');

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(result.current.state).toBe('stopped');
    expect(result.current.blob).toBeInstanceOf(Blob);
    expect(FakeMediaRecorder.instances[0].stop).toHaveBeenCalledTimes(1);
  });

  it('reset() clears state, blob, error, and mimeType', async () => {
    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.state).toBe('stopped');
    expect(result.current.blob).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.blob).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.mimeType).toBe('');
  });

  it('unmount cleanup stops an active recording and releases tracks', async () => {
    const { result, unmount } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    const rec = FakeMediaRecorder.instances[0];
    expect(rec.state).toBe('recording');

    unmount();

    expect(rec.stop).toHaveBeenCalled();
    expect(rec.state).toBe('inactive');
  });
});
