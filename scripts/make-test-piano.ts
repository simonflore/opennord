/**
 * make-test-piano — writes the hardware test kit:
 *   pianos/    four tiny synthetic .npno pianos (T0–T3), each checked with
 *              checkNpnoAcceptance(deep) — load them with Nord Sound Manager's Piano tab
 *   previews/  each test stroke decoded back to WAV, to hear what the Nord should play
 *   midi/      a velocity sweep, held keys, a staccato note and a compressor burst, to play the
 *              Nord from a DAW (MIDI channel 1)
 *   recordings/  an empty folder for your takes
 *
 * All audio is generated from sines (no Nord audio). Everything goes to a local folder that
 * git ignores (default `hardware-test/` in packages/core); nothing is uploaded.
 *
 * Run from packages/core:
 *   npm run hw:test-piano                     # → hardware-test/
 *   npm run hw:test-piano -- --out /some/dir
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { testPianoSpecs } from '@/lib/hwtest/test-piano';
import { compressorBurst, heldKeys, velocitySweep, writeMidiFile } from '@/lib/hwtest/midi-file';
import { checkNpnoAcceptance } from '@/lib/ns4/nsp-check';
import { decodeNspStroke, NSP_SAMPLE_RATE, readNspDirectory } from '@/lib/ns4/nsp-audio';
import { buildNpno, NPNO_RECORDING_ABOVE_TOP_KEY } from '@/lib/ns4/nsp-write';
import { encodeWav } from '@/lib/ns4/wav';

const { values } = parseArgs({ options: { out: { type: 'string', default: 'hardware-test' } } });
const out = resolve(values.out!);
const dirs = { pianos: join(out, 'pianos'), previews: join(out, 'previews'), midi: join(out, 'midi'), recordings: join(out, 'recordings') };
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });
const show = (p: string) => relative(process.cwd(), p) || '.';

let failed = 0;
console.log(`OpenNord hardware test kit → ${show(out)}\n`);
for (const spec of testPianoSpecs()) {
  const { bytes, fileName, notes } = buildNpno(spec.input);
  const acc = checkNpnoAcceptance(bytes, { deep: true });
  const file = join(dirs.pianos, fileName);
  writeFileSync(file, bytes);
  console.log(`${spec.id}  ${show(file)}  (${(bytes.length / 1024).toFixed(0)} KB)`);
  console.log(`    ${spec.purpose}`);
  console.log(`    acceptance: ${acc.ok ? `all ${acc.checks.length} checks ok` : 'FAILED'} (NSM version ${acc.nsmVersion})`);
  for (const c of acc.checks.filter((x) => !x.ok)) console.log(`      ✗ ${c.id}: ${c.detail}`);
  for (const n of notes) console.log(`    note: ${n}`);
  if (!acc.ok) failed++;

  // Decode every stroke back out of the written file, at the rate that makes it sound as the
  // Nord should play it on the zone's top key (A4, or A3 for T3's low zone): 3 semitones down.
  const dir = readNspDirectory(bytes)!;
  for (const s of dir.strokes) {
    const pcm = decodeNspStroke(bytes, dir, s).map((c) => Float32Array.from(c, (v) => v / 32768));
    const zone = [...spec.input.zones].sort((a, b) => a.rootNote - b.rootNote)[s.zone];
    const layer = dir.strokes.filter((x) => x.zone === s.zone).indexOf(s);
    const tag = `${spec.id}-${zone.highNote === 69 ? 'A4' : 'A3'}${spec.id === 'T2' ? `-layer${layer + 1}-${layer === 0 ? 'hard' : 'soft'}` : ''}`;
    const wav = join(dirs.previews, `${tag}.wav`);
    writeFileSync(wav, encodeWav(pcm, Math.round(NSP_SAMPLE_RATE / 2 ** (NPNO_RECORDING_ABOVE_TOP_KEY / 12))));
  }
  console.log('');
}

const midi = {
  'sweep-A4.mid': velocitySweep(69),
  'pitch-A3-Gs4-A4.mid': heldKeys([57, 68, 69], 100, 3, 1.5),
  'hold-A4-8s.mid': heldKeys([69], 100, 8, 2),
  'hold-A4-3s.mid': heldKeys([69], 100, 3, 1),
  'staccato-A4.mid': heldKeys([69], 110, 0.2, 5),
  'comp-A2-burst.mid': compressorBurst(),
};
for (const [name, notes] of Object.entries(midi)) writeFileSync(join(dirs.midi, name), writeMidiFile(notes));
console.log(`previews: ${show(dirs.previews)}/  (decoded test strokes, 44.1 kHz)`);
console.log(`midi:     ${show(dirs.midi)}/  ${Object.keys(midi).join(', ')} (MIDI channel 1)`);
console.log(`record into: ${show(dirs.recordings)}/  (local only; git ignores this folder)`);
if (failed) {
  console.error(`\n${failed} test piano(s) failed an acceptance check: don't load them.`);
  process.exit(1);
}
