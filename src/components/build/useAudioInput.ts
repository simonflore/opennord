import { useCallback, useEffect, useRef, useState } from 'react';
import type { Recorder } from '@/lib/sample-build/record';

/** A microphone or audio interface the browser lists. */
export interface InputDevice { id: string; label: string }

/** Frames per block handed to the recorder: about a tenth of a second at 44.1 kHz. */
const BLOCK = 4096;

/**
 * The browser's audio input, opened while the Record dialog is: its devices, its blocks fed to
 * a recorder when one is set, and the input's own peak for the meters. Raw input (no echo
 * cancelling, noise suppression or automatic gain), so a take is as played. A
 * ScriptProcessorNode carries the blocks, as the organ's fallback does: it needs no worklet file.
 */
export function useAudioInput(deviceId: string | undefined, channels: 1 | 2) {
  const [devices, setDevices] = useState<InputDevice[]>([]);
  const [problem, setProblem] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [levelsDb, setLevelsDb] = useState<number[]>([]);
  const recorder = useRef<Recorder | null>(null);
  const onBlock = useRef<(() => void) | null>(null);

  useEffect(() => {
    const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    const Ctx = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!media?.getUserMedia || !Ctx) { setProblem('Recording needs a browser that can use a microphone; add audio files instead.'); return; }
    let closed = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    (async () => {
      try {
        stream = await media.getUserMedia({
          audio: { ...(deviceId && { deviceId: { exact: deviceId } }), channelCount: channels, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } catch {
        if (!closed) setProblem('OpenNord can’t use the microphone: allow it for this site, or pick another input.');
        return;
      }
      if (closed) { stream.getTracks().forEach((t) => t.stop()); return; }
      const list = await media.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
      if (!closed) setDevices(list.filter((d) => d.kind === 'audioinput').map((d, i) => ({ id: d.deviceId, label: d.label || `Input ${i + 1}` })));
      ctx = new Ctx();
      setRate(ctx.sampleRate);
      const source = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(BLOCK, channels, channels);
      const mute = ctx.createGain();
      mute.gain.value = 0; // runs the processor without playing the input back
      proc.onaudioprocess = (e) => {
        const block = Array.from({ length: e.inputBuffer.numberOfChannels }, (_, c) => e.inputBuffer.getChannelData(c));
        const r = recorder.current;
        if (r && r.state !== 'done') r.push(block);
        setLevelsDb(block.map((ch) => {
          let p = 0;
          for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > p) p = a; }
          return p > 0 ? 20 * Math.log10(p) : -Infinity;
        }));
        onBlock.current?.();
      };
      source.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
      setProblem('');
    })();
    return () => {
      closed = true;
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [deviceId, channels]);

  const setRecorder = useCallback((r: Recorder | null, everyBlock?: () => void) => {
    recorder.current = r;
    onBlock.current = everyBlock ?? null;
  }, []);

  return { devices, problem, rate, levelsDb, setRecorder };
}
