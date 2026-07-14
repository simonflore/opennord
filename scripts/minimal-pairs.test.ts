/**
 * minimal-pairs.ts — hardware-free differential RE via naturally-occurring near-duplicates
 *
 * Research question: the "blocked on differential RE" status across the corpus-RE
 * models (lead-4, wave, electro-*, piano-*, …) assumes you need an instrument to
 * produce single-knob diff pairs (export, move ONE knob, re-export, diff bytes).
 * But a large real corpus already CONTAINS those pairs: two patches a user built
 * that differ in only a handful of bytes localize exactly the parameter(s) that
 * differ — and the two patch NAMES weak-label WHICH parameter moved. No hardware.
 *
 * This script mines a model's fixture corpus for minimal pairs (small byte-level
 * Hamming distance between program bodies), ranks the bytes that behave like
 * independently-editable parameters, and cross-references every finding against
 * the curated coverage map (src/lib/contribute/coverage-data.ts) so the output
 * surfaces NEW leads — bytes currently marked constant/unknown that a minimal
 * pair proves are real, separable parameters.
 *
 * It is the corpus-mining sibling of structural-probe.ts: research tooling only,
 * NOT wired into the app. Named *.test.ts so vitest discovers it, but gated on
 * MP_MODEL/MP_RUN so the default `npm test` suite skips it (no CI noise, no
 * fixture dependency — fixtures/ is local-only/gitignored).
 *
 * Run:  MP_MODEL=lead-4 npx vitest run scripts/minimal-pairs.test.ts
 *       MP_MODEL=wave    npx vitest run scripts/minimal-pairs.test.ts
 * Env:  MP_MODEL (fixtures/<dir>, default 'lead-4'), MP_K (max byte-distance to
 *       treat as a "minimal" pair, default 4), MP_EXAMPLES (rows to print, 24).
 */

import { describe, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { hasCbinMagic } from '@/lib/clavia/cbin';
import { MODEL_PROGRESS, type RegionStatus } from '@/lib/contribute/coverage-data';

const CBIN_HEADER = 44; // body starts here; coverage-data offsets are body-relative (0 = first body byte)

const MODEL = process.env.MP_MODEL ?? 'lead-4';
const K = Number(process.env.MP_K ?? 4);
const MAX_EXAMPLES = Number(process.env.MP_EXAMPLES ?? 24);

interface Patch {
  name: string;
  ext: string;
  body: Uint8Array; // bytes after the 44-byte CBIN header
}

// ── Corpus loader ────────────────────────────────────────────────────────────

function loadCorpus(modelDir: string): Patch[] {
  const dir = join(import.meta.dirname, '../fixtures', modelDir);
  if (!existsSync(dir)) return [];
  const out: Patch[] = [];
  for (const filename of readdirSync(dir).sort()) {
    if (filename.startsWith('.') || !filename.includes('.')) continue;
    const path = join(dir, filename);
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(readFileSync(path));
    } catch {
      continue;
    }
    if (bytes.length <= CBIN_HEADER || !hasCbinMagic(bytes)) continue;
    const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
    out.push({ name: filename, ext, body: bytes.subarray(CBIN_HEADER) });
  }
  return out;
}

/** Group by (extension, body length): only same-format bodies are comparable. */
function largestGroup(patches: Patch[]): { key: string; patches: Patch[] } {
  const groups = new Map<string, Patch[]>();
  for (const p of patches) {
    const key = `${p.ext}/${p.body.length}b`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }
  let best = { key: '(none)', patches: [] as Patch[] };
  for (const [key, ps] of groups) if (ps.length > best.patches.length) best = { key, patches: ps };
  return best;
}

// ── Coverage cross-reference ───────────────────────────────────────────────────

/** body-relative offset → curated region status (constant/confirmed/candidate/unknown/none). */
function statusLookup(modelDir: string): (off: number) => RegionStatus | 'none' {
  const regions = MODEL_PROGRESS[modelDir]?.regions ?? [];
  return (off: number) => {
    for (const r of regions) if (off >= r.start && off <= r.end) return r.status;
    return 'none';
  };
}

/** A lead is "new" when a minimal pair proves a byte separable but the map doesn't claim it. */
function isNewLead(status: RegionStatus | 'none'): boolean {
  return status === 'constant' || status === 'unknown' || status === 'none';
}

// ── Analysis ───────────────────────────────────────────────────────────────────

function constantMask(group: Patch[], len: number): boolean[] {
  const isConst = new Array<boolean>(len).fill(true);
  const first = group[0]!.body;
  for (let i = 1; i < group.length; i++) {
    const b = group[i]!.body;
    for (let pos = 0; pos < len; pos++) if (isConst[pos] && b[pos] !== first[pos]) isConst[pos] = false;
  }
  return isConst;
}

/** Differing body offsets between two patches, scanning only the varying positions. */
function diffOffsets(a: Uint8Array, b: Uint8Array, varying: number[], capAt: number): number[] {
  const diffs: number[] = [];
  for (const pos of varying) {
    if (a[pos] !== b[pos]) {
      diffs.push(pos);
      if (diffs.length > capAt) break; // early-out: not a minimal pair
    }
  }
  return diffs;
}

interface Pair {
  i: number;
  j: number;
  offs: number[];
}

function bitsDiffer(x: number, y: number): string {
  const flipped: number[] = [];
  for (let bit = 7; bit >= 0; bit--) if (((x >> bit) & 1) !== ((y >> bit) & 1)) flipped.push(bit);
  return flipped.join(',');
}

// ── Report ───────────────────────────────────────────────────────────────────

const ENABLED = !!process.env.MP_MODEL || process.env.MP_RUN === '1';

describe(`minimal-pairs: ${MODEL}`, () => {
  it.runIf(ENABLED)(`mines fixtures/${MODEL} for naturally-occurring single-edit pairs`, () => {
    const all = loadCorpus(MODEL);
    if (all.length < 2) {
      console.log(`\n[minimal-pairs] fixtures/${MODEL}: need ≥2 CBIN files, found ${all.length}. Skipping.\n`);
      return;
    }

    const { key, patches } = largestGroup(all);
    const len = patches[0]!.body.length;
    const status = statusLookup(MODEL);
    const isConst = constantMask(patches, len);
    const varying = [...Array(len).keys()].filter(pos => !isConst[pos]);

    // Split varying bytes into SIGNAL (parameter-like) and NOISE (checksum / serial /
    // per-program hash). A checksum changes on almost every edit, so it inflates the
    // distance of every real single-param pair by its width — drowning the signal.
    // diffFreq = 1 − Simpson index = P(two distinct patches differ here); a near-1
    // value means "changes on nearly every patch" = checksum/serial, not a control.
    const NOISE = Number(process.env.MP_NOISE ?? 0.9);
    const diffFreq = (pos: number): number => {
      const counts = new Map<number, number>();
      for (const p of patches) counts.set(p.body[pos]!, (counts.get(p.body[pos]!) ?? 0) + 1);
      let sumSq = 0;
      for (const c of counts.values()) { const f = c / patches.length; sumSq += f * f; }
      return 1 - sumSq;
    };
    const signalBytes = varying.filter(pos => diffFreq(pos) < NOISE);
    const noiseBytes = varying.filter(pos => diffFreq(pos) >= NOISE);

    console.log(`\n${'═'.repeat(78)}`);
    console.log(`MINIMAL-PAIR MINING — ${MODEL}  (group ${key}, ${patches.length} patches)`);
    console.log(`${'═'.repeat(78)}`);
    console.log(`Body ${len}b: ${len - varying.length} constant, ${signalBytes.length} signal, ` +
      `${noiseBytes.length} noise (checksum/serial, diffFreq≥${NOISE})`);
    console.log(`Coverage map: ${MODEL_PROGRESS[MODEL] ? 'present' : 'ABSENT (all leads are new)'}   K=${K}`);
    if (noiseBytes.length)
      console.log(`Excluded noise bytes (reported, not scored): ${noiseBytes.map(o => `${o}[${status(o)}]`).join(' ')}`);

    // Find every pair within K differing SIGNAL bytes. offs.length===0 → a
    // content-duplicate (identical signal, differs only in noise) — tracked separately.
    const pairs: Pair[] = [];
    let dupCount = 0;
    for (let i = 0; i < patches.length; i++) {
      for (let j = i + 1; j < patches.length; j++) {
        const offs = diffOffsets(patches[i]!.body, patches[j]!.body, signalBytes, K);
        if (offs.length === 0) dupCount++;
        else if (offs.length <= K) pairs.push({ i, j, offs });
      }
    }
    pairs.sort((a, b) => a.offs.length - b.offs.length);

    // Distance histogram.
    const hist = new Map<number, number>();
    for (const p of pairs) hist.set(p.offs.length, (hist.get(p.offs.length) ?? 0) + 1);
    console.log(`\nMinimal pairs by byte-distance (≤K):`);
    for (let d = 1; d <= K; d++) console.log(`  dist ${d}: ${hist.get(d) ?? 0} pairs`);

    // Per-byte "independently-editable parameter" ranking: how often a byte is the
    // SOLE (or near-sole) difference in a minimal pair. Sole-diff weighted highest.
    const score = new Map<number, { sole: number; total: number }>();
    for (const p of pairs) {
      for (const off of p.offs) {
        const s = score.get(off) ?? { sole: 0, total: 0 };
        s.total++;
        if (p.offs.length === 1) s.sole++;
        score.set(off, s);
      }
    }
    const ranked = [...score.entries()].sort((a, b) =>
      b[1].sole - a[1].sole || b[1].total - a[1].total || a[0] - b[0]);

    console.log(`\nByte ranking — bytes that move independently (body-relative offset):`);
    console.log(`  ${'off'.padStart(5)} ${'sole'.padStart(5)} ${'tot'.padStart(5)}  status      lead`);
    let newLeads = 0;
    for (const [off, s] of ranked.slice(0, 40)) {
      const st = status(off);
      const lead = isNewLead(st) && s.sole > 0;
      if (lead) newLeads++;
      console.log(
        `  ${String(off).padStart(5)} ${String(s.sole).padStart(5)} ${String(s.total).padStart(5)}` +
        `  ${st.padEnd(10)}  ${lead ? '★ NEW separable param' : ''}`,
      );
    }

    // Example sole-diff pairs: the actual single-edit evidence, with bit deltas + names.
    console.log(`\nSole-difference pairs (1 byte) — names weak-label the moved parameter:`);
    let shown = 0;
    for (const p of pairs) {
      if (p.offs.length !== 1) continue;
      const off = p.offs[0]!;
      const a = patches[p.i]!, b = patches[p.j]!;
      const va = a.body[off]!, vb = b.body[off]!;
      console.log(
        `  @${String(off).padStart(4)} ${String(va).padStart(3)}→${String(vb).toString().padEnd(3)}` +
        ` bits[${bitsDiffer(va, vb)}] (${status(off)})` +
        `\n        ${trim(a.name)}  ↔  ${trim(b.name)}`,
      );
      if (++shown >= MAX_EXAMPLES) break;
    }
    if (shown === 0) console.log('  (none at dist 1 — raise MP_K, or lower MP_NOISE if a real param was misread as noise)');

    console.log(`\nSUMMARY: ${pairs.length} minimal pairs (≤${K} signal bytes), ${ranked.length} bytes move independently, ` +
      `${newLeads} NEW separable-param leads not yet claimed by the coverage map.`);
    console.log(`Content-duplicates (identical signal, differ only in noise): ${dupCount} pairs` +
      (dupCount ? ' — confirms the noise region is a content hash/serial, and flags dedup candidates.' : '.'));
    console.log(`${'═'.repeat(78)}\n`);
  });
});

function trim(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/\s+/g, ' ').trim();
  return base.length > 32 ? base.slice(0, 31) + '…' : base.padEnd(32);
}
