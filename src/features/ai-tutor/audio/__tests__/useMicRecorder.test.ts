import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock the telemetry module BEFORE importing the hook.
vi.mock('@/features/ai-tutor/api/events', () => ({
  reportTutorEvent: vi.fn(() => Promise.resolve()),
}));

import { useMicRecorder } from '../useMicRecorder';
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
  Object.defineProperty(global.navigator, 'userAgent', {
    configurable: true,
    value: 'jest-test-ua',
  });
  Object.defineProperty(global.navigator, 'platform', {
    configurable: true,
    value: 'jest-test-platform',
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

  it('stop() produces a Blob and transitions to stopped', async () => {
    const { result } = renderHook(() => useMicRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.state).toBe('stopped');
    expect(result.current.blob).toBeInstanceOf(Blob);
    expect(result.current.blob?.type).toBe('audio/webm;codecs=opus');
    expect(result.current.blob?.size).toBeGreaterThan(0);
    expect(result.current.stream).toBeNull(); // stream tracks released
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
    expect(reportTutorEvent).toHaveBeenCalledWith('mic.denied', {
      user_agent: 'jest-test-ua',
      platform: 'jest-test-platform',
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
    act(() => {
      result.current.stop();
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
