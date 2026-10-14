/**
 * make-test-sample — writes the sample half of the hardware test kit: tiny synthetic
 * `.nsmp4`/`.nsmp3` samples built from scratch (no Nord audio), to load with Nord Sound
 * Manager's Samples tab and play on a Stage 4.
 *
 *   samples/   S0–S5 (see SPECS below), each read back with our own reader before it is written
 *   previews/  every stroke decoded back to WAV, to hear what the Nord should play
 *
 * Every tone is an A (A3 = 220 Hz, A4 = 440 Hz) stored at the Nord's 35,002 Hz sample rate,
 * so a key that matches the zone's root plays exactly that pitch. Output goes to a folder git
 * ignores (default `hardware-test/` in packages/core).
 *
 * Run from packages/core:
 *   npm run hw:test-sample
 *   npm run hw:test-sample -- --out /some/dir
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { writeNsmpMulti, type WriteZone } from '@/lib/ns4/nsmp-write';
import { decodeNsmp, readNsmp, readNsmpZones, NSMP_SAMPLE_RATE } from '@/lib/ns4/nsmp';
import { importWavToNsmp } from '@/lib/ns4/nsmp-convert';
import { encodeWav } from '@/lib/ns4/wav';

const { values } = parseArgs({ options: { out: { type: 'string', default: 'hardware-test' } } });
const out = resolve(values.out!);
const dirs = { samples: join(out, 'samples'), previews: join(out, 'previews') };
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });
const show = (p: string) => relative(process.cwd(), p) || '.';

const SR = NSMP_SAMPLE_RATE; // 35,002 Hz
const A3 = 57, A4 = 69;

/** A tone of `seconds` at `hz`: harmonics give it a brighter colour; 10 ms fade-in, and a
 *  10 ms fade-out unless it is meant to loop to its end. */
function tone(hz: number, seconds: number, opts: { harmonics?: number[]; peak?: number; rate?: number; fadeOut?: boolean } = {}): Int16Array {
  const rate = opts.rate ?? SR;
  const n = Math.round(seconds * rate);
  const h = opts.harmonics ?? [1];
  const norm = h.reduce((a, b) => a + Math.abs(b), 0);
  const peak = (opts.peak ?? 0.2) * 32767; // ~6,550: the level real strokes sit at (4,000–8,200)
  const fade = Math.round(0.01 * rate);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let k = 0; k < h.length; k++) v += h[k] * Math.sin((2 * Math.PI * hz * (k + 1) * i) / rate);
    let g = Math.min(1, i / fade);
    if (opts.fadeOut !== false) g *= Math.min(1, (n - 1 - i) / fade);
    out[i] = Math.round((v / norm) * peak * g);
  }
  return out;
}

/** 440 Hz at 35,002 Hz repeats every 79.55 frames; 20 cycles are exactly 1,591 frames. */
const LOOP_A4 = 1591;

interface Spec { id: string; file: string; purpose: string; listen: string; bytes: Uint8Array }

function nsmp(name: string, codec: 3 | 4, zones: WriteZone[]): Uint8Array {
  return writeNsmpMulti({ name, codec, zones });
}

const whole = { keyLow: 0, keyHigh: 127 };
const specs: Spec[] = [
  {
    id: 'S0', file: 'OpenNord_S0_container.nsmp4',
    purpose: 'the container: one mono zone over the whole keyboard, root A4, 2 s of a pure 440 Hz sine, no loop.',
    listen: 'A4 plays a 440 Hz sine for 2 s and stops while held; A3 plays 220 Hz, an octave down.',
    bytes: nsmp('ON S0 container', 4, [{ channels: [tone(440, 2)], rootKey: A4, ...whole }]),
  },
  {
    id: 'S1', file: 'OpenNord_S1_loop.nsmp4',
    purpose: 'the loop: as S0, but the last 20 cycles (from 1 s) loop for as long as the key is held, no decay.',
    listen: 'A4 sustains at a steady level while held, with no click or buzz at the loop point.',
    bytes: nsmp('ON S1 loop', 4, [{
      channels: [tone(440, 1 + LOOP_A4 / SR, { fadeOut: false })], rootKey: A4, ...whole,
      stroke: { loop: { loopStart: Math.round(SR) , altStart: 0, loops: true } },
    }]),
  },
  {
    id: 'L1', file: 'OpenNord_L1_loop_aligned.nsmp4',
    purpose: 'loop variant: a 437.5 Hz sine (exactly 80 frames a cycle), loop from frame 32,000 to 33,600, both on 32-frame block boundaries.',
    listen: 'A4 sustains steadily while held (slightly flat of 440: it is 437.5 Hz).',
    bytes: nsmp('ON L1 loop aligned', 4, [{
      channels: [tone(SR / 80, 33600 / SR, { fadeOut: false })], rootKey: A4, ...whole,
      stroke: { loop: { loopStart: 32000, altStart: 0, loops: true } },
    }]),
  },
  {
    id: 'L2', file: 'OpenNord_L2_loop_long.nsmp4',
    purpose: 'loop variant: as L1 but a long loop, from 0.5 s to 2 s (1.5 s of whole cycles), like the loops of real string and organ samples.',
    listen: 'A4 sustains steadily while held.',
    bytes: nsmp('ON L2 loop long', 4, [{
      channels: [tone(SR / 80, 70000 / SR, { fadeOut: false })], rootKey: A4, ...whole,
      stroke: { loop: { loopStart: 17520, altStart: 0, loops: true } },
    }]),
  },
  {
    id: 'S2', file: 'OpenNord_S2_zones_layers.nsmp4',
    purpose: 'splits and velocity layers: low zone (up to G#4, A3 recording) and high zone (A4 up), each with a soft layer (vel 0–63, pure sine) and a hard layer (64–127, bright).',
    listen: 'A3 and A4 both play their own pitch; playing softly gives a pure sine, hard gives a buzzy tone at the same pitch.',
    bytes: nsmp('ON S2 zones+layers', 4, [
      { channels: [tone(220, 1.5)], rootKey: A3, keyLow: 0, keyHigh: 68, velLow: 0, velTop: 63 },
      { channels: [tone(220, 1.5, { harmonics: [1, 0.5, 0.33, 0.25, 0.2] })], rootKey: A3, keyLow: 0, keyHigh: 68, velLow: 64, velTop: 127 },
      { channels: [tone(440, 1.5)], rootKey: A4, keyLow: 69, keyHigh: 127, velLow: 0, velTop: 63 },
      { channels: [tone(440, 1.5, { harmonics: [1, 0.5, 0.33, 0.25, 0.2] })], rootKey: A4, keyLow: 69, keyHigh: 127, velLow: 64, velTop: 127 },
    ]),
  },
  {
    id: 'S3', file: 'OpenNord_S3_stereo.nsmp4',
    purpose: 'stereo and channel order: left is a 440 Hz sine, right is silent for 1 s, then both sound.',
    listen: 'A4 (sample panned centre): the first second is only in the LEFT output, then both sides.',
    bytes: nsmp('ON S3 stereo', 4, [{
      channels: [tone(440, 2), Int16Array.from(tone(440, 2), (v, i) => (i < SR ? 0 : v))], rootKey: A4, ...whole,
    }]),
  },
  {
    id: 'S4', file: 'OpenNord_S4_codec3.nsmp3',
    purpose: 'the older generation: S0 written as .nsmp3 (Stage 3 format).',
    listen: 'Does Sound Manager take it for the Stage 4 (it may offer to convert)? If loaded, it should play as S0.',
    bytes: nsmp('ON S4 nsmp3', 3, [{ channels: [tone(440, 2)], rootKey: A4, ...whole }]),
  },
  {
    id: 'S5', file: 'OpenNord_S5_wav_import.nsmp4',
    purpose: 'the WAV import path a "Build sample" screen would use: a 44.1 kHz WAV of a 440 Hz sine, resampled to 35,002 Hz by importWavToNsmp, root A4.',
    listen: 'A4 plays 440 Hz, like S0; keys below A4 are silent (the import starts the zone at its root). About 4 semitones off means the import rate is wrong.',
    bytes: importWavToNsmp(
      encodeWav([Float32Array.from(tone(440, 2, { rate: 44100 }), (v) => v / 32768)], 44100),
      { codec: 4, name: 'ON S5 wav import', rootKey: A4, keyHigh: 127, targetRate: SR },
    ).bytes,
  },
];

// Inputs for building the same layered sample in the Nord Sample Editor, to compare its file
// with ours: 44.1 kHz WAVs (the editor takes 44.1, 48 or 96 kHz only; the previews are at the
// Nord's internal 35,002 Hz). Same tones as S2.
const nseDir = join(out, 'nse-input');
mkdirSync(nseDir, { recursive: true });
const BRIGHT = [1, 0.5, 0.33, 0.25, 0.2];
for (const [file, hz, harmonics] of [
  ['A3_soft.wav', 220, [1]], ['A3_hard.wav', 220, BRIGHT], ['A4_soft.wav', 440, [1]], ['A4_hard.wav', 440, BRIGHT],
] as const) {
  const pcm = tone(hz, 1.5, { rate: 44100, harmonics: [...harmonics] });
  writeFileSync(join(nseDir, file), encodeWav([Float32Array.from(pcm, (v) => v / 32768)], 44100));
}

let failed = 0;
console.log(`OpenNord sample test kit → ${show(out)}\n`);
for (const s of specs) {
  const file = join(dirs.samples, s.file);
  writeFileSync(file, s.bytes);
  console.log(`${s.id}  ${show(file)}  (${(s.bytes.length / 1024).toFixed(0)} KB)`);
  console.log(`    ${s.purpose}`);
  console.log(`    listen for: ${s.listen}`);
  try {
    const head = readNsmp(s.bytes);
    const zones = readNsmpZones(s.bytes);
    const strokes = decodeNsmp(s.bytes);
    const z = zones.map((x) => `keys ${x.keyLow}–${x.keyHigh} root ${x.rootKey} vel ${x.velLow}–${x.velTop}`).join('; ');
    console.log(`    read back: "${head.name}", ${zones.length} zone(s) [${z}], ${strokes.length} stroke(s)`);
    for (const st of strokes) {
      const loop = st.loop ? ` loop ${st.loop.loopStart}…${st.loop.loopEnd}` : '';
      console.log(`      stroke ${st.index}: ${st.channelCount} ch, ${st.channels[0].length} frames @ ${st.sampleRate} Hz${loop}`);
      const pcm = st.channels.map((c) => Float32Array.from(c, (v) => v / 32768));
      writeFileSync(join(dirs.previews, `${s.id}-stroke${st.index}.wav`), encodeWav(pcm, st.sampleRate));
    }
  } catch (e) {
    failed++;
    console.log(`    ✗ read back FAILED: ${(e as Error).message}`);
  }
  console.log('');
}
if (failed) { console.log(`${failed} sample(s) failed to read back.`); process.exit(1); }
console.log('All samples read back. Load them with Nord Sound Manager (Samples tab) into EMPTY locations.');
