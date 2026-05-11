import { useEffect, useRef } from 'react';

export interface UseWaveform {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useWaveform({
  stream,
  isActive,
}: {
  stream: MediaStream | null;
  isActive: boolean;
}): UseWaveform {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      return cleanup;
    }

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return cleanup;

    let ctx: AudioContext;
    let source: MediaStreamAudioSourceNode;
    let analyser: AnalyserNode;
    try {
      ctx = new AC();
      source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      // NOTE: do not connect analyser to ctx.destination (would loop back to speakers).
    } catch {
      return cleanup;
    }

    audioCtxRef.current = ctx;
    sourceRef.current = source;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) return;

      analyser.getByteFrequencyData(dataArray);
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      const barWidth = w / bufferLength;
      ctx2d.fillStyle = '#326de2';
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const barHeight = (value / 255) * h;
        const x = i * barWidth;
        const y = h - barHeight;
        ctx2d.fillRect(x, y, Math.max(0, barWidth - 1), barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return cleanup;

    function cleanup() {
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      try {
        sourceRef.current?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        analyserRef.current?.disconnect();
      } catch {
        /* ignore */
      }
      sourceRef.current = null;
      analyserRef.current = null;
      const c = audioCtxRef.current;
      audioCtxRef.current = null;
      if (c && c.state !== 'closed') {
        c.close().catch(() => {
          /* ignore */
        });
      }
    }
  }, [stream, isActive]);

  return { canvasRef };
}
