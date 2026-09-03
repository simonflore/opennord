import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseClaviaFile } from '../formats';
import { identifyNordFile } from './nord-file';

/**
 * Whole-corpus parse-health sweep for Stage 2/3 **program + synth** files — every
 * `.ns2p/.ns2s/.ns3f/.ns3y` under `fixtures/` (git-ignored; the suite skips when
 * the folder is absent or holds none). Sibling to `ns4/nsmp-corpus-sweep.test.ts`,
 * for the program side instead of the sample side.
 *
 * Drop a program corpus into `packages/core/fixtures/` to exercise it. The one
 * this was written against is the public parameter-coverage corpus in
 * `Chris55/ns3-program-viewer` `test/` (~1081 `.ns2p/.ns3f` files, one per asserted
 * parameter) — the same viewer credited as the NS2/NS3 oracle in `ATTRIBUTION.md`.
 * All 1081 parsed clean when this landed; this pins that, so a decoder change that
 * regresses a program variant trips here at once. The corpus itself is **not**
 * committed — it is third-party with an unclear license, used only as a local
 * oracle (same posture as the decode.test.ts oracle notes).
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

describe.skipIf(FILES.length === 0)('Stage 2/3 program corpus — parse sweep', () => {
  it(`recognizes + parses every program file (${FILES.length} found)`, () => {
    const bad: string[] = [];
    for (const f of FILES) {
      const rel = f.split('/fixtures/')[1] ?? f;
      let bytes: Uint8Array;
      try { bytes = new Uint8Array(readFileSync(f)); } catch { bad.push(`unreadable: ${rel}`); continue; }
      try {
        const info = identifyNordFile(bytes);
        const parsed = parseClaviaFile(bytes);
        if (!info.recognized) bad.push(`unrecognized: ${rel}`);
        else if (!parsed?.program) bad.push(`no program: ${rel}`);
      } catch (e) {
        bad.push(`threw "${(e as Error).message}": ${rel}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
