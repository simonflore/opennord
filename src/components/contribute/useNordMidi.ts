import { useEffect, useState } from 'react';
import { listenToNordMidi, type MidiReason } from '../../lib/midi/web-midi';
import type { MidiControlEvent } from '../../lib/midi/control';

export interface NordMidiState {
  status: 'idle' | 'listening' | MidiReason | 'error';
  portName: string;
  /** Most recent control moves, newest first (capped). */
  events: MidiControlEvent[];
  last: MidiControlEvent | null;
}

const REASONS: MidiReason[] = ['unsupported', 'denied', 'no-port'];
function statusOf(err: unknown): NordMidiState['status'] {
  const m = err instanceof Error ? err.message : '';
  return (REASONS as string[]).includes(m) ? (m as MidiReason) : 'error';
}

/**
 * Listen to the Nord's MIDI controls while `enabled`. Surfaces the latest moves
 * for the live probe and for auto-labeling a captured change.
 */
export function useNordMidi(enabled: boolean): NordMidiState {
  const [state, setState] = useState<NordMidiState>({ status: 'idle', portName: '', events: [], last: null });

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', portName: '', events: [], last: null });
      return;
    }
    let alive = true;
    let handle: { stop: () => void } | null = null;
    listenToNordMidi((e) => {
      setState((s) => ({ ...s, status: 'listening', last: e, events: [e, ...s.events].slice(0, 25) }));
    })
      .then((h) => {
        if (!alive) { h.stop(); return; }
        handle = h;
        setState((s) => ({ ...s, status: 'listening', portName: h.portName }));
      })
      .catch((err) => { if (alive) setState((s) => ({ ...s, status: statusOf(err) })); });
    return () => { alive = false; handle?.stop(); };
  }, [enabled]);

  return state;
}
