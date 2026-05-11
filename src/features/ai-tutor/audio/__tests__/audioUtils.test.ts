import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { negotiateRecordMime, isBrowserSupported, unlockAudioOnGesture } from '../audioUtils';

describe('negotiateRecordMime', () => {
  let originalMR: any;
  beforeEach(() => {
    originalMR = (globalThis as any).MediaRecorder;
  });
  afterEach(() => {
    (globalThis as any).MediaRecorder = originalMR;
  });

  it('prefers webm/opus when supported', () => {
    (globalThis as any).MediaRecorder = { isTypeSupported: (m: string) => m === 'audio/webm;codecs=opus' };
    expect(negotiateRecordMime()).toBe('audio/webm;codecs=opus');
  });

  it('falls back to mp4 on iOS Safari', () => {
    (globalThis as any).MediaRecorder = { isTypeSupported: (m: string) => m === 'audio/mp4' };
    expect(negotiateRecordMime()).toBe('audio/mp4');
  });

  it('returns empty string when nothing supported', () => {
    (globalThis as any).MediaRecorder = { isTypeSupported: () => false };
    expect(negotiateRecordMime()).toBe('');
  });

  it('returns empty string when MediaRecorder is undefined', () => {
    delete (globalThis as any).MediaRecorder;
    expect(negotiateRecordMime()).toBe('');
  });
});

describe('isBrowserSupported', () => {
  let originalMR: any;
  let originalAC: any;
  beforeEach(() => {
    originalMR = (globalThis as any).MediaRecorder;
    originalAC = (globalThis as any).AudioContext;
  });
  afterEach(() => {
    (globalThis as any).MediaRecorder = originalMR;
    (globalThis as any).AudioContext = originalAC;
  });

  it('returns ok=true when both APIs present', () => {
    (globalThis as any).MediaRecorder = { isTypeSupported: () => true };
    (globalThis as any).AudioContext = class {};
    const { ok, missing } = isBrowserSupported();
    expect(ok).toBe(true);
    expect(missing).toEqual([]);
  });

  it('returns missing list when MediaRecorder absent', () => {
    delete (globalThis as any).MediaRecorder;
    (globalThis as any).AudioContext = class {};
    const { ok, missing } = isBrowserSupported();
    expect(ok).toBe(false);
    expect(missing).toContain('MediaRecorder');
  });

  it('returns missing list when AudioContext absent', () => {
    (globalThis as any).MediaRecorder = { isTypeSupported: () => true };
    delete (globalThis as any).AudioContext;
    delete (globalThis as any).webkitAudioContext;
    const { ok, missing } = isBrowserSupported();
    expect(ok).toBe(false);
    expect(missing).toContain('AudioContext');
  });
});

describe('unlockAudioOnGesture', () => {
  it('does not throw on first call', () => {
    // jsdom doesn't support real Audio playback; just ensure no throw
    expect(() => unlockAudioOnGesture()).not.toThrow();
  });

  it('is idempotent on repeat calls', () => {
    expect(() => unlockAudioOnGesture()).not.toThrow();
    expect(() => unlockAudioOnGesture()).not.toThrow();
  });
});
