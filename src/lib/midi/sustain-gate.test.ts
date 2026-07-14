import { describe, it, expect } from 'vitest';
import { createSustainGate, type NoteSink } from './sustain-gate';

function recorder() {
  const calls: string[] = [];
  const sink: NoteSink = {
    noteOn: (n, v) => calls.push(`on ${n} ${v}`),
    noteOff: (n) => calls.push(`off ${n}`),
  };
  return { sink, calls };
}

describe('createSustainGate', () => {
  it('passes notes straight through when the pedal is up', () => {
    const { sink, calls } = recorder();
    const g = createSustainGate(sink);
    g.noteOn(60, 100); g.noteOff(60);
    expect(calls).toEqual(['on 60 100', 'off 60']);
  });

  it('defers note-off while sustained, flushing on pedal-up', () => {
    const { sink, calls } = recorder();
    const g = createSustainGate(sink);
    g.setSustain(true);
    g.noteOn(60, 100); g.noteOff(60);
    expect(calls).toEqual(['on 60 100']);   // off deferred
    g.setSustain(false);
    expect(calls).toEqual(['on 60 100', 'off 60']); // released on pedal-up
  });

  it('re-arms a re-pressed note so pedal-up does not kill it', () => {
    const { sink, calls } = recorder();
    const g = createSustainGate(sink);
    g.setSustain(true);
    g.noteOn(60, 100); g.noteOff(60); // pending release
    g.noteOn(60, 110);                // re-press: re-arm
    g.setSustain(false);
    expect(calls).toEqual(['on 60 100', 'on 60 110']); // no stray 'off 60'
  });

  it('allNotesOff releases held and pending notes and clears state', () => {
    const { sink, calls } = recorder();
    const g = createSustainGate(sink);
    g.setSustain(true);
    g.noteOn(60, 100);            // held
    g.noteOn(64, 100); g.noteOff(64); // pending
    g.allNotesOff();
    expect(calls.filter((c) => c.startsWith('off')).sort()).toEqual(['off 60', 'off 64']);
    g.setSustain(false); // nothing left to flush
    expect(calls.filter((c) => c === 'off 60' || c === 'off 64').length).toBe(2);
  });
});
