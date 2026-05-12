/**
 * useMicRecorder — React hook wrapping MediaRecorder for the AI Tutor.
 *
 * Owns: MIME negotiation, gUM acquisition, recording lifecycle, hard 20s cap,
 * stream cleanup, and mic_denied telemetry. Exposes the live MediaStream so
 * a sibling hook (useWaveform) can attach an analyser.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { negotiateRecordMime } from './audioUtils';
import { reportTutorEvent } from '../api/events';

export type MicError =
  | { cause: 'mic_denied'; message: string }
  | { cause: 'no_device'; message: string }
  | { cause: 'unsupported'; message: string };

export type MicState = 'idle' | 'requesting' | 'recording' | 'stopped';

export interface UseMicRecorder {
  state: MicState;
  error: MicError | null;
  blob: Blob | null;
  mimeType: string;
  stream: MediaStream | null;
  start: () => Promise<void>;
  /**
   * Stops recording and resolves with the final blob once
   * `MediaRecorder.onstop` has fired. Callers can `await` this to avoid the
   * stale-closure trap where `mic.blob` is still `null` at the time of a
   * Submit-button click (React hasn't yet committed `setBlob`). Resolves
   * with `{ blob: null, mimeType: '' }` if there is no active recording, or
   * if `cancel()` raced the stop.
   */
  stop: () => Promise<{ blob: Blob | null; mimeType: string }>;
  cancel: () => void;
  reset: () => void;
}

const DEFAULT_MAX_MS = 20_000;

/**
 * Coarsen the user-agent into a (browser, os) bucket for mic.denied telemetry.
 *
 * We want enough signal to answer "which browser+OS combo denies mic?" without
 * shipping the raw UA string (mild fingerprinting / PII).
 *
 * Detection notes:
 *  - Order matters because UAs nest brand tokens (every Chromium derivative
 *    contains "chrome"; every iOS browser contains "safari"). We check the
 *    more-specific tokens first.
 *  - iOS Chrome / Firefox / Edge use distinct tokens (CriOS / FxiOS / EdgiOS)
 *    rather than the desktop tokens. Without those checks they'd all fall
 *    through to "safari".
 *  - iPadOS 13+ in desktop mode reports a Mac UA with no "iPad" token. The
 *    standard workaround is to check `navigator.maxTouchPoints > 1` —
 *    desktop Macs report 0. Pass it in so the function stays pure.
 */
export function coarseUserAgent(
  ua: string,
  maxTouchPoints: number = 0,
): {
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'other';
  os: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other';
} {
  const s = ua.toLowerCase();

  let browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'other' = 'other';
  if (s.includes('edg/') || s.includes('edge/') || s.includes('edgios/')) browser = 'edge';
  else if (s.includes('firefox/') || s.includes('fxios/')) browser = 'firefox';
  else if (s.includes('chrome/') || s.includes('crios/')) browser = 'chrome';
  else if (s.includes('safari/')) browser = 'safari';

  let os: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other' = 'other';
  const looksLikeMac = s.includes('mac os') || s.includes('macintosh');
  if (s.includes('android')) os = 'android';
  else if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod')) os = 'ios';
  else if (s.includes('windows')) os = 'windows';
  // iPadOS desktop-mode disambiguation: Mac UA + touch-capable === iPad.
  else if (looksLikeMac && maxTouchPoints > 1) os = 'ios';
  else if (looksLikeMac) os = 'macos';
  else if (s.includes('linux')) os = 'linux';

  return { browser, os };
}

export function useMicRecorder({ maxMs = DEFAULT_MAX_MS }: { maxMs?: number } = {}): UseMicRecorder {
  const [state, setState] = useState<MicState>('idle');
  const [error, setError] = useState<MicError | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef<boolean>(false);
  // Track latest stream synchronously so unmount-cleanup can reach it without
  // re-running the effect (we want unmount-only semantics).
  const streamRef = useRef<MediaStream | null>(null);
  // Pending resolver for the current `stop()` call. The recorder's `onstop`
  // handler resolves this with the final blob, so callers can await the real
  // mic output instead of polling React state for `setBlob` to commit.
  const stopResolverRef = useRef<
    ((value: { blob: Blob | null; mimeType: string }) => void) | null
  >(null);

  const cleanupStream = useCallback((s: MediaStream | null) => {
    s?.getTracks().forEach((t) => t.stop());
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback((): Promise<{ blob: Blob | null; mimeType: string }> => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') {
      return Promise.resolve({ blob: null, mimeType: '' });
    }
    return new Promise((resolve) => {
      // If a prior `stop()` is somehow still pending (shouldn't normally
      // happen — recorder only stops once), resolve it with a null blob so
      // the caller doesn't hang forever.
      stopResolverRef.current?.({ blob: null, mimeType: '' });
      stopResolverRef.current = resolve;
      rec.stop();
      clearTimer();
    });
  }, [clearTimer]);

  const cancel = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    cancelledRef.current = true;
    rec.stop();
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    setState('idle');
    setBlob(null);
    setError(null);
    setMimeType('');
    chunksRef.current = [];
    cancelledRef.current = false;
  }, []);

  const start = useCallback(async () => {
    // Re-entrancy guard: only start from a clean state.
    if (recorderRef.current && recorderRef.current.state !== 'inactive') return;

    setError(null);
    setBlob(null);
    chunksRef.current = [];
    cancelledRef.current = false;

    const mime = negotiateRecordMime();
    if (!mime) {
      setError({
        cause: 'unsupported',
        message: 'Recording is not supported in this browser.',
      });
      return;
    }

    setState('requesting');

    let acquired: MediaStream;
    try {
      acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const err = e as DOMException;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({ cause: 'mic_denied', message: 'Microphone access denied.' });
        // Fire telemetry BEFORE flipping state back to idle so observers that
        // react to state transitions can rely on the event ordering.
        // Send coarsened browser+OS buckets instead of the raw UA string to
        // avoid mild user fingerprinting. navigator.platform is dropped — it's
        // deprecated and redundant once os is in place.
        const { browser, os } = coarseUserAgent(
          navigator.userAgent || '',
          navigator.maxTouchPoints || 0,
        );
        void reportTutorEvent('mic.denied', { browser, os });
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setError({ cause: 'no_device', message: 'No microphone found.' });
      } else {
        setError({
          cause: 'unsupported',
          message: err?.message || 'Microphone unavailable.',
        });
      }
      setState('idle');
      return;
    }

    streamRef.current = acquired;
    setStream(acquired);
    setMimeType(mime);

    const rec = new MediaRecorder(acquired, { mimeType: mime });
    recorderRef.current = rec;

    rec.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.onstop = () => {
      if (cancelledRef.current) {
        chunksRef.current = [];
        cleanupStream(acquired);
        streamRef.current = null;
        setStream(null);
        setState('idle');
        cancelledRef.current = false;
        stopResolverRef.current?.({ blob: null, mimeType: '' });
        stopResolverRef.current = null;
        return;
      }
      const finalBlob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      cleanupStream(acquired);
      streamRef.current = null;
      setStream(null);
      setBlob(finalBlob);
      setState('stopped');
      stopResolverRef.current?.({ blob: finalBlob, mimeType: mime });
      stopResolverRef.current = null;
    };

    rec.start();
    setState('recording');

    timerRef.current = window.setTimeout(() => {
      // Fire-and-forget: the hard cap doesn't need to await the resolver
      // (no caller is on the other end of the timer-triggered stop). State
      // assertions still observe the `setState('stopped')` from onstop.
      void stop();
    }, maxMs);
  }, [maxMs, cleanupStream, stop]);

  // Cleanup on unmount: stop any active recording + release tracks.
  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // unmount-only — intentionally empty deps
  }, []);

  return { state, error, blob, mimeType, stream, start, stop, cancel, reset };
}
