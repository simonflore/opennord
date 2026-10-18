import { describe, it, expect } from 'vitest';
import { parseSfz, sfzKey, sfzRegion } from './sfz';

const regions = (text: string, include?: (p: string) => string | undefined) => parseSfz(text, include).regions.map(sfzRegion);

describe('sfzKey', () => {
  it('reads numbers and note names, middle C being c4 = 60', () => {
    expect(sfzKey('60')).toBe(60);
    expect(sfzKey('c4')).toBe(60);
    expect(sfzKey('C#4')).toBe(61);
    expect(sfzKey('eb3')).toBe(51);
    expect(sfzKey('a0')).toBe(21);
    expect(sfzKey('c-1')).toBe(0);
    expect(sfzKey('x')).toBeUndefined();
  });
});

describe('parseSfz', () => {
  it('merges global → group → region, each header resetting the levels below it', () => {
    const r = regions(`
      <global> volume=-3
      <group> lovel=1 hivel=64
      <region> sample=soft_c4.wav key=60
      <region> sample=soft_d4.wav key=62 volume=-6
      <group> lovel=65
      <region> sample=loud_c4.wav key=60`);
    expect(r.map((x) => [x.sample, x.lovel, x.hivel, x.gainDb])).toEqual([
      ['soft_c4.wav', 1, 64, -3], ['soft_d4.wav', 1, 64, -6], ['loud_c4.wav', 65, 127, -3],
    ]);
  });

  it('keeps spaces in sample paths, takes a header mid-line, and drops comments', () => {
    const r = regions(`// a piano
      <control> default_path=Samples\\Grand Piano\\ /* the folder */
      <region> sample=C4 hard 1.wav lokey=59 hikey=61 pitch_keycenter=60 <region> sample=D4.wav key=62`);
    expect(r.map((x) => [x.sample, x.lokey, x.hikey, x.keycenter])).toEqual([
      ['Samples/Grand Piano/C4 hard 1.wav', 59, 61, 60], ['Samples/Grand Piano/D4.wav', 62, 62, 62],
    ]);
  });

  it('expands #define and #include', () => {
    const r = regions('#define $ROOT 60\n#include "map.sfzh"\n<region> sample=b.wav key=$ROOT', (p) => (p === 'map.sfzh' ? '<region> sample=a.wav key=48' : undefined));
    expect(r.map((x) => [x.sample, x.keycenter])).toEqual([['a.wav', 48], ['b.wav', 60]]);
    expect(parseSfz('#include "gone.sfzh"').missingIncludes).toEqual(['gone.sfzh']);
  });

  it('ignores opcodes under headers that aren\'t a region\'s', () => {
    expect(regions('<curve> v000=0 <region> sample=a.wav <effect> type=reverb')).toHaveLength(1);
  });
});

describe('sfzRegion', () => {
  it('fills in the SFZ defaults', () => {
    const [r] = regions('<region> sample=a.wav');
    expect(r).toMatchObject({ lokey: 0, hikey: 127, keycenter: 60, lovel: 1, hivel: 127, tuneCents: 0, gainDb: 0, offset: 0, loop: 'file', trigger: 'attack', keytrack: true });
  });

  it('adds tune and transpose, volume and amplitude, and applies the control offsets to keys', () => {
    const [r] = regions('<control> note_offset=-12 <region> sample=a.wav lokey=c5 hikey=c5 pitch_keycenter=c5 tune=-20 transpose=1 volume=-2 amplitude=50');
    expect(r.lokey).toBe(60);
    expect(r.keycenter).toBe(60);
    expect(r.tuneCents).toBe(80);
    expect(r.gainDb).toBeCloseTo(-2 - 6.02, 1);
  });

  it('reads loops: points from the SFZ, the WAV\'s own, or none', () => {
    const [a, b, c, d] = regions(`
      <region> sample=a.wav loop_mode=loop_continuous loop_start=100 loop_end=900
      <region> sample=b.wav loop_mode=loop_sustain
      <region> sample=c.wav loop_mode=one_shot loop_start=1 loop_end=2
      <region> sample=d.wav loop_start=1 loop_end=2`);
    // Points without a loop mode don't loop: the WAV's own loop decides, as players read it.
    expect([a.loop, a.loopStart, a.loopEnd, b.loop, c.loop, d.loop]).toEqual(['sfz', 100, 900, 'file', 'none', 'file']);
  });

  it('names what a Nord sample has no place for', () => {
    const [r] = regions('<region> sample=a.wav ampeg_release=0.5 cutoff=2000 fil_type=lpf_2p pan=-20');
    expect(r.dropped.sort()).toEqual(['filter', 'pan and width', 'volume envelope']);
  });
});
