import { describe, it, expect } from 'vitest';
import { layerFloors, nsmpToNpno, pianoNameFrom, planPianoZones, resampleForPiano } from './nsmp-to-npno';
import { writeNsmpMulti } from './nsmp-write';
import { NSMP_SAMPLE_RATE } from './nsmp';
import { NSP_SAMPLE_RATE, decodeNspStroke, readNspDirectory } from './nsp-audio';
import { NSP_ROOT_OFFSET, readNsp, readNspZones } from './nsp';
import { checkNpnoAcceptance } from './nsp-check';
import { estimateF0 } from '../hwtest/analysis';

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const cents = (a: number, b: number) => 1200 * Math.log2(a / b);
const sine = (frames: number, f: number, rate: number, amp = 8000) =>
  Int32Array.from({ length: frames }, (_, n) => Math.round(amp * Math.sin((2 * Math.PI * f * n) / rate)));
const zone = (keyHigh: number, rootKey: number, globalID: number, velLow = 0, velTop = 127) => ({ keyHigh, rootKey, globalID, velLow, velTop });

describe('planPianoZones', () => {
  it('pitches a narrow zone to its top key, so no key has to play above its recording', () => {
    // A Nord piano can only play a recording at or below its own pitch.
    const plan = planPianoZones([zone(91, 90, 1), zone(94, 93, 2)]);
    expect(plan.map((z) => [z.lowNote, z.highNote, z.rootNote, z.sourceRoot])).toEqual([[0, 91, 91, 90], [92, 94, 94, 93]]);
  });

  it('splits the keys above a recording into groups of four', () => {
    const plan = planPianoZones([zone(94, 93, 1), zone(108, 96, 2)]);
    expect(plan.slice(1).map((z) => [z.lowNote, z.highNote, z.rootNote])).toEqual([
      [95, 96, 96], [97, 100, 100], [101, 104, 104], [105, 108, 108],
    ]);
  });

  it('keeps the keys below a recording in one zone', () => {
    const plan = planPianoZones([zone(60, 50, 1)]);
    expect(plan.map((z) => [z.lowNote, z.highNote, z.rootNote])).toEqual([[0, 52, 52], [53, 56, 56], [57, 60, 60]]);
  });

  it('turns zones that share their keys into touch layers, loudest first', () => {
    const plan = planPianoZones([zone(60, 60, 1, 0, 63), zone(60, 60, 2, 64, 127), zone(72, 72, 3)]);
    expect(plan[0].layers.map((l) => l.globalID)).toEqual([2, 1]);
    expect(plan[0].layers[0].floorDb).toBe(0);
    expect(plan[1].layers).toHaveLength(1);
  });
});

describe('layerFloors', () => {
  it('puts the switch between two layers at the velocity that divided them', () => {
    // The instrument switches halfway between floors; velocity 63/64 is 12 dB down on the touch law.
    const [loud, soft] = layerFloors([127, 63]);
    expect(loud).toBe(0);
    expect((loud + soft) / 2).toBeCloseTo(-40 * Math.log10(63.5 / 127), 1);
  });
  it('keeps every softer layer below the one before, within what a piano stores', () => {
    const floors = layerFloors([127, 126, 125, 2, 1]);
    for (let i = 1; i < floors.length; i++) expect(floors[i]).toBeGreaterThan(floors[i - 1]);
    expect(Math.max(...floors)).toBeLessThanOrEqual(51);
  });
});

describe('resampleForPiano', () => {
  it('brings a recording to the piano rate at the pitch asked for', () => {
    const src = [sine(35002, hz(60), NSMP_SAMPLE_RATE)]; // one second of C4
    const { pcm, loop } = resampleForPiano(src, NSMP_SAMPLE_RATE, 2, null); // to sound at D4
    expect(loop).toBeUndefined();
    expect(pcm[0].length).toBeCloseTo(NSP_SAMPLE_RATE / 2 ** (2 / 12), -2);
    expect(Math.abs(cents(estimateF0(pcm[0].subarray(2000, 20000), NSP_SAMPLE_RATE)!.hz, hz(62)))).toBeLessThan(1);
  });

  it('keeps a short loop in tune and its seam smooth', () => {
    // A loop of 10 whole cycles (531 frames of a 53.1-frame period) is 669.02 frames at the
    // piano rate: rounding it as it stands would detune it.
    const loopStart = 20000;
    const loopEnd = loopStart + 531;
    const src = [sine(loopEnd, NSMP_SAMPLE_RATE / 53.1, NSMP_SAMPLE_RATE)];
    const { pcm, loop } = resampleForPiano(src, NSMP_SAMPLE_RATE, 0, { loopStart, loopEnd });
    expect(loop).toBeDefined();
    expect(Number.isInteger(loop!.start) && Number.isInteger(loop!.length)).toBe(true);
    expect(loop!.start + loop!.length).toBe(pcm[0].length);
    // The loop holds a whole number of cycles of the source pitch, to a fraction of a cent.
    const cyclesPerFrame = (NSMP_SAMPLE_RATE / 53.1) / NSP_SAMPLE_RATE;
    const cycles = loop!.length * cyclesPerFrame;
    expect(Math.abs(cents(cycles, Math.round(cycles)))).toBeLessThan(0.3);
    // Playing through the seam makes no step bigger than the signal's own.
    const x = pcm[0];
    let step = 0;
    for (let n = loop!.start + 1; n < x.length; n++) step = Math.max(step, Math.abs(x[n] - x[n - 1]));
    expect(Math.abs(x[loop!.start] - x[x.length - 1])).toBeLessThanOrEqual(step * 1.2);
  });
});

describe('pianoNameFrom', () => {
  it('makes a name a Nord accepts', () => {
    expect(pianoNameFrom('DX7IIC Crystal BR.nsmp3')).toBe('DX7IIC Crystal BR');
    expect(pianoNameFrom('Ünïcode #1 with a very long name indeed.nsmp4').length).toBeLessThanOrEqual(23);
    expect(pianoNameFrom('###')).toBe('Piano');
  });
});

describe('nsmpToNpno', () => {
  const sample = writeNsmpMulti({
    name: 'Two Notes', codec: 3,
    zones: [
      { channels: [sine(30000, hz(48), NSMP_SAMPLE_RATE)], rootKey: 48, keyHigh: 59, velTop: 127 },
      { channels: [sine(30000, hz(72), NSMP_SAMPLE_RATE)], rootKey: 72, keyHigh: 73, velTop: 127 },
    ],
  });

  it('writes a piano a Nord should accept, with the sample\'s name', () => {
    const { bytes, fileName } = nsmpToNpno(sample, { name: 'Two Notes' });
    expect(fileName).toBe('Two_Notes_6.0.npno');
    expect(readNsp(bytes).name).toBe('Two Notes');
    const failed = checkNpnoAcceptance(bytes, { deep: true, fileName }).checks.filter((c) => !c.ok);
    expect(failed).toEqual([]);
  });

  it('plays every key at the pitch the sample played it', () => {
    const { bytes } = nsmpToNpno(sample, { name: 'Two Notes' });
    const dir = readNspDirectory(bytes)!;
    const zones = readNspZones(bytes);
    // On the instrument a key sounds (key − root − 4) semitones from its recording.
    for (const key of [40, 48, 55, 59, 60, 72, 73]) {
      const z = zones.findIndex((k) => k.lowNote <= key && key <= k.highNote);
      const pcm = decodeNspStroke(bytes, dir, dir.strokes.find((s) => s.zone === z)!);
      const recorded = estimateF0(pcm[0].subarray(1000, 15000), NSP_SAMPLE_RATE)!.hz;
      const semitones = key - zones[z].rootNote - NSP_ROOT_OFFSET;
      expect(semitones).toBeLessThanOrEqual(0); // never above the recording
      const source = key <= 59 ? 48 : 72; // the sample's own zone for this key
      expect(Math.abs(cents(recorded * 2 ** (semitones / 12), hz(source) * 2 ** ((key - source) / 12)))).toBeLessThan(2);
    }
  });

  it('refuses a file with no playable sample in it', () => {
    expect(() => nsmpToNpno(new Uint8Array(64), { name: 'x' })).toThrow(/sample/i);
  });

  it('fades a note that has no loop and is still sounding when its recording ends', () => {
    const { bytes, warnings } = nsmpToNpno(sample, { name: 'Two Notes' }); // steady sines: loud to the last frame
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/no sustain loop/i);
    const dir = readNspDirectory(bytes)!;
    const pcm = decodeNspStroke(bytes, dir, dir.strokes[0])[0];
    const peak = (from: number, to: number) => pcm.subarray(from, to).reduce((p, v) => Math.max(p, Math.abs(v)), 0);
    expect(peak(pcm.length - 200, pcm.length)).toBeLessThan(peak(0, 5000) * 0.05);
    expect(peak(pcm.length >> 1, (pcm.length >> 1) + 2000)).toBeGreaterThan(peak(0, 5000) * 0.9); // untouched before the fade
  });

  it('leaves a note alone when it has died away by the end of its recording', () => {
    const dying = Int32Array.from(sine(30000, hz(60), NSMP_SAMPLE_RATE), (v, n) => Math.round(v * Math.exp(-n / 2000)));
    const quiet = writeNsmpMulti({ name: 'Pluck', codec: 3, zones: [{ channels: [dying], rootKey: 60, keyHigh: 60, velTop: 127 }] });
    expect(nsmpToNpno(quiet, { name: 'Pluck' }).warnings).toEqual([]);
  });
});
