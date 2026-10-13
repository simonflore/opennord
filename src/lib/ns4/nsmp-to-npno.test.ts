import { describe, it, expect } from 'vitest';
import { layerFloors, nsmpToNpno, pianoNameFrom, planPianoZones, resampleForPiano, sampleToPiano } from './nsmp-to-npno';
import { writeNsmpMulti } from './nsmp-write';
import { NSMP_SAMPLE_RATE, readNsmp } from './nsmp';
import { gainDetuneView } from './sample-view';
import { peakAmplitude } from './nsmp-audio';
import { NSP_SAMPLE_RATE, decodeNspStroke, readNspDirectory } from './nsp-audio';
import { NSP_ROOT_OFFSET, readNsp, readNspZones } from './nsp';
import { checkNpnoAcceptance } from './nsp-check';
import { estimateF0 } from '../hwtest/analysis';

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const cents = (a: number, b: number) => 1200 * Math.log2(a / b);
const sine = (frames: number, f: number, rate: number, amp = 8000) =>
  Int32Array.from({ length: frames }, (_, n) => Math.round(amp * Math.sin((2 * Math.PI * f * n) / rate)));
const zone = (keyHigh: number, rootKey: number, globalID: number, velTop = 127) => ({ keyHigh, rootKey, globalID, velTop });

describe('planPianoZones', () => {
  it('pitches a narrow zone 3 semitones above its top key, so no key is more than one above the stored root', () => {
    // A Nord piano plays a recording at least 3 semitones below its 44.1 kHz pitch.
    const plan = planPianoZones([zone(91, 90, 1), zone(94, 93, 2)]);
    expect(plan.map((z) => [z.lowNote, z.highNote, z.rootNote, z.layers[0].sourceRoot])).toEqual([[0, 91, 94, 90], [92, 94, 97, 93]]);
  });

  it('splits the keys above a recording into groups of four', () => {
    const plan = planPianoZones([zone(94, 93, 1), zone(108, 96, 2)]);
    expect(plan.slice(1).map((z) => [z.lowNote, z.highNote, z.rootNote])).toEqual([
      [95, 96, 99], [97, 100, 103], [101, 104, 107], [105, 108, 111],
    ]);
  });

  it('keeps the keys below a recording in one zone', () => {
    const plan = planPianoZones([zone(60, 50, 1)]);
    expect(plan.map((z) => [z.lowNote, z.highNote, z.rootNote])).toEqual([[0, 52, 55], [53, 56, 59], [57, 60, 63]]);
  });

  it('turns zones that share their keys into touch layers, loudest first', () => {
    const plan = planPianoZones([zone(60, 60, 1, 63), zone(60, 60, 2, 127), zone(72, 72, 3)]);
    expect(plan[0].layers.map((l) => l.globalID)).toEqual([2, 1]);
    expect(plan[0].layers[0].floorDb).toBe(0);
    expect(plan[1].layers).toHaveLength(1);
  });

  it('pitches each layer from its own recorded note', () => {
    const plan = planPianoZones([zone(60, 60, 1, 63), zone(60, 58, 2, 127)]);
    expect(plan[0].layers.map((l) => [l.globalID, l.sourceRoot])).toEqual([[2, 58], [1, 60]]);
  });

  it('lets the layers split at different keys', () => {
    // Loud layer splits at 60 and 64, soft layer at 62 and 64.
    const plan = planPianoZones([zone(60, 60, 1), zone(64, 64, 2), zone(62, 62, 3, 63), zone(64, 64, 4, 63)]);
    expect(plan.map((z) => [z.lowNote, z.highNote, z.layers.map((l) => l.globalID)])).toEqual([
      [0, 60, [1, 3]], [61, 62, [2, 3]], [63, 64, [2, 4]],
    ]);
    expect(plan.every((z) => z.layers[1].floorDb > 0)).toBe(true);
  });

  it('takes one recording for a key and touch: an alternate take is left out', () => {
    const plan = planPianoZones([zone(60, 60, 1), zone(60, 60, 2)]);
    expect(plan[0].layers.map((l) => l.globalID)).toEqual([1]);
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

  it('keeps a short loop in tune', () => {
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
  });

  it('makes the loop from looping audio alone, whatever came before it', () => {
    // Silence, then a loop of 10 whole cycles: a loop starting right at the sample's loop start
    // would begin with frames the filter mixed with the silence, and step at every pass.
    const loopStart = 5000;
    const loopEnd = loopStart + 531;
    const src = [Int32Array.from(sine(loopEnd, NSMP_SAMPLE_RATE / 53.1, NSMP_SAMPLE_RATE), (v, n) => (n < loopStart ? 0 : v))];
    const { pcm, loop } = resampleForPiano(src, NSMP_SAMPLE_RATE, 0, { loopStart, loopEnd });
    const x = pcm[0];
    let step = 0;
    for (let n = loop!.start + 1; n < x.length; n++) step = Math.max(step, Math.abs(x[n] - x[n - 1]));
    expect(Math.abs(x[loop!.start] - x[x.length - 1])).toBeLessThanOrEqual(step * 1.05);
    // …at full level from its first frame, not ramping in from the silence.
    expect(peakAmplitude([x.subarray(loop!.start, loop!.start + 20)])).toBeGreaterThan(peakAmplitude([x.subarray(loop!.start)]) * 0.9);
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
      expect(semitones).toBeLessThanOrEqual(-3); // never more than one key above the stored root
      const source = key <= 59 ? 48 : 72; // the sample's own zone for this key
      expect(Math.abs(cents(recorded * 2 ** (semitones / 12), hz(source) * 2 ** ((key - source) / 12)))).toBeLessThan(2);
    }
  });

  it('refuses a file with no playable sample in it', () => {
    expect(() => nsmpToNpno(new Uint8Array(64), { name: 'x' })).toThrow(/sample/i);
  });

  it('fades a note that has no loop and is still sounding when its recording ends', () => {
    const { bytes, warnings } = nsmpToNpno(sample, { name: 'Two Notes' }); // steady sines: loud to the last frame
    expect(warnings).toEqual([expect.stringMatching(/no sustain loop/i), expect.stringMatching(/not been tried on a nord/i)]);
    const dir = readNspDirectory(bytes)!;
    const pcm = decodeNspStroke(bytes, dir, dir.strokes[0])[0];
    const peak = (from: number, to: number) => peakAmplitude([pcm.subarray(from, to)]);
    expect(peak(pcm.length - 200, pcm.length)).toBeLessThan(peak(0, 5000) * 0.05);
    expect(peak(pcm.length >> 1, (pcm.length >> 1) + 2000)).toBeGreaterThan(peak(0, 5000) * 0.9); // untouched before the fade
  });

  it('follows the sample\'s stored detune', () => {
    const tuned = sample.slice();
    const map = readNsmp(tuned).sections.find((x) => x.tag.endsWith('map'))!;
    tuned.set([0x00, 0x00, 0x40], map.payloadOffset + 3); // a global detune (s24): 64/256 of a semitone
    const detune = gainDetuneView(tuned)!.detuneCents;
    expect(detune).toBe(25);
    const pitchOf = (bytes: Uint8Array) => {
      const piano = nsmpToNpno(bytes, { name: 'Two Notes' }).bytes;
      const dir = readNspDirectory(piano)!;
      return estimateF0(decodeNspStroke(piano, dir, dir.strokes[0])[0].subarray(1000, 12000), NSP_SAMPLE_RATE)!.hz;
    };
    expect(cents(pitchOf(tuned), pitchOf(sample))).toBeCloseTo(detune, 0);
  });

  it('says what it had to leave out', () => {
    const layered = writeNsmpMulti({
      name: 'Takes', codec: 3,
      zones: [1, 2].map(() => ({ channels: [sine(8000, hz(60), NSMP_SAMPLE_RATE)], rootKey: 60, keyHigh: 60, velTop: 127 })),
    });
    expect(nsmpToNpno(layered, { name: 'Takes' }).warnings.join(' ')).toMatch(/1 alternate recording was left out/);
  });

  it('takes a looped sample all the way into a piano a Nord should accept', () => {
    // A recording with a short loop of 10 whole cycles at its end, fading 6 dB a second.
    const loopStart = 20000;
    const loopEnd = loopStart + 531;
    const { bytes, fileName, warnings, notes } = sampleToPiano({
      zones: [zone(60, 60, 1)],
      strokes: [{
        globalID: 1, channelCount: 1, sampleRate: NSMP_SAMPLE_RATE,
        channels: [sine(loopEnd, NSMP_SAMPLE_RATE / 53.1, NSMP_SAMPLE_RATE)],
        loop: { loopStart, loopEnd, loops: true, altStart: 0, decayDbPerSecond: 6 },
      }],
    }, { name: 'Looped' });
    expect(warnings.join(' ')).not.toMatch(/no sustain loop/i);
    expect(checkNpnoAcceptance(bytes, { deep: true, fileName }).checks.filter((c) => !c.ok)).toEqual([]);
    const dir = readNspDirectory(bytes)!;
    const stroke = dir.strokes[0];
    // The writer copies 4 frames across a seam that doesn't meet; this one already does.
    expect(notes.join(' ')).not.toMatch(/seam/i);
    expect(-20 * Math.log10(stroke.loopDecay!) * 22050).toBeCloseTo(6, 1); // the fade rate, as the piano stores it
    // The loop survives the piano codec bit for bit: its end still meets its start.
    const x = decodeNspStroke(bytes, dir, stroke)[0];
    const end = stroke.loop!.start + stroke.loop!.length;
    let step = 0;
    for (let n = stroke.loop!.start + 1; n < end; n++) step = Math.max(step, Math.abs(x[n] - x[n - 1]));
    expect(Math.abs(x[stroke.loop!.start] - x[end - 1])).toBeLessThanOrEqual(step * 1.05);
  });

  it('does not call a zone below the playable keys an alternate take', () => {
    const low = writeNsmpMulti({
      name: 'Low', codec: 3,
      zones: [
        { channels: [sine(8000, hz(24), NSMP_SAMPLE_RATE)], rootKey: 2, keyHigh: 3, velTop: 127 },
        { channels: [sine(8000, hz(60), NSMP_SAMPLE_RATE)], rootKey: 60, keyHigh: 60, velTop: 127 },
      ],
    });
    expect(nsmpToNpno(low, { name: 'Low' }).warnings.join(' ')).not.toMatch(/alternate/i);
  });

  it('leaves a note alone when it has died away by the end of its recording', () => {
    const dying = Int32Array.from(sine(30000, hz(60), NSMP_SAMPLE_RATE), (v, n) => Math.round(v * Math.exp(-n / 2000)));
    const quiet = writeNsmpMulti({ name: 'Pluck', codec: 3, zones: [{ channels: [dying], rootKey: 60, keyHigh: 60, velTop: 127 }] });
    expect(nsmpToNpno(quiet, { name: 'Pluck' }).warnings).toEqual([expect.stringMatching(/not been tried on a nord/i)]);
  });
});
