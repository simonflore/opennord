import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { getSharedCtx } from '@/components/sample/audioPlayer';
import { KeyboardZoneMap } from '@/components/sample/KeyboardZoneMap';
import { MidiConnect } from '@/components/sample/MidiConnect';
import { useOptionalMidi } from '@/lib/midi/MidiContext';
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
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set());
  const paramsRef = useRef(params);

  useEffect(() => { paramsRef.current = params; voice?.setParams(params); }, [params, voice]);
  useEffect(() => () => voice?.dispose(), [voice]);

  const mark = (note: number, down: boolean) => setHeld((s) => {
    const n = new Set(s);
    if (down) n.add(note); else n.delete(note);
    return n;
  });

  // Route a connected MIDI keyboard into this organ while it is switched on.
  useEffect(() => {
    if (!voice || !midi) return;
    midi.setSink({
      noteOn: (n, v) => { voice.noteOn(n, v); mark(n, true); },
      noteOff: (n) => { voice.noteOff(n); mark(n, false); },
    });
    return () => midi.setSink(null);
  }, [voice, midi]);

  async function start() {
    setStatus('starting');
    try {
      const ctx = getSharedCtx(); // resumes audio inside this tap (required on iPad/iPhone)
      const { createOrganVoice } = await import('@/lib/engine/organ/organ-voice');
      setVoice(await createOrganVoice(ctx, { params: paramsRef.current }));
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  function stop() {
    setVoice(null);
    setHeld(new Set());
  }

  const isB3 = params.model === 'B3' || params.model === 'B3 BASS';
  return (
    <div className="mt-3">
      <SectionLabel>Play</SectionLabel>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {voice ? (
          <Button onClick={stop} aria-label="Stop playing this organ">Stop</Button>
        ) : (
          <Button variant="primary" onClick={() => void start()} disabled={status === 'starting'}>
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
      {voice && (
        <>
          <KeyboardZoneMap
            zones={NO_ZONES}
            selected={-1}
            onSelect={noop}
            onNoteOn={(n) => { voice.noteOn(n, 100); mark(n, true); }}
            onNoteOff={(n) => { voice.noteOff(n); mark(n, false); }}
            soundingMidis={held}
          />
          {midi && <MidiConnect what="this organ" />}
        </>
      )}
    </div>
  );
}
