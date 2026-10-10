/**
 * compare-recording — measure a recording of the Nord's output and compare it with
 * OpenNord's own render of the same note.
 *
 * Measures pitch (autocorrelation), peak/RMS level, brightness (spectral centroid), the
 * envelope (attack, 20 dB fall, T60) and, with --mod, tremolo/rotor and vibrato rate and
 * depth. Prints Nord vs OpenNord with deltas in cents, dB and ms.
 *
 * Local only: it reads your WAV (and your own .npno / .ns4p) from disk, prints to the
 * terminal and writes only the files you name (--json, --save-render). Nothing is uploaded.
 *
 * Run from packages/core:
 *   npm run hw:compare -- <recording.wav> --note A4 [options]
 *
 * What to compare against (default: nothing, just measure):
 *   --engine organ   [--program my.ns4p --part A | --drawbars 888000000 --perc 2nd,fast,normal --vib C3 --click 0.5]
 *   --engine piano   --npno my-piano.npno [--velocity 100 | --layer 0] [--pitch-model A|B|C]
 *   --engine synth   --program my.ns4p [--part A]
 *   --vs other.wav   another recording (e.g. the test piano against a factory piano)
 * Options:
 *   --hold 2         seconds the key was held (default 2)
 *   --nth 3          analyse only the 3rd note of a take with several notes (--vs-nth for --vs)
 *   --window 0.1:0.5 analyse only this part, in seconds after the note starts
 *   --channel mix|left|right|side   (default mix; side = L − R, shows rotary motion)
 *   --mod            also measure tremolo / rotor and vibrato
 *   --track          print the tremolo / rotor rate over time (rotary spin-up)
 *   --timeline       print level and brightness every 0.1 s (filter sweep, compressor, reverb tail);
 *                    --step 0.02 for finer steps
 *   --sweep          the take is a velocity sweep (midi/sweep-A4.mid); --velocities 127,119,…
 *   --save-render out.wav   write OpenNord's render to listen to (stays on your disk)
 *   --json out.json  write the numbers
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';
import {
  centsBetween, findOnset, measure, modulationTrack, nthNote, timeline, type TimelineRow, noteName, noteToHz, parseNote, pickChannel, readRecording,
  type ChannelPick, type MeasureOptions, type Measurement,
} from '@/lib/hwtest/analysis';
import {
  analyzeSweep, compareRows, formatRows, formatSweep, measureReference, organParamsFromFlags, organReference,
  pianoReference, referenceMono, synthReference, type PianoReference, type Reference,
} from '@/lib/hwtest/compare';
import { SWEEP_VELOCITIES } from '@/lib/hwtest/midi-file';
import { organParamsFromLayer } from '@/lib/engine/organ/params';
import { parseNs4Program } from '@/lib/ns4/parse';
import { previewParamsFromLayer } from '@/lib/ns4/synth-preview';
import { encodeWav } from '@/lib/ns4/wav';

const { values: a, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    note: { type: 'string' },
    engine: { type: 'string', default: 'none' },
    npno: { type: 'string' },
    program: { type: 'string' },
    part: { type: 'string', default: 'A' },
    velocity: { type: 'string' },
    layer: { type: 'string' },
    'pitch-model': { type: 'string' },
    drawbars: { type: 'string' },
    perc: { type: 'string' },
    vib: { type: 'string' },
    click: { type: 'string' },
    model: { type: 'string' },
    hold: { type: 'string', default: '2' },
    window: { type: 'string' },
    channel: { type: 'string', default: 'mix' },
    mod: { type: 'boolean', default: false },
    track: { type: 'boolean', default: false },
    timeline: { type: 'boolean', default: false },
    nth: { type: 'string' },
    'vs-nth': { type: 'string' },
    step: { type: 'string', default: '0.1' },
    sweep: { type: 'boolean', default: false },
    velocities: { type: 'string' },
    vs: { type: 'string' },
    'save-render': { type: 'string' },
    json: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

function fail(msg: string): never {
  console.error(`compare-recording: ${msg}`);
  process.exit(1);
}

if (a.help || positionals.length !== 1) {
  console.log('usage: npm run hw:compare -- <recording.wav> --note A4 [--engine organ|piano|synth] [options]\n');
  process.exit(a.help ? 0 : 1);
}

const num = (s: string | undefined, what: string): number | undefined => {
  if (s === undefined) return undefined;
  const v = Number(s);
  if (!Number.isFinite(v)) fail(`${what} must be a number (got "${s}").`);
  return v;
};

try {
  const file = positionals[0];
  const rec = readRecording(new Uint8Array(readFileSync(file)));
  const sr = rec.sampleRate;
  const channel = a.channel as ChannelPick;
  if (!['mix', 'left', 'right', 'side'].includes(channel)) fail('--channel is mix, left, right or side.');
  const whole = pickChannel(rec, channel);
  console.log(`Recording: ${basename(file)}  ${sr} Hz, ${rec.channels.length === 1 ? 'mono' : 'stereo'}, ${(whole.length / sr).toFixed(2)} s${channel === 'mix' ? '' : `, ${channel} channel`}`);
  // --nth N: analyse only the N-th note of a take with several notes.
  const nth = num(a.nth, '--nth');
  const x = nth === undefined || a.sweep ? whole : nthNote(whole, sr, nth);
  if (nth !== undefined && !a.sweep) console.log(`Note ${nth} of the take, from ${((x.byteOffset - whole.byteOffset) / 4 / sr).toFixed(2)} s into the file`);

  if (a.sweep) {
    const vels = a.velocities ? a.velocities.split(',').map((v) => num(v, '--velocities')!) : SWEEP_VELOCITIES;
    const notes = analyzeSweep(x, sr, vels);
    console.log(`\nVelocity sweep: ${notes.length} notes found (expected ${vels.length})\n`);
    console.log(formatSweep(notes));
    if (notes.length !== vels.length) console.log('\nThe note count differs from the velocity list: check the take for missed or extra notes before trusting the velocity column.');
    if (a.json) writeFileSync(a.json, JSON.stringify({ recording: basename(file), sampleRate: sr, sweep: notes }, null, 2));
    process.exit(0);
  }

  if (!a.note) fail('say which key you played: --note A4 (or a MIDI number).');
  const key = parseNote(a.note);
  const hold = num(a.hold, '--hold')!;
  let win: MeasureOptions['window'];
  if (a.window) {
    const [s, e] = a.window.split(':');
    win = [num(s || '0', '--window start')!, e ? num(e, '--window end') : undefined];
  }

  let ref: Reference | undefined;
  let piano: PianoReference | undefined;
  /** The other signal for --timeline: OpenNord's render or the --vs take. */
  let refSig: Float32Array | undefined;
  let refLabel = 'OpenNord';
  let refMeasure: Measurement | undefined;
  const extra: string[] = [];
  const engine = a.engine;
  const programLayer = (kind: 'organ' | 'synth') => {
    if (!a.program) return undefined;
    const prog = parseNs4Program(new Uint8Array(readFileSync(a.program)));
    const layer = prog.layers?.find((l) => l.kind === kind && l.id === a.part!.toUpperCase());
    if (!layer) fail(`${basename(a.program)} has no ${kind} layer ${a.part}.`);
    return { prog, layer };
  };

  if (a.vs) {
    const other = readRecording(new Uint8Array(readFileSync(a.vs)));
    if (other.sampleRate !== sr) fail(`${basename(a.vs)} is at ${other.sampleRate} Hz and this take at ${sr} Hz: record both at the same rate.`);
    refLabel = basename(a.vs);
    const otherNth = num(a['vs-nth'], '--vs-nth');
    refSig = otherNth === undefined ? pickChannel(other, channel) : nthNote(pickChannel(other, channel), sr, otherNth);
    refMeasure = measure(refSig, sr, { window: win, modulation: a.mod, heldS: win ? undefined : hold });
  } else if (engine === 'organ') {
    const fromProgram = programLayer('organ');
    const params = fromProgram
      ? organParamsFromLayer(fromProgram.layer, fromProgram.prog.organFx)
      : organParamsFromFlags({ drawbars: a.drawbars, perc: a.perc, vib: a.vib, click: num(a.click, '--click'), model: a.model });
    ref = organReference(params, key, hold, hold + 0.5, sr);
  } else if (engine === 'piano') {
    if (!a.npno) fail('--engine piano needs --npno: your own copy of the piano you played.');
    const model = a['pitch-model'];
    if (model && !['A', 'B', 'C'].includes(model)) fail('--pitch-model is A, B or C.');
    ref = piano = pianoReference(new Uint8Array(readFileSync(a.npno)), {
      key, velocity: num(a.velocity, '--velocity'), layer: num(a.layer, '--layer'),
      holdS: hold, totalS: hold + 1, sampleRate: sr, pitchModel: model as 'A' | 'B' | 'C' | undefined,
    });
    if (piano.pitch.length) {
      extra.push('Pitch hypotheses for this key (the maintainers’ notes, the +27-cent question):');
      for (const h of piano.pitch) extra.push(`  ${h.id}  ${h.label.padEnd(22)} ${h.hz.toFixed(2)} Hz`);
    }
  } else if (engine === 'synth') {
    const fromProgram = programLayer('synth');
    if (!fromProgram) fail('--engine synth needs --program: the .ns4p you played, with --part A/B/C.');
    const params = previewParamsFromLayer(fromProgram.layer);
    if (!params) fail(`Synth layer ${a.part} uses an oscillator the preview can't render (only ANALOG Pure waves).`);
    ref = synthReference(params, key, hold, Math.min(hold + Math.min(params.ampEnv.release, 3.5) + 0.3, 8), sr);
  } else if (engine !== 'none') {
    fail('--engine is organ, piano, synth or none.');
  }

  const opts: MeasureOptions = { window: win ?? (ref ? [0, ref.channels[0].length / sr] : undefined), modulation: a.mod, heldS: win ? undefined : hold };
  const nord = measure(x, sr, opts);
  if (ref) {
    refMeasure = measureReference(ref, opts, channel);
    refSig = channel === 'mix' ? referenceMono(ref) : pickChannel(ref, channel);
  }

  if (nord.peakDb > -0.5) console.log('Warning: the take peaks at full scale and may be clipped. Lower the interface gain and record it again before trusting level, brightness or decay.');
  console.log(`Note: ${noteName(key)} (MIDI ${key}, ${noteToHz(key).toFixed(2)} Hz at A4 = 440)  · held ${hold} s  · starts at ${nord.onsetS.toFixed(3)} s  · noise floor ${nord.noiseDb.toFixed(0)} dBFS`);
  if (ref) for (const n of ref.notes) console.log(`${ref.label}: ${n}`);
  console.log('');
  const rows = compareRows(nord, refMeasure, noteToHz(key));
  console.log(formatRows(rows, 'Nord', refLabel));
  if (refMeasure && !a.vs) console.log('\n(Level deltas include your interface gain and the Nord\'s volume knob: compare them between takes, not as absolutes.)');
  if (extra.length) {
    console.log('');
    for (const l of extra) console.log(l);
    if (nord.f0 && piano) {
      const measured = nord.f0.hz;
      const off = piano.pitch.map((h) => ({ id: h.id, cents: centsBetween(measured, h.hz) }));
      const best = off.reduce((x, y) => (Math.abs(y.cents) < Math.abs(x.cents) ? y : x));
      const ties = off.filter((h) => Math.abs(h.cents - best.cents) < 3).map((h) => h.id);
      console.log(`  measured: ${measured.toFixed(2)} Hz → closest: ${ties.join(' = ')} (${best.cents >= 0 ? '+' : ''}${best.cents.toFixed(1)} cents)`);
      if (ties.includes('A') && ties.includes('C')) {
        console.log('  A and C differ only on a key that plays a recording at its own pitch (A4 on the test pianos; on a factory piano at most its top key).');
      } else if (ties.length > 1) {
        console.log(`  ${ties.join(' and ')} predict the same pitch on this key (the recorded note): a lower key of the zone tells them apart.`);
      }
    }
  }

  if (a.track) {
    console.log('\nTremolo / rotor rate over time (from the note start):');
    const t = modulationTrack(x.subarray(Math.round(nord.onsetS * sr)), sr);
    for (const r of t) console.log(`  ${r.atS.toFixed(2).padStart(6)} s  ${r.rateHz === undefined ? '—' : `${r.rateHz.toFixed(2)} Hz`}`);
  }
  if (a.timeline) {
    // Level and brightness every --step seconds (default 0.1) from the note start (a filter
    // sweep, a compressor recovering, a reverb tail), next to OpenNord's render when there is one.
    const step = num(a.step, '--step')!;
    if (!(step >= 0.005)) fail('--step is at least 0.005 s.');
    const from = (sig: Float32Array, rate: number, on: number) =>
      timeline(sig.subarray(on), rate, step, Math.min(0.05, 2 * step)).slice(0, 400);
    const n = from(x, sr, Math.round(nord.onsetS * sr));
    const r = refSig ? from(refSig, sr, findOnset(refSig, sr)) : [];
    const cell = (row?: TimelineRow) => {
      if (!row) return '';
      if (!Number.isFinite(row.rmsDb)) return 'silent'.padEnd(20);
      return `${row.rmsDb.toFixed(1).padStart(6)} dBFS ${(row.centroidHz ? `${row.centroidHz.toFixed(0)} Hz` : '—').padStart(8)}`;
    };
    console.log(`\nLevel and brightness every ${step} s (from the note start):`);
    console.log(`      time  ${'Nord'.padEnd(20)}${refSig ? `  ${refLabel}` : ''}`);
    n.forEach((row, i) => console.log(`  ${row.atS.toFixed(2).padStart(6)} s  ${cell(row)}${refSig ? `  ${cell(r[i])}` : ''}`.trimEnd()));
  }
  if (a['save-render']) {
    if (!ref) fail('--save-render needs --engine organ, piano or synth.');
    writeFileSync(a['save-render'], encodeWav(ref.channels.map((c) => c.map((v) => Math.max(-1, Math.min(1, v)))), sr));
    console.log(`\nOpenNord's render written to ${a['save-render']} (local only).`);
  }
  if (a.json) {
    writeFileSync(a.json, JSON.stringify({
      recording: basename(file), note: key, engine: a.vs ? `vs ${basename(a.vs)}` : engine, options: a,
      nord, reference: refMeasure, rows, notes: ref?.notes,
      piano: piano && { stroke: piano.stroke, pitch: piano.pitch },
    }, null, 2));
    console.log(`Numbers written to ${a.json}.`);
  }
} catch (e) {
  fail((e as Error).message);
}
