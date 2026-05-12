/**
 * Browser-side audio helpers for the AI Tutor.
 * - MIME negotiation: pick the best recording MIME the current browser supports.
 * - iOS gesture unlock: warm a muted Audio element on first user click so
 *   subsequent autoplay (TTS responses) works on iOS Safari.
 * - Browser support detection: report missing APIs for the unsupported-browser screen.
 */

const PREFERRED_MIMES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
];

export function negotiateRecordMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of PREFERRED_MIMES) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      // Some browsers throw on unrecognized MIME; treat as unsupported.
    }
  }
  return '';
}

let audioUnlocked = false;

// 1 sample of silent audio, 8-bit PCM, mono, 22050 Hz.
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=';

export function unlockAudioOnGesture(): void {
  if (audioUnlocked) return;
  try {
    const audio = new Audio(SILENT_WAV_DATA_URI);
    audio.muted = true;
    void audio
      .play()
      .then(() => {
        audioUnlocked = true;
      })
      .catch(() => {
        /* gesture not yet committed or no audio support */
      });
  } catch {
    // Some environments (jsdom, very old browsers) throw on Audio construction
  }
}

export function isBrowserSupported(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (typeof MediaRecorder === 'undefined') missing.push('MediaRecorder');
  const hasAudioContext =
    typeof AudioContext !== 'undefined' ||
    typeof (globalThis as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined';
  if (!hasAudioContext) missing.push('AudioContext');
  return { ok: missing.length === 0, missing };
}
