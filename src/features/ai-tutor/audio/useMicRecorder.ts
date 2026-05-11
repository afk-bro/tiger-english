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
  stop: () => void;
  cancel: () => void;
  reset: () => void;
}

const DEFAULT_MAX_MS = 20_000;

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

  const cleanupStream = useCallback((s: MediaStream | null) => {
    s?.getTracks().forEach((t) => t.stop());
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    rec.stop();
    clearTimer();
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
        void reportTutorEvent('mic.denied', {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        });
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
        return;
      }
      const finalBlob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      cleanupStream(acquired);
      streamRef.current = null;
      setStream(null);
      setBlob(finalBlob);
      setState('stopped');
    };

    rec.start();
    setState('recording');

    timerRef.current = window.setTimeout(() => {
      stop();
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
