/** A note destination — the loaded sampler is one. */
export interface NoteSink {
  noteOn(note: number, velocity: number): void;
  noteOff(note: number): void;
}

/** Wraps a NoteSink so note-offs are held while the sustain pedal is down and
 *  flushed on pedal-up. Re-pressing a pending note re-arms it. */
export interface SustainGate extends NoteSink {
  setSustain(down: boolean): void;
  /** Release everything (file change / disconnect). */
  allNotesOff(): void;
}

export function createSustainGate(sink: NoteSink): SustainGate {
  let sustained = false;
  const held = new Set<number>();    // physically down
  const pending = new Set<number>(); // released while sustained, awaiting pedal-up

  return {
    noteOn(note, velocity) {
      held.add(note);
      pending.delete(note); // re-arm if it was pending release
      sink.noteOn(note, velocity);
    },
    noteOff(note) {
      held.delete(note);
      if (sustained) { pending.add(note); return; }
      sink.noteOff(note);
    },
    setSustain(down) {
      sustained = down;
      if (!down) { for (const n of pending) sink.noteOff(n); pending.clear(); }
    },
    allNotesOff() {
      for (const n of held) sink.noteOff(n);
      for (const n of pending) sink.noteOff(n);
      held.clear();
      pending.clear();
    },
  };
}
