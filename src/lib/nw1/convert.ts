/**
 * Nord Wave record versions 6 and 7 → 8, as the OS 2.14 load path converts
 * them (record read, versions 6–8). The record layout
 * is the same; the converter resets settings an older OS allowed in
 * combinations version 8 doesn't:
 *
 * - version 6 only: global parameter 7 := 40;
 * - per slot, when Osc 1 plays waveform 4 or 5 (parameter 19) with Osc 1 Sync
 *   Mode off (33): Osc 1 Shape (23) := 0; LFO 1 Amount (8) := 0 when LFO 1
 *   Dest (5) is 1; when LFO 1 Dest is 2, LFO 1 Amount := 0 if Osc 2 also plays
 *   waveform 4 or 5 (24), else LFO 1 Dest := 3; LFO 2 Amount (13) := 0 when
 *   LFO 2 Dest (10) is 1;
 * - per slot, when Osc 2 plays waveform 4 or 5: Osc 2 Shape (32) := 0; LFO 1
 *   Dest 2 → 1 when Osc 1 is not on waveform 4 or 5; LFO 2 Amount := 0 when
 *   LFO 1 Dest is 3; Mod Envelope Amount (16) := 64 when Mod Envelope Dest (17)
 *   is 1.
 *
 * Every amount or shape the converter resets loses its morph deltas too; the
 * conditions are the slot's values before any reset (reads them
 * once per slot).
 *
 * Pure; never throws.
 */
import { recordEditor, type RecordConverter } from '../clavia/record-convert';
import { NW1_LAYOUT, type Nw1FieldKey } from './layout.generated';

const MORPH_SRC = [0, 5, 6] as const;
const KEYS = new Set<string>(NW1_LAYOUT.fields.map((f) => f.key));

export const convertNw1: RecordConverter = (data, from) => {
  if (from >= 8) return [];
  const r = recordEditor<Nw1FieldKey>(data, NW1_LAYOUT);
  if (from === 6) r.set('global.param7', 40);
  for (const slot of ['slotA', 'slotB'] as const) {
    const k = (n: number) => `${slot}.param${n}` as Nw1FieldKey;
    const get = (n: number) => r.get(k(n));
    const set = (n: number, v: number) => r.set(k(n), v);
    /** Reset a parameter and its morph deltas. */
    const setWithMorphs = (n: number, v: number) => {
      set(n, v);
      for (const s of MORPH_SRC) {
        const d = `${k(n)}MorphDeltaSrc${s}`;
        if (KEYS.has(d)) r.set(d as Nw1FieldKey, 0);
      }
    };
    const special = (w: number) => w === 4 || w === 5;
    const osc1 = special(get(19)), osc2 = special(get(24)), lfo1Dest = get(5);
    if (osc1 && get(33) === 0) {
      setWithMorphs(23, 0);
      if (lfo1Dest === 1 || (lfo1Dest === 2 && osc2)) setWithMorphs(8, 0);
      else if (lfo1Dest === 2) set(5, 3);
      if (get(10) === 1) setWithMorphs(13, 0);
    }
    if (osc2) {
      setWithMorphs(32, 0);
      if (lfo1Dest === 2 && !osc1) set(5, 1);
      else if (lfo1Dest === 3) setWithMorphs(13, 0);
      if (get(17) === 1) setWithMorphs(16, 64);
    }
  }
  return [];
};
