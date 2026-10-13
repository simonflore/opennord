import { useEffect } from 'react';
import { useMidi } from '../../lib/midi/MidiContext';
import type { Sampler } from './sampleEngine';

/**
 * Route MIDI notes into a sampler (the same path as the on-screen keyboard, so
 * playing the controller lights the now-playing zones and the waveform playhead).
 * Depends on the provider's stable setSink/clearSink, not the whole MIDI context
 * (a new object on every hot-plug, which would re-run this and cut held notes), and
 * clears the sink only if it is still ours, so it never unhooks another instrument.
 *
 * `refresh` must be stable per sampler (useSampleTransport's is): re-running this
 * effect mid-note calls setSink → gate.allNotesOff(), releasing the held MIDI note
 * after about a frame.
 */
export function useSamplerMidiSink(sampler: Sampler | null | undefined, decodable: boolean | undefined, refresh: () => void): void {
  const { setSink, clearSink } = useMidi();
  useEffect(() => {
    if (!sampler || !decodable) return;
    const sink = {
      noteOn: (n: number, v: number) => { sampler.noteOn(n, v); refresh(); },
      noteOff: (n: number) => sampler.noteOff(n),
    };
    setSink(sink);
    return () => clearSink(sink);
  }, [sampler, decodable, setSink, clearSink, refresh]);
}
