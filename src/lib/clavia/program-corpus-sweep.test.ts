import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { decodeNs2 } from '../ns2/decode';
import { decodeNs3 } from '../ns3/decode';

/**
 * Whole-corpus decode-health sweep for Stage 2/3 **program + synth** files — every
 * `.ns2p/.ns2s/.ns3f/.ns3y` under `fixtures/` (git-ignored; the suite skips when
 * the folder is absent or holds none). Sibling to `ns4/nsmp-corpus-sweep.test.ts`,
 * for the program side.
 *
 * It drives the **actual decoders** — `decodeNs2`/`decodeNs3`, the same entry the
 * UI presenters use — NOT `parseClaviaFile`, which only structurally decodes Stage
 * 4 and returns `preset-unknown` for `.ns2p/.ns3f` (so a parseClaviaFile sweep
 * would pass trivially without exercising the Stage 2/3 codecs at all).
 *
 * The corpus this was written against is the public parameter-coverage set in
 * `Chris55/ns3-program-viewer` `test/` (~1081 files, one per asserted parameter) —
 * the viewer credited as the NS2/NS3 oracle in `ATTRIBUTION.md`. All 1081 decode
 * without error today; this pins that, so a decoder change that regresses a
 * program variant trips here at once. The corpus is third-party with an unclear
 * license, so it is **not** committed — dropped into `fixtures/` by hand, local
 * oracle only. (Value-level agreement against Chris's asserted values is a deeper
 * check — a port of his assertion DSL — and is out of scope for this crash sweep.)
 */
const FIX = resolve(__dirname, '../../..', 'fixtures');
function listPrograms(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) out = out.concat(listPrograms(p));
    else if (/\.(ns2p|ns2s|ns3f|ns3y)$/i.test(e)) out.push(p);
  }
  return out;
}
const FILES = listPrograms(FIX);

describe.skipIf(FILES.length === 0)('Stage 2/3 program corpus — decode sweep', () => {
  it(`decodes every program/synth file without error (${FILES.length} found)`, () => {
    const bad: string[] = [];
    for (const f of FILES) {
      const rel = f.split('/fixtures/')[1] ?? f;
      const isNs2 = /\.ns2[ps]$/i.test(f);
      const isMainProgram = /\.(ns2p|ns3f)$/i.test(f);
      let bytes: Uint8Array;
      try { bytes = new Uint8Array(readFileSync(f)); } catch { bad.push(`unreadable: ${rel}`); continue; }
      try {
        const prog = isNs2 ? decodeNs2(bytes) : decodeNs3(bytes);
        if (!prog || typeof prog !== 'object') { bad.push(`no result: ${rel}`); continue; }
        // A full program must yield its top-level container list; synth files
        // (.ns2s/.ns3y) are subsets, so for them "decoded without throwing" is enough.
        if (isMainProgram) {
          const parts = isNs2 ? (prog as { slots?: unknown }).slots : (prog as { panels?: unknown }).panels;
          if (!Array.isArray(parts)) bad.push(`missing ${isNs2 ? 'slots' : 'panels'}: ${rel}`);
        }
      } catch (e) {
        bad.push(`threw "${(e as Error).message}": ${rel}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
