import { describe, it, expect } from 'vitest';
import { addClip, addLayer, addTake, addZone, emptyProject, setKeys, setPiano, type NewTake, type SampleProject } from './model';
import { TARGETS } from './targets';
import { buildProject } from './build';
import type { ClipAudio } from './render';
import { checkNpnoAcceptance } from '../ns4/nsp-check';
import { decodeNspStroke, readNspDirectory } from '../ns4/nsp-audio';

const tone = (hz: number, amp: number, channels: 1 | 2) => {
  const ch = Float32Array.from({ length: 44100 }, (_, i) => amp * Math.exp(-i / 30000) * Math.sin((2 * Math.PI * hz * i) / 44100));
  return channels === 2 ? [ch, ch.slice()] : [ch];
};

/** One zone (recorded at C4) with a soft mono layer and a hard stereo layer. */
function pianoProject(): { p: SampleProject; audio: Map<string, ClipAudio> } {
  const audio = new Map<string, ClipAudio>();
  let p = emptyProject('Test Piano', 'npno');
  const clip = (label: string, ch: Float32Array[]) => {
    const c = addClip(p, { label, source: { kind: 'file', fileName: `${label}.wav` }, audioRef: label, sampleRate: 44100, channels: ch.length as 1 | 2, frames: ch[0].length });
    audio.set(c.clipId, { sampleRate: 44100, channels: ch });
    p = c.project;
    return c.clipId;
  };
  const take = (clipId: string): NewTake => ({ clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
  const hard = clip('hard', tone(261.63, 0.6, 2));
  const soft = clip('soft', tone(523.26, 0.15, 1));
  const z = addZone(p, 60, take(hard));
  p = setKeys(z.project, z.zoneId, 48, 64);
  const t = addTake(p, z.zoneId, take(soft));
  p = addLayer(t.project, z.zoneId, t.takeId, 14);
  return { p, audio };
}

describe('buildProject: pianos', () => {
  it('writes the piano type and the variant shown after the name', () => {
    const { p, audio } = pianoProject();
    const r = buildProject(setPiano(p, { type: 6, variant: 'Mk I' }), (id) => audio.get(id));
    expect(checkNpnoAcceptance(r.bytes, { deep: true }).ok).toBe(true);
    const text = new TextDecoder('latin1').decode(r.bytes);
    const cnsp = text.indexOf('CNSP'); // the piano header (nsp-write.ts: type at +0x18, name#variant at +0x1C)
    expect(r.bytes[cnsp + 0x18]).toBe(6);
    expect(text.slice(cnsp + 0x1c, cnsp + 0x1c + 15)).toBe('Test Piano#Mk I');
    expect(r.fileName).toMatch(/^Test_Piano_Mk_I_6\.\d\.npno$/); // two variants of one piano get two files
  });

  it('refuses a variant the Nord can’t show, in plain words', () => {
    const { p } = pianoProject();
    const messages = (variant: string) => TARGETS.npno.check(setPiano(p, { variant })).filter((i) => i.level === 'error').map((i) => i.message);
    expect(messages('Mk#1')).toEqual(['A variant can only use plain letters, digits and basic punctuation: no accents, symbols or "#".']);
    // 'Test Piano' (10) + a space + the variant must fit the file name's 23.
    expect(messages('x'.repeat(13))).toEqual(['The name and variant together have at most 22 characters: the piano’s file is named after both.']);
    expect(messages('x'.repeat(12))).toEqual([]);
  });

  it('writes a piano a Nord should accept, with both layers loudest first', () => {
    const { p, audio } = pianoProject();
    const r = buildProject(p, (id) => audio.get(id));
    expect(r.extension).toBe('.npno');
    expect(r.fileName).toMatch(/\.npno$/);
    expect(checkNpnoAcceptance(r.bytes, { deep: true }).ok).toBe(true);
    const dir = readNspDirectory(r.bytes)!;
    expect(dir.strokes.length).toBeGreaterThanOrEqual(2);
    // The zone's loudest layer comes first with floor 0; the soft layer's floor is ~14 dB
    // (0.2 dB steps) and it is the quiet mono clip (peak level well below the hard one).
    const [first, second] = dir.strokes;
    expect(first.zone).toBe(second.zone);
    expect(first.velocityFrom).toBe(0);
    expect(second.velocityFrom / 5).toBeGreaterThan(13.8);
    expect(second.velocityFrom / 5).toBeLessThan(14.2);
    // Strokes are peak-normalised on write (the level lives in the floor), so tell the layers
    // apart by pitch: the soft mono clip is an octave above the hard one (2x the zero crossings).
    const crossings = (st: typeof first) => {
      const ch = decodeNspStroke(r.bytes, dir, st)[0];
      let n = 0;
      for (let i = 1; i < ch.length; i++) if ((ch[i - 1] < 0) !== (ch[i] < 0)) n++;
      return n;
    };
    expect(crossings(second) / crossings(first)).toBeGreaterThan(1.9);
    expect(crossings(second) / crossings(first)).toBeLessThan(2.1);
  });

  it('makes the piano stereo when any layer is (a mono layer is doubled)', () => {
    const { p, audio } = pianoProject();
    const dir = readNspDirectory(buildProject(p, (id) => audio.get(id)).bytes)!;
    expect(dir.channels).toBe(2);
  });

  it('says it has not been tried on a Nord', () => {
    const { p, audio } = pianoProject();
    expect(buildProject(p, (id) => audio.get(id)).warnings.join(' ')).toMatch(/not been tried on a Nord/);
  });

  it('refuses zones with different numbers of layers', () => {
    const { p, audio } = pianoProject();
    const clipId = p.zones[0].takes[0].clipId;
    const extra = addZone(p, 72, { clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
    expect(() => buildProject(setKeys(extra.project, extra.zoneId, 65, 76), (id) => audio.get(id))).toThrow(/same number of layers/);
  });

  it('refuses a name a piano cannot hold', () => {
    const { p, audio } = pianoProject();
    expect(() => buildProject({ ...p, name: 'A name far too long for any piano' }, (id) => audio.get(id))).toThrow(/name/);
  });
});

/** Two single-layer looped zones (C4 and C5) with the given loop decays. */
function loopedProject(decays: [number | null, number | null]) {
  const audio = new Map<string, ClipAudio>();
  let p = emptyProject('Loops', 'npno');
  const c = addClip(p, { label: 'l', source: { kind: 'file', fileName: 'l.wav' }, audioRef: 'l', sampleRate: 44100, channels: 1, frames: 44100 });
  p = c.project;
  audio.set(c.clipId, { sampleRate: 44100, channels: tone(261.63, 0.5, 1) });
  const take = (d: number | null): NewTake => ({ clipId: c.clipId, start: 0, end: 44100, loop: { start: 20000 }, loopDecaySeconds: d, gainDb: 0, tuneCents: 0 });
  const a = addZone(p, 60, take(decays[0]));
  p = setKeys(a.project, a.zoneId, 48, 64);
  const b = addZone(p, 72, take(decays[1]));
  p = setKeys(b.project, b.zoneId, 65, 76);
  return { p, audio };
}

describe('buildProject: piano loops', () => {
  it('an all-hold project writes holding loops, not piano fades', () => {
    const { p, audio } = loopedProject([null, null]);
    const r = buildProject(p, (id) => audio.get(id));
    const dir = readNspDirectory(r.bytes)!;
    const looped = dir.strokes.filter((s) => s.loop);
    expect(looped.length).toBeGreaterThan(0);
    // A hold is a per-update factor of 1 (Q23 0x800000): the level never falls inside the loop.
    for (const s of looped) expect(s.loopDecay).toBeCloseTo(1, 6);
    expect(r.warnings.join(' ')).not.toMatch(/fade like a piano/);
  });

  it('mixed holding and fading loops say they fade like a piano', () => {
    const { p, audio } = loopedProject([null, 20]);
    const r = buildProject(p, (id) => audio.get(id));
    const w = r.warnings.join(' ');
    expect(w).toMatch(/Zones C4 hold their loops here, but in a piano they fade like a piano's/);
    expect(w).not.toMatch(/Pick another fade/);
  });
});
