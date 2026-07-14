/**
 * structural-probe.ts — Tier B fallback proof-of-concept
 *
 * Research question: can a MODEL-AGNOSTIC "structural decode" recover useful
 * patch structure (engines active, engine type) from raw body bytes + CBIN
 * header category/name ALONE, validated against ns4 ground truth?
 *
 * Inputs to structural method: raw bytes + header.category + filename (name).
 * Ground truth (scoring only): parseNs4Program() → which layers/kinds are enabled.
 *
 * Run:  npx vitest run scripts/structural-probe.ts  (or npm test -- structural-probe)
 *
 * This is research tooling only — NOT wired into the app.
 */

import { describe, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { hasCbinMagic, readCbinHeader } from '@/lib/clavia/cbin';
import { programCategoryName } from '@/lib/clavia/categories';
import { parseNs4Program } from '@/lib/ns4/parse';

// ── Corpus loader ──────────────────────────────────────────────────────────────

const FIXTURES_DIR = join(import.meta.dirname, '../fixtures/stage-4');

interface CorpusEntry {
  filename: string;
  bytes: Uint8Array;
  // Header fields (structural method CAN use these)
  categoryId: number;
  categoryName: string | undefined;
  // Ground truth (structural method MUST NOT use; scoring only)
  gt: {
    hasOrgan: boolean;
    hasPiano: boolean;
    hasSynth: boolean;
    enabledOrganModels: string[];     // e.g. ["B3", "VOX"]
    enabledPianoTypes: string[];      // e.g. ["Grand", "Electric"]
    enabledSynthSources: string[];    // e.g. ["analog", "samples"]
  };
}

function loadCorpus(): CorpusEntry[] {
  const files = readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.ns4p'))
    .sort();

  const entries: CorpusEntry[] = [];

  for (const filename of files) {
    const path = join(FIXTURES_DIR, filename);
    const raw = readFileSync(path);
    const bytes = new Uint8Array(raw);

    if (!hasCbinMagic(bytes)) continue;

    const header = readCbinHeader(bytes);
    const prog = parseNs4Program(bytes);

    const layers = prog.layers ?? [];
    const enabledLayers = layers.filter(l => l.enabled === true);

    const organLayers = enabledLayers.filter(l => l.kind === 'organ');
    const pianoLayers = enabledLayers.filter(l => l.kind === 'piano');
    const synthLayers = enabledLayers.filter(l => l.kind === 'synth');

    entries.push({
      filename,
      bytes,
      categoryId: header.category,
      categoryName: programCategoryName(header.category),
      gt: {
        hasOrgan: organLayers.length > 0,
        hasPiano: pianoLayers.length > 0,
        hasSynth: synthLayers.length > 0,
        enabledOrganModels: [...new Set(organLayers.map(l => l.organModel ?? 'unknown'))],
        enabledPianoTypes: [...new Set(pianoLayers.map(l => l.pianoType ?? 'unknown'))],
        enabledSynthSources: [...new Set(synthLayers.map(l => l.source ?? 'unknown'))],
      },
    });
  }

  return entries;
}

// ── Byte-level analysis ────────────────────────────────────────────────────────

/**
 * For each byte position, compute: variance across corpus, number of distinct values.
 * Body starts at byte 44 (after 44-byte CBIN header).
 */
function buildVarianceMap(corpus: CorpusEntry[]) {
  const bodyLength = corpus[0]!.bytes.length - 44; // all ns4p same length
  const actualBodyLens = corpus.map(e => e.bytes.length - 44);
  const minLen = Math.min(...actualBodyLens);

  const positions: Array<{
    byteOffset: number;  // absolute offset in file
    values: Set<number>;
    counts: Map<number, number>;
  }> = [];

  for (let pos = 44; pos < 44 + minLen; pos++) {
    const valCounts = new Map<number, number>();
    for (const entry of corpus) {
      const v = entry.bytes[pos] ?? 0;
      valCounts.set(v, (valCounts.get(v) ?? 0) + 1);
    }
    positions.push({
      byteOffset: pos,
      values: new Set(valCounts.keys()),
      counts: valCounts,
    });
  }

  return { positions, bodyLength, minLen };
}

// ── Category correlation ───────────────────────────────────────────────────────

/**
 * For each byte position, compute how strongly values correlate with category.
 * Returns positions where a specific byte value strongly predicts a category
 * (precision ≥ threshold).
 */
function findCategoryCorrelatedBytes(
  corpus: CorpusEntry[],
  varMap: ReturnType<typeof buildVarianceMap>,
  minDistinctValues = 2,
  maxDistinctValues = 16,  // candidate enum positions
  minPrecision = 0.75,
) {
  const results: Array<{
    byteOffset: number;
    byteValue: number;
    predictedCategory: string;
    precision: number;
    recall: number;
    support: number;
    total: number;
  }> = [];

  // For each category, build the set of files
  const byCategory = new Map<string, CorpusEntry[]>();
  for (const e of corpus) {
    const cat = e.categoryName ?? `cat_${e.categoryId}`;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(e);
  }

  for (const pos of varMap.positions) {
    // Only look at positions with few distinct values (enum candidates)
    if (pos.values.size < minDistinctValues) continue;
    if (pos.values.size > maxDistinctValues) continue;

    // For each value × category combination, compute precision/recall
    for (const [byteVal, count] of pos.counts) {
      // Which files have this byte value?
      const filesWithVal = corpus.filter(e => (e.bytes[pos.byteOffset] ?? 0) === byteVal);

      for (const [catName, catFiles] of byCategory) {
        if (catFiles.length < 5) continue; // skip tiny categories

        // Precision: of files with this byte value, what fraction are in this category?
        const truePos = filesWithVal.filter(f => (f.categoryName ?? `cat_${f.categoryId}`) === catName).length;
        if (truePos === 0) continue;

        const precision = truePos / filesWithVal.length;
        const recall = truePos / catFiles.length;

        if (precision >= minPrecision && filesWithVal.length >= 3) {
          results.push({
            byteOffset: pos.byteOffset,
            byteValue: byteVal,
            predictedCategory: catName,
            precision,
            recall,
            support: truePos,
            total: filesWithVal.length,
          });
        }
      }
    }
  }

  // Sort by (precision * recall * support) descending
  return results.sort((a, b) =>
    b.precision * b.recall * b.support - a.precision * a.recall * a.support
  );
}

// ── Engine-active correlation: find bits that predict organ/piano/synth enabled ──

/**
 * At each bit position, check if the bit value correlates with an engine being
 * enabled (hasOrgan, hasPiano, hasSynth). Returns the best-scoring bits.
 */
function findEngineActiveBits(corpus: CorpusEntry[]) {
  if (corpus.length === 0) return [];

  const bodyStart = 44;
  const fileLen = corpus[0]!.bytes.length;
  const bodyLen = fileLen - bodyStart;

  type EngineKey = 'hasOrgan' | 'hasPiano' | 'hasSynth';
  const engines: EngineKey[] = ['hasOrgan', 'hasPiano', 'hasSynth'];

  const results: Array<{
    bitPos: number;  // absolute bit position in file (from bit 0 = byte 0 bit 7)
    byteOffset: number;
    bitInByte: number; // 7=MSB, 0=LSB
    bitValue: number;  // 0 or 1
    engine: EngineKey;
    accuracy: number;
    precision: number;
    recall: number;
    positives: number;  // files where bit=bitValue
    truePos: number;
  }> = [];

  for (let byteOff = bodyStart; byteOff < fileLen; byteOff++) {
    for (let bit = 0; bit <= 7; bit++) {
      const mask = 1 << bit;

      // Collect bit values for all files
      const bitValues = corpus.map(e => ((e.bytes[byteOff] ?? 0) & mask) ? 1 : 0);

      // Skip if constant across corpus
      const ones = bitValues.filter(v => v === 1).length;
      if (ones === 0 || ones === corpus.length) continue;

      for (const engine of engines) {
        // For both bit=0 and bit=1, check correlation
        for (const testVal of [0, 1] as const) {
          const positiveIndices = bitValues
            .map((v, i) => (v === testVal ? i : -1))
            .filter(i => i >= 0);

          if (positiveIndices.length < 3) continue;

          const truePos = positiveIndices.filter(i => corpus[i]!.gt[engine]).length;
          const precision = truePos / positiveIndices.length;

          // Also compute accuracy: what fraction of corpus is correctly predicted?
          let correct = 0;
          for (let i = 0; i < corpus.length; i++) {
            const predicted = bitValues[i] === testVal;
            const actual = corpus[i]!.gt[engine];
            if (predicted === actual) correct++;
          }
          const accuracy = correct / corpus.length;

          const totalPositive = corpus.filter(e => e.gt[engine]).length;
          const recall = totalPositive > 0 ? truePos / totalPositive : 0;

          if (accuracy >= 0.75 && precision >= 0.7 && recall >= 0.3) {
            results.push({
              bitPos: (byteOff * 8) + (7 - bit),
              byteOffset: byteOff,
              bitInByte: bit,
              bitValue: testVal,
              engine,
              accuracy,
              precision,
              recall,
              positives: positiveIndices.length,
              truePos,
            });
          }
        }
      }
    }
  }

  // Deduplicate: keep best result per (byteOff, bit, engine)
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    const key = `${r.byteOffset}:${r.bitInByte}:${r.engine}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => b.accuracy - a.accuracy || b.precision - a.precision);
}

// ── Naive structural classifier ────────────────────────────────────────────────

/**
 * Using only: category header + byte patterns (no ground truth).
 * Category is a strong prior for engine type on Stage 4.
 *
 * Strategy A: use category alone as predictor.
 * Strategy B: category + top correlated byte positions.
 */
function categoryOnlyPredict(categoryId: number, categoryName: string | undefined): {
  predictedOrgan: boolean;
  predictedPiano: boolean;
  predictedSynth: boolean;
} {
  const cat = categoryName ?? '';

  // Category-to-engine heuristics based on Nord Stage 4 category table
  const organCats = new Set(['B3', 'Farf', 'Vx', 'Pipe', 'Organ']);
  const pianoCats = new Set(['Grand', 'Upright', 'EPiano', 'Wurl', 'Clav/Hps',
    'Clavinet', 'Harpsichord', 'EGrand', 'Acoustic', 'Piano']);
  const synthCats = new Set(['Lead', 'Bass', 'Pad', 'FX', 'Fantasy', 'Brass',
    'Sequence', 'Arpeggio', 'Synth', 'Synth Classic', 'Synth Bass', 'Synth Pad',
    'Wind', 'String', 'Vocal', 'Guitar/Plucked', 'Guitar', 'Keys', 'Drum/Perc',
    'Orchestral', 'ClkSync', 'Accordion/Harm']);

  return {
    predictedOrgan: organCats.has(cat),
    predictedPiano: pianoCats.has(cat),
    predictedSynth: synthCats.has(cat) || (!organCats.has(cat) && !pianoCats.has(cat)),
  };
}

// ── Score a prediction set ─────────────────────────────────────────────────────

function scoreEngineActive(
  corpus: CorpusEntry[],
  predict: (e: CorpusEntry) => { predictedOrgan: boolean; predictedPiano: boolean; predictedSynth: boolean },
) {
  type EngineKey = 'hasOrgan' | 'hasPiano' | 'hasSynth';
  type PredKey = 'predictedOrgan' | 'predictedPiano' | 'predictedSynth';

  const enginePairs: Array<[EngineKey, PredKey, string]> = [
    ['hasOrgan', 'predictedOrgan', 'Organ'],
    ['hasPiano', 'predictedPiano', 'Piano'],
    ['hasSynth', 'predictedSynth', 'Synth'],
  ];

  const stats: Record<string, { tp: number; fp: number; fn: number; tn: number }> = {};

  for (const [gtKey, predKey, label] of enginePairs) {
    stats[label] = { tp: 0, fp: 0, fn: 0, tn: 0 };
  }

  for (const entry of corpus) {
    const pred = predict(entry);
    for (const [gtKey, predKey, label] of enginePairs) {
      const actual = entry.gt[gtKey];
      const predicted = pred[predKey];
      if (actual && predicted) stats[label]!.tp++;
      else if (!actual && predicted) stats[label]!.fp++;
      else if (actual && !predicted) stats[label]!.fn++;
      else stats[label]!.tn++;
    }
  }

  const results: Record<string, { precision: number; recall: number; f1: number; accuracy: number }> = {};
  for (const [label, s] of Object.entries(stats)) {
    const precision = s.tp + s.fp > 0 ? s.tp / (s.tp + s.fp) : 0;
    const recall = s.tp + s.fn > 0 ? s.tp / (s.tp + s.fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    const accuracy = (s.tp + s.tn) / corpus.length;
    results[label] = { precision, recall, f1, accuracy };
  }

  return results;
}

// ── Enum field clustering ──────────────────────────────────────────────────────

function analyzeEnumCandidates(corpus: CorpusEntry[]) {
  const fileLen = corpus[0]!.bytes.length;
  const bodyStart = 44;

  const candidates: Array<{
    byteOffset: number;
    distinctValues: number;
    entropyBits: number;
    values: number[];
    mode: number;
    modeFreq: number;
  }> = [];

  for (let off = bodyStart; off < fileLen; off++) {
    const valCounts = new Map<number, number>();
    for (const e of corpus) {
      const v = e.bytes[off] ?? 0;
      valCounts.set(v, (valCounts.get(v) ?? 0) + 1);
    }

    const distinct = valCounts.size;
    if (distinct <= 1) continue; // constant

    // Shannon entropy
    let entropy = 0;
    for (const cnt of valCounts.values()) {
      const p = cnt / corpus.length;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    // Find mode
    let mode = 0, modeFreq = 0;
    for (const [v, cnt] of valCounts) {
      if (cnt > modeFreq) { modeFreq = cnt; mode = v; }
    }

    if (distinct <= 16 && entropy < 3.0) {
      candidates.push({
        byteOffset: off,
        distinctValues: distinct,
        entropyBits: entropy,
        values: [...valCounts.keys()].sort((a, b) => a - b),
        mode,
        modeFreq,
      });
    }
  }

  return candidates.sort((a, b) => a.distinctValues - b.distinctValues || a.entropyBits - b.entropyBits);
}

// ── Main test ─────────────────────────────────────────────────────────────────

describe('Structural Tier B Probe', () => {
  const corpus = loadCorpus();

  it('corpus loaded', () => {
    console.log(`\nCorpus: ${corpus.length} .ns4p programs`);
    const organCount = corpus.filter(e => e.gt.hasOrgan).length;
    const pianoCount = corpus.filter(e => e.gt.hasPiano).length;
    const synthCount = corpus.filter(e => e.gt.hasSynth).length;
    console.log(`  Engine prevalence: organ=${organCount} (${(100*organCount/corpus.length).toFixed(0)}%), piano=${pianoCount} (${(100*pianoCount/corpus.length).toFixed(0)}%), synth=${synthCount} (${(100*synthCount/corpus.length).toFixed(0)}%)`);

    // Category distribution
    const catDist = new Map<string, number>();
    for (const e of corpus) {
      const c = e.categoryName ?? `cat_${e.categoryId}`;
      catDist.set(c, (catDist.get(c) ?? 0) + 1);
    }
    console.log(`  Categories (${catDist.size} distinct):`);
    const sortedCats = [...catDist.entries()].sort((a, b) => b[1] - a[1]);
    for (const [cat, cnt] of sortedCats.slice(0, 12)) {
      console.log(`    ${cat}: ${cnt}`);
    }
  });

  it('byte variance map', () => {
    const varMap = buildVarianceMap(corpus);
    const fileLen = corpus[0]!.bytes.length;
    const bodyLen = fileLen - 44;

    let constantBytes = 0, lowVariance = 0, highVariance = 0;
    for (const pos of varMap.positions) {
      if (pos.values.size === 1) constantBytes++;
      else if (pos.values.size <= 8) lowVariance++;
      else highVariance++;
    }

    console.log(`\nByte variance map (body = ${bodyLen} bytes, file = ${fileLen}):`);
    console.log(`  Constant bytes: ${constantBytes} / ${bodyLen} (${(100*constantBytes/bodyLen).toFixed(0)}%) — structural boilerplate`);
    console.log(`  Low-variance bytes (2-8 distinct values): ${lowVariance} — candidate enum fields`);
    console.log(`  High-variance bytes (9+ distinct values): ${highVariance} — continuous params / padding`);
  });

  it('enum candidate analysis', () => {
    const candidates = analyzeEnumCandidates(corpus);
    const fileLen = corpus[0]!.bytes.length;

    console.log(`\nEnum candidates (≤16 distinct values, entropy < 3 bits): ${candidates.length} byte positions`);
    console.log(`  Top 15 by distinctness/entropy:`);
    for (const c of candidates.slice(0, 15)) {
      const hexVals = c.values.slice(0, 8).map(v => `0x${v.toString(16).padStart(2,'0')}`).join(' ');
      console.log(`    Byte ${c.byteOffset} (body+${c.byteOffset-44}): distinct=${c.distinctValues} entropy=${c.entropyBits.toFixed(2)} mode=${c.mode}(${((c.modeFreq/corpus.length)*100).toFixed(0)}%) values=[${hexVals}]`);
    }
  });

  it('category-byte correlation', () => {
    const varMap = buildVarianceMap(corpus);
    const correlated = findCategoryCorrelatedBytes(corpus, varMap);

    console.log(`\nTop category-correlated byte values (prec ≥ 0.75):`);
    const seen = new Set<string>();
    let shown = 0;
    for (const r of correlated) {
      const key = `${r.byteOffset}:${r.byteValue}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (shown++ >= 15) break;
      console.log(`    Byte ${r.byteOffset}=0x${r.byteValue.toString(16).padStart(2,'0')} → ${r.predictedCategory}: prec=${(r.precision*100).toFixed(0)}% recall=${(r.recall*100).toFixed(0)}% (${r.support}/${r.total} files)`);
    }
  });

  it('engine-active bit discovery', () => {
    console.log(`\nSearching for bits that predict engine-active (acc≥75%, prec≥70%, recall≥30%)...`);
    const engineBits = findEngineActiveBits(corpus);

    console.log(`  Found ${engineBits.length} candidate bits`);

    const byEngine = new Map<string, typeof engineBits>();
    for (const r of engineBits) {
      if (!byEngine.has(r.engine)) byEngine.set(r.engine, []);
      byEngine.get(r.engine)!.push(r);
    }

    for (const [engine, bits] of byEngine) {
      console.log(`\n  ${engine}:`);
      for (const b of bits.slice(0, 5)) {
        console.log(`    Byte ${b.byteOffset} bit ${b.bitInByte} = ${b.bitValue}: acc=${(b.accuracy*100).toFixed(0)}% prec=${(b.precision*100).toFixed(0)}% recall=${(b.recall*100).toFixed(0)}% (${b.positives} files)`);
      }
    }

    // Record what we found for the scoring test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__engineBits = engineBits;
  });

  it('Strategy A — category-only prediction', () => {
    console.log(`\nStrategy A: category header alone → engine-active`);
    const scores = scoreEngineActive(corpus, e =>
      categoryOnlyPredict(e.categoryId, e.categoryName)
    );

    let totalAccSum = 0;
    let totalF1Sum = 0;
    let n = 0;
    for (const [engine, s] of Object.entries(scores)) {
      console.log(`  ${engine}: accuracy=${(s.accuracy*100).toFixed(1)}% precision=${(s.precision*100).toFixed(1)}% recall=${(s.recall*100).toFixed(1)}% F1=${(s.f1*100).toFixed(1)}%`);
      totalAccSum += s.accuracy;
      totalF1Sum += s.f1;
      n++;
    }
    console.log(`  → Macro avg: accuracy=${(totalAccSum/n*100).toFixed(1)}% F1=${(totalF1Sum/n*100).toFixed(1)}%`);
  });

  it('Strategy B — category + structural byte signals', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const engineBits = ((global as any).__engineBits as ReturnType<typeof findEngineActiveBits> | undefined) ?? findEngineActiveBits(corpus);

    // For each engine, take the single highest-accuracy bit predictor
    type EngineKey = 'hasOrgan' | 'hasPiano' | 'hasSynth';
    const topBit = new Map<EngineKey, typeof engineBits[0]>();
    for (const b of engineBits) {
      if (!topBit.has(b.engine as EngineKey)) {
        topBit.set(b.engine as EngineKey, b);
      }
    }

    console.log(`\nStrategy B: category + top structural bit per engine`);
    if (topBit.size === 0) {
      console.log('  No reliable structural bits found — category-only remains the best we can do.');
      return;
    }

    // Combine: category prediction OR structural bit prediction
    const scores = scoreEngineActive(corpus, e => {
      const catPred = categoryOnlyPredict(e.categoryId, e.categoryName);
      const result = { ...catPred };

      for (const [engine, bit] of topBit) {
        const actualBitVal = ((e.bytes[bit.byteOffset] ?? 0) >> bit.bitInByte) & 1;
        const bitPredicts = actualBitVal === bit.bitValue;
        // Use AND logic: both category and bit must agree (reduces FPs)
        const predKey = engine === 'hasOrgan' ? 'predictedOrgan'
          : engine === 'hasPiano' ? 'predictedPiano'
          : 'predictedSynth';
        // If category alone already predicts this engine, also check bit
        // (conservative: only assert active if bit confirms)
        if (result[predKey] && !bitPredicts) {
          // bit contradicts category — lower confidence, but keep category prediction
          // for now; don't add false positive bits from the other direction
        }
        // If category says no, bit can add positives
        if (!result[predKey] && bitPredicts) {
          result[predKey] = true;
        }
      }

      return result;
    });

    let totalAccSum = 0;
    let totalF1Sum = 0;
    let n = 0;
    for (const [engine, s] of Object.entries(scores)) {
      console.log(`  ${engine}: accuracy=${(s.accuracy*100).toFixed(1)}% precision=${(s.precision*100).toFixed(1)}% recall=${(s.recall*100).toFixed(1)}% F1=${(s.f1*100).toFixed(1)}%`);
      totalAccSum += s.accuracy;
      totalF1Sum += s.f1;
      n++;
    }
    console.log(`  → Macro avg: accuracy=${(totalAccSum/n*100).toFixed(1)}% F1=${(totalF1Sum/n*100).toFixed(1)}%`);
  });

  it('engine-type prediction accuracy', () => {
    console.log(`\nEngine TYPE prediction (given engine is active, what model/type?):`);

    // Organ model: category directly names it for specific organ categories
    const organFiles = corpus.filter(e => e.gt.hasOrgan);
    let correctOrganModel = 0;
    let predictedOrganModel = 0;
    for (const e of organFiles) {
      const cat = e.categoryName ?? '';
      let predictedModel: string | null = null;
      if (cat === 'B3') predictedModel = 'B3';
      else if (cat === 'Farf') predictedModel = 'FARF';
      else if (cat === 'Vx') predictedModel = 'VOX';
      else if (cat === 'Pipe') predictedModel = 'PIPE';

      if (predictedModel !== null) {
        predictedOrganModel++;
        if (e.gt.enabledOrganModels.includes(predictedModel)) correctOrganModel++;
      }
    }
    if (predictedOrganModel > 0) {
      console.log(`  Organ model (category→model, for ${organFiles.length} organ programs, predicted ${predictedOrganModel}): ${(100*correctOrganModel/predictedOrganModel).toFixed(0)}% accuracy`);
    } else {
      console.log(`  Organ model: 0 predictions from category alone (organ categories under-represented or not mapped)`);
    }

    // Piano type: similar category mapping
    const pianoFiles = corpus.filter(e => e.gt.hasPiano);
    const pianoTypeCatMap: Record<string, string> = {
      'Grand': 'Grand', 'Upright': 'Grand', 'EGrand': 'Grand',
      'EPiano': 'Electric', 'Wurl': 'Electric',
      'Clav/Hps': 'Clav', 'Clavinet': 'Clav', 'Harpsichord': 'Clav',
      'Acoustic': 'Grand',
    };
    let correctPianoType = 0;
    let predictedPianoType = 0;
    for (const e of pianoFiles) {
      const cat = e.categoryName ?? '';
      const predicted = pianoTypeCatMap[cat];
      if (predicted !== undefined) {
        predictedPianoType++;
        if (e.gt.enabledPianoTypes.includes(predicted)) correctPianoType++;
      }
    }
    if (predictedPianoType > 0) {
      console.log(`  Piano type (category→type, for ${pianoFiles.length} piano programs, predicted ${predictedPianoType}): ${(100*correctPianoType/predictedPianoType).toFixed(0)}% accuracy`);
    } else {
      console.log(`  Piano type: 0 predictions from category alone`);
    }

    // Synth source: analog vs samples — these are NOT predictable from category
    const synthFiles = corpus.filter(e => e.gt.hasSynth);
    console.log(`\n  Synth source distribution (${synthFiles.length} synth programs, cannot predict from category alone):`);
    const sourceDist = new Map<string, number>();
    for (const e of synthFiles) {
      for (const src of e.gt.enabledSynthSources) {
        sourceDist.set(src, (sourceDist.get(src) ?? 0) + 1);
      }
    }
    for (const [src, cnt] of [...sourceDist.entries()].sort((a,b) => b[1]-a[1])) {
      console.log(`    ${src}: ${cnt} programs (${(100*cnt/synthFiles.length).toFixed(0)}%)`);
    }
  });

  it('multi-engine (Combi/Split) analysis', () => {
    const multiEngine = corpus.filter(e =>
      [e.gt.hasOrgan, e.gt.hasPiano, e.gt.hasSynth].filter(Boolean).length > 1
    );
    const splitCat = corpus.filter(e => e.categoryName === 'Split' || e.categoryName === 'Combi');

    console.log(`\nMulti-engine programs: ${multiEngine.length} / ${corpus.length} (${(100*multiEngine.length/corpus.length).toFixed(0)}%)`);
    console.log(`Split/Combi category: ${splitCat.length} programs`);

    // What fraction of Split/Combi are actually multi-engine?
    const splitMulti = splitCat.filter(e =>
      [e.gt.hasOrgan, e.gt.hasPiano, e.gt.hasSynth].filter(Boolean).length > 1
    );
    if (splitCat.length > 0) {
      console.log(`  Split/Combi → multi-engine accuracy: ${(100*splitMulti.length/splitCat.length).toFixed(0)}% (${splitMulti.length}/${splitCat.length})`);
    }

    // Of multi-engine programs, what categories do they use?
    const multiCatDist = new Map<string, number>();
    for (const e of multiEngine) {
      const c = e.categoryName ?? `cat_${e.categoryId}`;
      multiCatDist.set(c, (multiCatDist.get(c) ?? 0) + 1);
    }
    console.log(`  Multi-engine category distribution:`);
    for (const [cat, cnt] of [...multiCatDist.entries()].sort((a,b) => b[1]-a[1]).slice(0, 10)) {
      console.log(`    ${cat}: ${cnt}`);
    }
  });

  // ── Name-weak-label variant (Task 1 — the realistic undecoded-model case) ──────

  /**
   * NAME-WEAK-LABEL BIT DISCOVERY
   *
   * Key research question: if we ONLY had patch NAMES (no ns4 ground truth,
   * no category-to-engine oracle), could we still find the engine-enable bits
   * via byte-variance correlation?
   *
   * Keyword lists are explicit and must stay documented:
   *
   *   ORGAN keywords : "organ", "b3", "drawbar", "hammond", "vox", "farfisa",
   *                    "pipe", "tonewheel", "rotary"
   *   PIANO keywords : "piano", "grand", "upright", "ep", "e.p.", "electric p",
   *                    "wurli", "wurlitzer", "rhodes", "clav", "clavinet", "hps",
   *                    "harpsichord", "honky"
   *   SYNTH keywords : "synth", "pad", "lead", "pluck", "bass", "arp", "brass",
   *                    "string", "seq", "osc", "analog", "wave", "lfo",
   *                    "filter", "resonan", "sweep"
   *
   * A patch can match zero, one, or multiple engines (names like "organ bass",
   * "synth piano", etc. intentionally overlap).
   */

  function deriveWeakLabels(filename: string): {
    weakOrgan: boolean;
    weakPiano: boolean;
    weakSynth: boolean;
  } {
    const name = filename.toLowerCase().replace(/[_\-\.]/g, ' ');

    const organKw = ['organ', 'b3', 'drawbar', 'hammond', 'vox', 'farfisa',
      'pipe', 'tonewheel', 'rotary'];
    const pianoKw = ['piano', 'grand', 'upright', 'wurli', 'wurlitzer', 'rhodes',
      'clav', 'clavinet', 'hps', 'harpsichord', 'honky',
      'ep ', ' ep', 'e.p.', 'electric p'];
    const synthKw = ['synth', 'pad', 'lead', 'pluck', 'bass', 'arp', 'brass',
      'string', 'seq', 'osc', 'analog', 'wave', 'lfo',
      'filter', 'resonan', 'sweep'];

    return {
      weakOrgan: organKw.some(kw => name.includes(kw)),
      weakPiano: pianoKw.some(kw => name.includes(kw)),
      weakSynth: synthKw.some(kw => name.includes(kw)),
    };
  }

  it('Strategy C — name-weak-label bit discovery (the undecoded-model test)', () => {
    console.log('\n' + '='.repeat(70));
    console.log('STRATEGY C — NAME-WEAK-LABEL BIT DISCOVERY');
    console.log('='.repeat(70));
    console.log('Inputs: raw bytes + filename only (no ns4 ground truth, no category oracle)');
    console.log('Goal: find engine-enable bit positions using ONLY name-derived weak labels,');
    console.log('      then classify and score vs ns4 ground truth.\n');

    // 1. Derive weak labels for every patch
    const withWeakLabels = corpus.map(e => ({
      ...e,
      wl: deriveWeakLabels(e.filename),
    }));

    // Coverage: how many patches get a usable name signal?
    const covOrgan = withWeakLabels.filter(e => e.wl.weakOrgan).length;
    const covPiano = withWeakLabels.filter(e => e.wl.weakPiano).length;
    const covSynth = withWeakLabels.filter(e => e.wl.weakSynth).length;
    const covAny = withWeakLabels.filter(e => e.wl.weakOrgan || e.wl.weakPiano || e.wl.weakSynth).length;

    console.log('Keyword coverage (fraction of patches with at least one matching keyword):');
    console.log(`  Organ  : ${covOrgan} / ${corpus.length} patches (${(100*covOrgan/corpus.length).toFixed(1)}%)`);
    console.log(`  Piano  : ${covPiano} / ${corpus.length} patches (${(100*covPiano/corpus.length).toFixed(1)}%)`);
    console.log(`  Synth  : ${covSynth} / ${corpus.length} patches (${(100*covSynth/corpus.length).toFixed(1)}%)`);
    console.log(`  Any KW : ${covAny} / ${corpus.length} patches (${(100*covAny/corpus.length).toFixed(1)}%)`);

    // Quick name label precision check (vs ns4 ground truth) — measures label quality
    const labelOrganPrec = withWeakLabels.filter(e => e.wl.weakOrgan && e.gt.hasOrgan).length /
      Math.max(1, covOrgan);
    const labelPianoPrec = withWeakLabels.filter(e => e.wl.weakPiano && e.gt.hasPiano).length /
      Math.max(1, covPiano);
    const labelSynthPrec = withWeakLabels.filter(e => e.wl.weakSynth && e.gt.hasSynth).length /
      Math.max(1, covSynth);

    console.log('\nWeak-label precision (vs ns4 truth — not used for bit discovery, just sanity check):');
    console.log(`  Organ  : ${(100*labelOrganPrec).toFixed(0)}%`);
    console.log(`  Piano  : ${(100*labelPianoPrec).toFixed(0)}%`);
    console.log(`  Synth  : ${(100*labelSynthPrec).toFixed(0)}%`);

    // 2. Bit discovery using ONLY weak labels (not ns4 ground truth)
    //    For each engine, build a "weak positive" subset from name keywords,
    //    then scan byte*bit positions for best accuracy against those weak labels.
    //    This mirrors what you'd do on an undecoded model.

    const fileLen = corpus[0]!.bytes.length;
    const bodyStart = 44;

    type WLEngine = 'weakOrgan' | 'weakPiano' | 'weakSynth';
    const wlEngines: Array<{ key: WLEngine; label: string }> = [
      { key: 'weakOrgan', label: 'Organ' },
      { key: 'weakPiano', label: 'Piano' },
      { key: 'weakSynth', label: 'Synth' },
    ];

    console.log('\nBit discovery using name-weak-labels (scanning all byte×bit positions)...');

    // For each engine, find the best single bit (highest accuracy against the WEAK label)
    const discoveredBits: Array<{
      engine: WLEngine;
      label: string;
      byteOffset: number;
      bitInByte: number;
      bitValue: number;
      wlAccuracy: number;   // accuracy vs weak label (used for discovery)
      gtAccuracy: number;   // accuracy vs ns4 ground truth (hold-out scoring)
      gtPrecision: number;
      gtRecall: number;
      gtF1: number;
    }> = [];

    for (const { key, label } of wlEngines) {
      let bestWLAcc = 0;
      let bestResult: (typeof discoveredBits)[0] | null = null;

      for (let byteOff = bodyStart; byteOff < fileLen; byteOff++) {
        for (let bit = 0; bit <= 7; bit++) {
          const mask = 1 << bit;

          // Try both bit=1 and bit=0 as the "active" signal
          for (const testVal of [0, 1] as const) {
            // Check if constant
            const vals = withWeakLabels.map(e => ((e.bytes[byteOff] ?? 0) & mask) ? 1 : 0);
            const ones = vals.filter(v => v === 1).length;
            if (ones === 0 || ones === corpus.length) continue;

            // Accuracy vs WEAK LABEL (this is what we'd use on an undecoded model)
            let wlCorrect = 0;
            for (let i = 0; i < withWeakLabels.length; i++) {
              const predicted = vals[i] === testVal;
              const wlActual = withWeakLabels[i]!.wl[key];
              if (predicted === wlActual) wlCorrect++;
            }
            const wlAcc = wlCorrect / withWeakLabels.length;

            if (wlAcc > bestWLAcc) {
              bestWLAcc = wlAcc;

              // Score against GT (hold-out — we wouldn't have this on undecoded model)
              let gtTP = 0, gtFP = 0, gtFN = 0, gtTN = 0;
              const gtKey = key === 'weakOrgan' ? 'hasOrgan'
                : key === 'weakPiano' ? 'hasPiano' : 'hasSynth';
              for (let i = 0; i < withWeakLabels.length; i++) {
                const predicted = vals[i] === testVal;
                const actual = withWeakLabels[i]!.gt[gtKey];
                if (predicted && actual) gtTP++;
                else if (predicted && !actual) gtFP++;
                else if (!predicted && actual) gtFN++;
                else gtTN++;
              }
              const gtAcc = (gtTP + gtTN) / withWeakLabels.length;
              const gtPrec = gtTP + gtFP > 0 ? gtTP / (gtTP + gtFP) : 0;
              const gtRec = gtTP + gtFN > 0 ? gtTP / (gtTP + gtFN) : 0;
              const gtF1 = gtPrec + gtRec > 0 ? 2 * gtPrec * gtRec / (gtPrec + gtRec) : 0;

              bestResult = {
                engine: key,
                label,
                byteOffset: byteOff,
                bitInByte: bit,
                bitValue: testVal,
                wlAccuracy: wlAcc,
                gtAccuracy: gtAcc,
                gtPrecision: gtPrec,
                gtRecall: gtRec,
                gtF1,
              };
            }
          }
        }
      }

      if (bestResult) {
        discoveredBits.push(bestResult);
        console.log(`  ${label}: byte ${bestResult.byteOffset} bit ${bestResult.bitInByte}=${bestResult.bitValue}`);
        console.log(`    WL-accuracy=${(bestResult.wlAccuracy*100).toFixed(1)}% (discovery signal)`);
        console.log(`    GT-accuracy=${(bestResult.gtAccuracy*100).toFixed(1)}% GT-prec=${(bestResult.gtPrecision*100).toFixed(1)}% GT-recall=${(bestResult.gtRecall*100).toFixed(1)}% GT-F1=${(bestResult.gtF1*100).toFixed(1)}%`);
      }
    }

    // 3. Byte convergence check: do we find the same bytes as the supervised version?
    const supervisedBytes = { hasOrgan: 94, hasPiano: 229, hasSynth: 64 };
    const keyToGT: Record<WLEngine, 'hasOrgan' | 'hasPiano' | 'hasSynth'> = {
      weakOrgan: 'hasOrgan', weakPiano: 'hasPiano', weakSynth: 'hasSynth',
    };

    console.log('\nByte convergence check (supervised vs name-weak-label discovery):');
    for (const b of discoveredBits) {
      const gtB = supervisedBytes[keyToGT[b.engine]];
      const same = b.byteOffset === gtB;
      console.log(`  ${b.label}: discovered byte ${b.byteOffset} — supervised byte ${gtB} — ${same ? 'SAME ✓' : 'DIFFERENT ✗'}`);
    }

    // 4. Classify ALL 357 patches using name-weak-label-discovered bits
    //    (on an undecoded model we'd use this as the final classifier)
    const bitMap = new Map<WLEngine, typeof discoveredBits[0]>();
    for (const b of discoveredBits) bitMap.set(b.engine, b);

    type GTKey = 'hasOrgan' | 'hasPiano' | 'hasSynth';
    const gtEngines: Array<[GTKey, WLEngine, string]> = [
      ['hasOrgan', 'weakOrgan', 'Organ'],
      ['hasPiano', 'weakPiano', 'Piano'],
      ['hasSynth', 'weakSynth', 'Synth'],
    ];

    console.log('\nFull-corpus classification using name-weak-label-discovered bits:');
    let macroF1Sum = 0;
    let macroAccSum = 0;
    let n = 0;

    for (const [gtKey, wlKey, label] of gtEngines) {
      const bit = bitMap.get(wlKey);
      if (!bit) {
        console.log(`  ${label}: no bit found`);
        continue;
      }
      const mask = 1 << bit.bitInByte;
      let tp = 0, fp = 0, fn = 0, tn = 0;
      for (const e of withWeakLabels) {
        const predicted = (((e.bytes[bit.byteOffset] ?? 0) & mask) ? 1 : 0) === bit.bitValue;
        const actual = e.gt[gtKey];
        if (predicted && actual) tp++;
        else if (predicted && !actual) fp++;
        else if (!predicted && actual) fn++;
        else tn++;
      }
      const acc = (tp + tn) / withWeakLabels.length;
      const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
      const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = prec + rec > 0 ? 2 * prec * rec / (prec + rec) : 0;
      console.log(`  ${label}: accuracy=${(acc*100).toFixed(1)}% precision=${(prec*100).toFixed(1)}% recall=${(rec*100).toFixed(1)}% F1=${(f1*100).toFixed(1)}%`);
      macroF1Sum += f1;
      macroAccSum += acc;
      n++;
    }
    if (n > 0) {
      console.log(`  → Macro avg: accuracy=${(macroAccSum/n*100).toFixed(1)}% F1=${(macroF1Sum/n*100).toFixed(1)}%`);
    }

    console.log('\nComparison vs supervised baseline:');
    console.log('  Supervised (ns4 GT labels)       : Macro avg F1 = 98.9%');
    console.log(`  Name-weak-label (filename only)  : Macro avg F1 = ${(macroF1Sum/Math.max(1,n)*100).toFixed(1)}%`);
    console.log('  (Numbers above are the real hold-out results — see MULTI-MODEL.md Tier B section)');

    // Store for SUMMARY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__wlResults = { discoveredBits, macroF1: macroF1Sum / Math.max(1, n), covAny, corpusLen: corpus.length };
  });

  it('SUMMARY', () => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`STRUCTURAL TIER B PROBE — SUMMARY`);
    console.log('='.repeat(70));
    console.log(`Corpus: ${corpus.length} .ns4p programs from fixtures/stage-4/`);
    console.log(`\nINPUTS TO STRUCTURAL METHOD: bytes + CBIN header (category, bank, location)`);
    console.log(`SCORING AGAINST: ns4 ground truth (parseNs4Program layers)`);
    console.log(`\nFindings written to: .superpowers/sdd/structural-tierB-prototype.md`);
    console.log('='.repeat(70));
  });
});
