/**
 * Differential-RE inference engine (RE-only). Pure: no I/O, no DOM. Turns multiple
 * captures of ONE control into a FieldDescriptor. The diffed body is checksum-free
 * (CRC-32 lives in the stripped header), so varying bits are essentially the field.
 * Bit convention: global bit index = byte*8 + bitInByte, LSB = bit 0.
 */
import type { Sample, ValueType, FieldDescriptor } from './types';

/** Global bit indices that differ across any pair of bodies. */
export function changedBits(bodies: Uint8Array[]): number[] {
  if (bodies.length < 2) return [];
  const len = Math.min(...bodies.map((b) => b.length));
  const out: number[] = [];
  for (let byte = 0; byte < len; byte++) {
    let or = 0, and = 0xff;
    for (const b of bodies) { or |= b[byte]; and &= b[byte]; }
    const varying = or & ~and; // set in some samples, clear in others
    if (varying) for (let bit = 0; bit < 8; bit++) if (varying & (1 << bit)) out.push(byte * 8 + bit);
  }
  return out;
}

/** Contiguous runs of (sorted) bit indices. */
export function bitRuns(bits: number[]): Array<{ startBit: number; endBit: number }> {
  if (bits.length === 0) return [];
  const s = [...bits].sort((a, b) => a - b);
  const runs: Array<{ startBit: number; endBit: number }> = [];
  let start = s[0], prev = s[0];
  for (let i = 1; i < s.length; i++) {
    if (s[i] === prev + 1) { prev = s[i]; continue; }
    runs.push({ startBit: start, endBit: prev }); start = s[i]; prev = s[i];
  }
  runs.push({ startBit: start, endBit: prev });
  return runs;
}

/**
 * Read a field's raw integer. Sub-byte fields are little-endian within their byte;
 * multi-byte (byte-aligned) fields honor `endian`. Uses BigInt internally so wide
 * fields never overflow a 32-bit int.
 */
export function extractRaw(
  body: Uint8Array, byteOffset: number, bitOffset: number, bitWidth: number, endian: 'le' | 'be',
): number {
  const nbytes = Math.ceil((bitOffset + bitWidth) / 8);
  let acc = 0n;
  for (let i = 0; i < nbytes; i++) {
    const src = endian === 'le' ? byteOffset + i : byteOffset + (nbytes - 1 - i);
    acc |= BigInt(body[src] ?? 0) << BigInt(8 * i);
  }
  return Number((acc >> BigInt(bitOffset)) & ((1n << BigInt(bitWidth)) - 1n));
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const isAscending = (xs: number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]);

/** Least-squares value = a*raw + b. `residual` is RMSE normalized by the value range
 *  (0 = perfect). `monotonic` = value order tracks raw order (either direction). */
export function fitLinear(raws: number[], values: number[]): { a: number; b: number; residual: number; monotonic: boolean } {
  const n = raws.length;
  const mr = avg(raws), mv = avg(values);
  let cov = 0, varr = 0;
  for (let i = 0; i < n; i++) { cov += (raws[i] - mr) * (values[i] - mv); varr += (raws[i] - mr) ** 2; }
  const a = varr === 0 ? 0 : cov / varr;
  const b = mv - a * mr;
  let sse = 0;
  for (let i = 0; i < n; i++) { const pred = a * raws[i] + b; sse += (pred - values[i]) ** 2; }
  const range = (Math.max(...values) - Math.min(...values)) || 1;
  const residual = Math.sqrt(sse / n) / range;
  const order = [...raws.keys()].sort((i, j) => raws[i] - raws[j]).map((i) => values[i]);
  const monotonic = isAscending(order) || isAscending([...order].reverse());
  return { a, b, residual, monotonic };
}

/** Map distinct raw -> the option captured with it. `consistent` is false if a raw
 *  maps to more than one option. */
export function fitEnum(raws: number[], options: string[]): { map: Record<number, string>; consistent: boolean } {
  const map: Record<number, string> = {};
  let consistent = true;
  for (let i = 0; i < raws.length; i++) {
    const r = raws[i], opt = options[i];
    if (r in map && map[r] !== opt) consistent = false;
    map[r] = opt;
  }
  return { map, consistent };
}

/** A boolean field needs exactly two distinct raw states. */
export function fitBool(raws: number[]): { ok: boolean } {
  return { ok: new Set(raws).size === 2 };
}

/** Candidate field geometry from a contiguous bit-run. */
interface Cand { byteOffset: number; bitOffset: number; bitWidth: number; endian: 'le' | 'be' }

function runToCand(run: { startBit: number; endBit: number }, endian: 'le' | 'be'): Cand {
  const byteOffset = Math.floor(run.startBit / 8);
  return { byteOffset, bitOffset: run.startBit - byteOffset * 8, bitWidth: run.endBit - run.startBit + 1, endian };
}

/** Numeric value for fitting: number as-is, bool→0/1, string→NaN (enum handled separately). */
function asNum(v: Sample['value']): number {
  return typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : NaN;
}

/**
 * Infer a field descriptor from multiple captures of one control. Picks the bit-run
 * whose extracted raw best tracks the value; fits encoding per `valueType`; scores
 * confidence; records extra runs as multi-region notes.
 */
export function inferField(samples: Sample[], valueType: ValueType): FieldDescriptor {
  if (samples.length < 2) throw new Error('inferField needs >= 2 samples.');
  const bodies = samples.map((s) => s.body);
  const len0 = bodies[0].length;
  if (!bodies.every((b) => b.length === len0)) throw new Error('inferField: all sample bodies must be equal length.');
  const runs = bitRuns(changedBits(bodies));
  const notes: string[] = [];
  if (runs.length === 0) {
    return { byteOffset: 0, bitOffset: 0, bitWidth: 0, endian: 'le', encoding: { kind: 'raw' },
      confidence: 0, evidence: { samples: samples.length, monotonic: false, residual: 1, notes: ['no bits changed'] } };
  }
  if (runs.length > 1) notes.push(`multi-region: ${runs.length} disjoint ranges changed — contributor may have moved more than one control`);

  // Candidate set: each run, with both endians when it spans >1 byte and is byte-aligned.
  const cands: Cand[] = [];
  for (const run of runs) {
    const c = runToCand(run, 'le');
    cands.push(c);
    const multiByte = Math.floor(run.startBit / 8) !== Math.floor(run.endBit / 8);
    if (multiByte && c.bitOffset === 0 && c.bitWidth % 8 === 0) cands.push({ ...c, endian: 'be' });
  }

  // Score each candidate; keep the best by fit quality.
  let best: { cand: Cand; enc: FieldDescriptor['encoding']; residual: number; monotonic: boolean; score: number } | null = null;
  for (const cand of cands) {
    const raws = bodies.map((b) => extractRaw(b, cand.byteOffset, cand.bitOffset, cand.bitWidth, cand.endian));
    let enc: FieldDescriptor['encoding']; let residual = 1; let monotonic = false; let score = 0;
    if (valueType.kind === 'linear') {
      const f = fitLinear(raws, samples.map((s) => asNum(s.value)));
      enc = { kind: 'linear', a: f.a, b: f.b, unit: valueType.unit };
      residual = f.residual; monotonic = f.monotonic;
      score = (monotonic ? 1 : 0) + (1 - Math.min(1, residual));
    } else if (valueType.kind === 'enum') {
      const f = fitEnum(raws, samples.map((s) => String(s.value)));
      enc = { kind: 'enum', map: f.map }; monotonic = true;
      score = f.consistent ? 1.5 : 0.2;
    } else if (valueType.kind === 'bool') {
      const f = fitBool(raws); enc = { kind: 'bool' }; score = f.ok ? 1.5 : 0.2;
    } else {
      enc = { kind: 'raw' }; score = 0.5;
    }
    if (!best || score > best.score) best = { cand, enc, residual, monotonic, score };
  }

  const { cand, enc, residual, monotonic } = best!;
  // Confidence: fit score, sample count, single-region.
  const sampleBonus = Math.min(1, samples.length / 4);
  const singleRegion = runs.length === 1 ? 1 : 0.5;
  const fitGood = enc.kind === 'linear' ? (monotonic ? 1 - Math.min(1, residual) : 0.2)
    : enc.kind === 'raw' ? 0.4 : 0.9;
  const confidence = Math.max(0, Math.min(1, fitGood * 0.6 + sampleBonus * 0.2 + singleRegion * 0.2));

  return {
    byteOffset: cand.byteOffset, bitOffset: cand.bitOffset, bitWidth: cand.bitWidth, endian: cand.endian,
    encoding: enc, confidence,
    evidence: { samples: samples.length, monotonic, residual, notes },
  };
}
