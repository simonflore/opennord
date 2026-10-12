import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { getSharedCtx } from '@/components/sample/audioPlayer';
import { KeyboardZoneMap } from '@/components/sample/KeyboardZoneMap';
import { MidiConnect } from '@/components/sample/MidiConnect';
import { useOptionalMidi } from '@/lib/midi/MidiContext';
import type { NoteSink } from '@/lib/midi/sustain-gate';
import { organParamsFromLayer } from '@/lib/engine/organ/params';
import type { OrganVoice } from '@/lib/engine/organ/organ-voice';
import type { NS4Layer, Ns4OrganFx } from '@/lib/ns4/types';

const NO_ZONES: never[] = [];
const noop = () => {};

/**
 * "Play this organ" — sounds an organ layer of the program right here, from the
 * on-screen keys or a connected MIDI keyboard. Uses OpenNord's own organ model
 * (not Nord's sound): close for the B3 drawbars, percussion and vibrato; a
 * sketch for the other models. The audio engine loads on first press.
 */
export function OrganPlay({ layer, organFx }: { layer: NS4Layer; organFx?: Ns4OrganFx }) {
  const params = useMemo(() => organParamsFromLayer(layer, organFx), [layer, organFx]);
  const midi = useOptionalMidi();
  const [voice, setVoice] = useState<OrganVoice | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'error'>('idle');
  // Bumped on unmount and on Stop: a voice that finishes loading after either is
  // disposed instead of being left connected with no owner.
  const startGen = useRef(0);

  useEffect(() => { voice?.setParams(params); }, [params, voice]);
  useEffect(() => () => voice?.dispose(), [voice]);
  useEffect(() => () => { startGen.current++; }, []);

  // One note path for the on-screen keys and a connected MIDI keyboard. Each
  // note-on also resumes the audio context: iPad suspends (or WebKit
  // 'interrupts') it in the background, and only the Play tap resumed it before.
  const keys = useMemo<NoteSink | null>(() => voice && {
    noteOn: (n, v) => { getSharedCtx(); voice.noteOn(n, v); },
    noteOff: (n) => voice.noteOff(n),
  }, [voice]);

  // Route a connected MIDI keyboard into this organ while it is switched on.
  // Depends only on the provider's stable callbacks (not the whole context, which
  // changes on every hot-plug), and clears the sink only if it is still ours, so
  // stopping this organ never unhooks another one that took MIDI over since.
  const setSink = midi?.setSink;
  const clearSink = midi?.clearSink;
  useEffect(() => {
    if (!keys || !setSink || !clearSink) return;
    setSink(keys);
    return () => clearSink(keys);
  }, [keys, setSink, clearSink]);

  async function start() {
    const gen = ++startGen.current;
    setStatus('starting');
    try {
      const ctx = getSharedCtx(); // resumes audio inside this tap (required on iPad/iPhone)
      const { createOrganVoice } = await import('@/lib/engine/organ/organ-voice');
      const v = await createOrganVoice(ctx, { params });
      if (gen !== startGen.current) { v.dispose(); return; } // left the page while warming up
      setVoice(v);
      setStatus('idle');
    } catch {
      if (gen === startGen.current) setStatus('error');
    }
  }

  function stop() {
    startGen.current++;
    setVoice(null);
  }

  const isB3 = params.model === 'B3' || params.model === 'B3 BASS';
  return (
    <div className="mt-3">
      <SectionLabel>Play</SectionLabel>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {voice ? (
          <Button onClick={stop} aria-label="Stop playing this organ">Stop</Button>
        ) : (
          <Button variant="secondary" onClick={() => void start()} disabled={status === 'starting'}>
            {status === 'starting' ? 'Warming up…' : 'Play this organ'}
          </Button>
        )}
        <span className="text-[11px] text-muted">
          {isB3
            ? 'OpenNord tonewheel model: drawbars, percussion and vibrato. No rotary or effects yet.'
            : 'A simplified sketch of this organ model. No rotary or effects yet.'}
        </span>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-[11px] text-dim">This browser couldn't start the organ sound.</p>
      )}
      {keys && (
        <>
          <KeyboardZoneMap
            zones={NO_ZONES}
            selected={-1}
            onSelect={noop}
            onNoteOn={(n) => keys.noteOn(n, 100)}
            onNoteOff={keys.noteOff}
          />
          {midi && <MidiConnect what="this organ" />}
        </>
      )}
    </div>
  );
}
