import { describe, it, expect, vi } from 'vitest';
import { resolveZone, playbackRate, detuneRatio, unisonVoices, unisonDetuneCents, repeatSource, velocityGain, envGainAt, scheduleAttackDecay, createSampler, loopSeconds, loopDecay, loopDecayGainAt, MAX_VOICES, type AmpEnvelope } from './sampleEngine';
import type { SampleUnison } from '../../lib/ns4/nsmp';
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';

// Minimal Web-Audio fake so createSampler runs headless; records every source
// node it creates so we can assert whether audition enabled looping.
type FakeParam = { value: number; calls: unknown[][]; setValueAtTime: (...a: number[]) => void; setTargetAtTime: (...a: number[]) => void; linearRampToValueAtTime: () => void; cancelScheduledValues: () => void };
type FakeSource = { buffer: unknown; loop: boolean; loopStart: number; loopEnd: number; playbackRate: FakeParam; onended: (() => void) | null; connect: (n: unknown) => unknown; start: () => void; stop: () => void };
const audioMock = vi.hoisted(() => {
  const created: FakeSource[] = [];
  const gains: FakeParam[] = [];
  const param = (): FakeParam => {
    const calls: unknown[][] = [];
    return { value: 0, calls, setValueAtTime: (...a) => { calls.push(['set', ...a]); }, setTargetAtTime: (...a) => { calls.push(['target', ...a]); }, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} };
  };
  const ctx = {
    currentTime: 0,
    destination: {},
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (i: number) => data[i] };
    },
    createBufferSource: (): FakeSource => {
      const s: FakeSource = { buffer: null, loop: false, loopStart: 0, loopEnd: 0, playbackRate: param(), onended: null, connect: (n) => n, start: () => {}, stop: () => {} };
      created.push(s);
      return s;
    },
    createGain: () => { const gain = param(); gains.push(gain); return { gain, connect: (n: unknown) => n }; },
    createChannelSplitter: () => ({ connect: (n: unknown) => n }),
    createChannelMerger: () => ({ connect: (n: unknown) => n }),
  };
  return { created, gains, ctx };
});
vi.mock('./audioPlayer', () => ({ SAMPLE_RATE: 44100, getSharedCtx: () => audioMock.ctx }));

const pz = (globalID: number, keyLow: number, keyHigh: number, velLow = 0, velTop = 127): PlayableZone =>
  ({ globalID, rootKey: 60, keyLow, keyHigh, velLow, velTop });

// The voicing block of a factory 4.1 sample: its own values, detune 0 / 15 / 40, width 70.
const unison = (over: Partial<SampleUnison> = {}): SampleUnison => ({
  mode: 1, topKey: 108, detuneMax: 0, detuneMax2: 15, detuneMax3: 40, sameDetuneMin: 0,
  panMax: 70, panMax2: 70, panMax3: 70,
  numVoice1: 2, numVoice2: 2, numVoice3: 3, numVoiceSame: 2,
  gainDb1: -6, gainDb2: -6, gainDb3: -6, gainDbSame: -6,
  randomStrokeMode: 0, blockRandomSustPed: 0, custom: true, ...over,
});

describe('resolveZone', () => {
  const zones = [pz(1, 21, 59), pz(2, 60, 108)];
  it('returns the single zone covering a key (velocity ignored when unambiguous)', () => {
    expect(resolveZone(zones, 40, 1)?.globalID).toBe(1);
    expect(resolveZone(zones, 72, 127)?.globalID).toBe(2);
  });
  it('returns null when no zone covers the key', () => {
    expect(resolveZone([pz(1, 60, 72)], 40, 100)).toBeNull();
  });
  it('disambiguates overlapping zones by velocity, else falls back to the first', () => {
    const layered = [pz(1, 60, 72, 0, 63), pz(2, 60, 72, 64, 127)];
    expect(resolveZone(layered, 65, 100)?.globalID).toBe(2);
    expect(resolveZone(layered, 65, 30)?.globalID).toBe(1);
  });
});

describe('playbackRate', () => {
  it('is 1 at the root, doubles an octave up, halves an octave down', () => {
    expect(playbackRate(60, 60)).toBe(1);
    expect(playbackRate(60, 72)).toBeCloseTo(2, 6);
    expect(playbackRate(60, 48)).toBeCloseTo(0.5, 6);
  });
});

describe('detuneRatio', () => {
  it('is 1 at 0 cents, doubles at +1200, halves at −1200, one semitone at 100', () => {
    expect(detuneRatio(0)).toBe(1);
    expect(detuneRatio(1200)).toBeCloseTo(2, 6);
    expect(detuneRatio(-1200)).toBeCloseTo(0.5, 6);
    expect(detuneRatio(100)).toBeCloseTo(2 ** (1 / 12), 6);
  });
});

describe('unisonDetuneCents', () => {
  it('uses the sample\'s own value per setting: raw·25/65536 of a semitone', () => {
    expect(unisonDetuneCents(1, 60, unison())).toBe(0);
    expect(unisonDetuneCents(2, 60, unison())).toBeCloseTo(0.572, 3);
    expect(unisonDetuneCents(3, 60, unison())).toBeCloseTo(1.526, 3);
  });
  it('falls back to the instrument\'s law: 0.78 cents a step at middle C, wider in the bass, capped', () => {
    const builtIn = unison({ mode: 0, custom: false });
    expect(unisonDetuneCents(1, 60, builtIn)).toBeCloseTo(0.781, 3);
    expect(unisonDetuneCents(2, 60, builtIn)).toBeCloseTo(1.563, 3);
    expect(unisonDetuneCents(2, 40, builtIn)).toBeCloseTo(3.125, 3); // 20 keys down: twice as wide
    expect(unisonDetuneCents(3, 21, builtIn)).toBeCloseTo(3.906, 3); // the cap
    expect(unisonDetuneCents(2, 60, null)).toBeCloseTo(1.563, 3);    // no block at all (codec 3)
  });
});

describe('unisonVoices', () => {
  const own = { sourceKey: 60, detuneCents: 0, gainL: 1, gainR: 1 };
  it('is the key\'s own recording, centred, when unison is off', () => {
    expect(unisonVoices(0, 60, unison(), [57, 63])).toEqual([own]);
  });
  it('pairs the key with its first neighbour, detuned apart and mirrored in the stereo field', () => {
    const [a, b] = unisonVoices(2, 60, unison(), [57, 63]);
    expect([a.sourceKey, b.sourceKey]).toEqual([60, 57]);
    expect(a.detuneCents).toBeCloseTo(0.572, 3);
    expect(b.detuneCents).toBeCloseTo(-0.572, 3);
    expect([a.gainL, a.gainR]).toEqual([b.gainR, b.gainL]);
    expect(a.gainL).toBeCloseTo(Math.sqrt(0.85), 6); // width 70 → 85 % / 15 %
    expect(a.gainR).toBeCloseTo(Math.sqrt(0.15), 6);
  });
  it('adds a centre voice at Unison 3 when the key has two neighbours', () => {
    const v = unisonVoices(3, 60, unison(), [57, 63]);
    expect(v.map((x) => x.sourceKey)).toEqual([60, 57, 63]);
    expect(v[0]).toMatchObject({ detuneCents: 0 });
    expect(v[0].gainL).toBeCloseTo(0.501, 3); // the −6 dB tier gain
    expect(v[0].gainL).toBe(v[0].gainR);
    expect(v[1].detuneCents).toBeCloseTo(-v[2].detuneCents, 9);
  });
  it('stays at two voices at Unison 3 with fewer than two neighbours', () => {
    expect(unisonVoices(3, 60, unison(), [57]).map((x) => x.sourceKey)).toEqual([60, 57]);
  });
  it('doubles the key\'s own recording above the top key or without neighbours', () => {
    expect(unisonVoices(2, 110, unison(), [107, 104]).map((x) => x.sourceKey)).toEqual([110, 110]);
    expect(unisonVoices(2, 60, unison(), []).map((x) => x.sourceKey)).toEqual([60, 60]);
  });
  it('uses the same-recording detune at Unison 1 when both voices share a recording', () => {
    const [a] = unisonVoices(1, 60, unison({ sameDetuneMin: 40 }), []);
    expect(a.detuneCents).toBeCloseTo(1.526, 3);
  });
});

describe('repeatSource', () => {
  const run = (alts: number[], n: number) => Array.from({ length: n }, (_, i) => repeatSource(i, 60, alts));
  it('always plays the key\'s own recording without alternates', () => {
    expect(run([], 3)).toEqual([60, 60, 60]);
  });
  it('alternates strictly with a single alternate', () => {
    expect(run([57], 4)).toEqual([60, 57, 60, 57]);
  });
  it('cycles through own and both alternates, never the same recording twice in a row', () => {
    const seq = run([57, 63], 24);
    expect(new Set(seq)).toEqual(new Set([60, 57, 63]));
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });
});

describe('velocityGain', () => {
  it('normalizes 0..127 into 0..1, clamped', () => {
    expect(velocityGain(127)).toBeCloseTo(1, 6);
    expect(velocityGain(0)).toBe(0);
    expect(velocityGain(200)).toBe(1);
  });
});

describe('envGainAt', () => {
  const env: AmpEnvelope = { attack: 1, decay: 1, sustain: 0.5, release: 2 };
  it('ramps up over attack, decays to sustain, then holds (key held)', () => {
    expect(envGainAt(env, 1, 0, null)).toBeCloseTo(0, 5);    // note-on
    expect(envGainAt(env, 1, 0.5, null)).toBeCloseTo(0.5, 5); // mid-attack
    expect(envGainAt(env, 1, 1, null)).toBeCloseTo(1, 5);     // peak
    expect(envGainAt(env, 1, 1.5, null)).toBeCloseTo(0.75, 5); // mid-decay (1 → 0.5)
    expect(envGainAt(env, 1, 2, null)).toBeCloseTo(0.5, 5);   // at sustain
    expect(envGainAt(env, 1, 9, null)).toBeCloseTo(0.5, 5);   // holds at sustain
  });
  it('releases linearly from the level at key-up to zero', () => {
    expect(envGainAt(env, 1, 3, 2)).toBeCloseTo(0.25, 5); // released at 2 (lvl .5), 1s into 2s release
    expect(envGainAt(env, 1, 4, 2)).toBeCloseTo(0, 5);    // release complete
    expect(envGainAt(env, 1, 9, 2)).toBeCloseTo(0, 5);    // stays silent
  });
  it('scales the whole envelope by the velocity peak', () => {
    expect(envGainAt(env, 0.5, 1, null)).toBeCloseTo(0.5, 5);  // peak·1
    expect(envGainAt(env, 0.5, 2, null)).toBeCloseTo(0.25, 5); // peak·sustain
  });
  it('handles instant attack and zero decay without dividing by zero', () => {
    const instant: AmpEnvelope = { attack: 0, decay: 0, sustain: 0.8, release: 0.1 };
    expect(envGainAt(instant, 1, 0, null)).toBeCloseTo(0.8, 5); // jumps straight to sustain
  });
});

describe('scheduleAttackDecay', () => {
  function recorder() {
    const events: { kind: 'set' | 'ramp'; value: number; time: number }[] = [];
    return {
      events,
      g: {
        setValueAtTime: (value: number, time: number) => void events.push({ kind: 'set', value, time }),
        linearRampToValueAtTime: (value: number, time: number) => void events.push({ kind: 'ramp', value, time }),
      },
    };
  }

  it('starts AT peak when attack is 0, then decays down to sustain', () => {
    // The bug this pins: zero attack scheduled gain 0 at note-on and the decay
    // ramped UP from silence — the opposite of an instant punch.
    const env: AmpEnvelope = { attack: 0, decay: 0.5, sustain: 0.5, release: 0.1 };
    const { events, g } = recorder();
    scheduleAttackDecay(g, env, 0.8, 10);
    expect(events[0]).toEqual({ kind: 'set', value: 0.8, time: 10 }); // = envGainAt(env, 0.8, 0, null)
    expect(events[0].value).toBeCloseTo(envGainAt(env, 0.8, 0, null), 6);
    expect(events.at(-1)).toEqual({ kind: 'ramp', value: 0.4, time: 10.5 });
  });

  it('ramps 0 → peak over the attack, then decays to sustain', () => {
    const env: AmpEnvelope = { attack: 0.2, decay: 0.5, sustain: 0.5, release: 0.1 };
    const { events, g } = recorder();
    scheduleAttackDecay(g, env, 1, 10);
    expect(events).toEqual([
      { kind: 'set', value: 0, time: 10 },
      { kind: 'ramp', value: 1, time: 10.2 },
      { kind: 'ramp', value: 0.5, time: 10.7 },
    ]);
  });

  it('steps to sustain at attack end when there is no decay', () => {
    const env: AmpEnvelope = { attack: 0.2, decay: 0, sustain: 0.8, release: 0.1 };
    const { events, g } = recorder();
    scheduleAttackDecay(g, env, 1, 10);
    expect(events.at(-1)).toEqual({ kind: 'set', value: 0.8, time: 10.2 });
  });
});

describe('loopSeconds', () => {
  it('converts a looping stroke region to seconds', () => {
    const s = { sampleRate: 44100, loop: { loopStart: 44100, loopEnd: 88200, loops: true } } as DecodedStrokeResult;
    expect(loopSeconds(s)).toEqual({ loop: true, start: 1, end: 2 });
  });
  it('reports no loop when the region is absent or non-looping', () => {
    expect(loopSeconds({ loop: null } as DecodedStrokeResult).loop).toBe(false);
    expect(loopSeconds({ loop: { loopStart: 0, loopEnd: 1, loops: false } } as DecodedStrokeResult).loop).toBe(false);
  });
});

/** dB lost per second by a level that falls 1/e per second. */
const NEPER_DB = 20 / Math.LN10;

// A stroke that loops its last `loopFrames` frames, losing `decayDbPerSecond` inside the loop.
const loopingStroke = (globalID: number, decayDbPerSecond: number, loopStart = 22050, frames = 44100): DecodedStrokeResult =>
  ({ globalID, sampleRate: 44100, channels: [new Float32Array(frames).fill(0.5)], loop: { loopStart, loopEnd: frames, loops: true, altStart: 0, decayDbPerSecond } }) as unknown as DecodedStrokeResult;

describe('loopDecay', () => {
  it('starts when playback reaches the loop, sooner the higher the note is pitched', () => {
    expect(loopDecay(loopingStroke(1, NEPER_DB), 1)).toEqual({ at: 0.5, timeConstant: 1 });
    expect(loopDecay(loopingStroke(1, NEPER_DB), 2)?.at).toBeCloseTo(0.25, 9);
  });
  it('falls at the stored rate whatever the pitch (the decay runs on the clock, not the sample)', () => {
    const d = loopDecay(loopingStroke(1, 20), 2)!;
    expect(20 * Math.log10(loopDecayGainAt(d, d.at + 1))).toBeCloseTo(-20, 6);
    expect(loopDecayGainAt(d, d.at - 0.1)).toBe(1); // untouched before the loop
  });
  it('is absent for a loop that holds its level, a one-shot and an unreadable region', () => {
    expect(loopDecay(loopingStroke(1, 0), 1)).toBeNull();
    expect(loopDecay({ sampleRate: 44100, loop: { loopStart: 10, loopEnd: 10, loops: false, altStart: 0, decayDbPerSecond: 9 } } as DecodedStrokeResult, 1)).toBeNull();
    expect(loopDecay({ loop: null } as DecodedStrokeResult, 1)).toBeNull();
  });
});

describe('createSampler audition playback', () => {
  const zone = { globalID: 7, rootKey: 60, keyLow: 21, keyHigh: 108, velLow: 0, velTop: 127 };
  const play = (stroke: DecodedStrokeResult, midi = 60): FakeSource => {
    audioMock.created.length = 0;
    audioMock.gains.length = 0;
    createSampler([zone], new Map([[7, stroke]])).noteOn(midi, 100);
    expect(audioMock.created).toHaveLength(1);
    return audioMock.created[0];
  };
  const decayCalls = () => audioMock.gains.flatMap((g) => g.calls).filter((c) => c[0] === 'target');

  it('loops every looped stroke over its stored region, and leaves the audio as decoded', () => {
    const stroke = loopingStroke(7, 0);
    const src = play(stroke);
    expect(src.loop).toBe(true);
    expect(src.loopStart).toBeCloseTo(0.5, 6);
    expect(src.loopEnd).toBeCloseTo(1, 6);
    expect(decayCalls()).toHaveLength(0); // a loop that holds its level has no decay
  });

  it('decays a looped stroke from the moment playback enters the loop (the CP80 case)', () => {
    play(loopingStroke(7, NEPER_DB), 72); // an octave up: the loop is reached in half the time
    expect(decayCalls()).toEqual([['target', 0, 0.25, 1]]);
  });

  it('plays a one-shot straight through', () => {
    const src = play({ globalID: 7, sampleRate: 44100, channels: [new Float32Array(1000).fill(0.5)], loop: { loopStart: 1000, loopEnd: 1000, loops: false, altStart: 0, decayDbPerSecond: 0 } } as unknown as DecodedStrokeResult);
    expect(src.loop).toBe(false);
  });

  it('applies the sample global detune to the playback rate', () => {
    audioMock.created.length = 0;
    createSampler([zone], new Map([[7, loopingStroke(7, 0)]]), undefined, { detuneCents: 1200 })
      .noteOn(60, 100); // root note (rate 1) + one octave of detune → 2
    expect(audioMock.created[0].playbackRate.value).toBeCloseTo(2, 6);
  });

  // Three zones a minor third apart, each with its own recording.
  const zones3 = [57, 60, 63].map((root, i) => ({ globalID: i + 1, rootKey: root, keyLow: root - 1, keyHigh: root + 1, velLow: 0, velTop: 127 }));
  // Each recording gets its own length, so a source's buffer tells which one it plays.
  const strokes3 = new Map([1, 2, 3].map((id) => [id, loopingStroke(id, 0, 22050, 44100 + id)] as const));
  const alternates = Array.from({ length: 128 }, (_, k) => (k === 60 ? { unison: [57, 63], random: [57, 63] } : { unison: [], random: [] }));
  const sources = () => audioMock.created.map((x) => (x.buffer as { length: number }).length - 44100);

  it('plays a single source when unison is off, one per voice when engaged', () => {
    audioMock.created.length = 0;
    createSampler(zones3, strokes3, undefined, { unison: unison(), alternates }).noteOn(60, 100);
    expect(audioMock.created).toHaveLength(1);

    audioMock.created.length = 0;
    createSampler(zones3, strokes3, undefined, { unison: unison(), unisonLevel: 3, alternates }).noteOn(60, 100);
    expect(audioMock.created).toHaveLength(3);
  });

  it('plays the neighbours\' recordings in a unison stack, repitched to the played key', () => {
    audioMock.created.length = 0;
    createSampler(zones3, strokes3, undefined, { unison: unison({ detuneMax3: 0 }), unisonLevel: 3, alternates }).noteOn(60, 100);
    expect(sources()).toEqual([2, 1, 3]); // own, then the recordings rooted at 57 and 63
    const rates = audioMock.created.map((x) => x.playbackRate.value);
    expect(rates[0]).toBeCloseTo(1, 9);
    expect(rates[1]).toBeCloseTo(2 ** (3 / 12), 9);  // the lower recording, pitched up to the key
    expect(rates[2]).toBeCloseTo(2 ** (-3 / 12), 9); // the upper one, pitched down
  });

  it('steps repeated notes through the neighbouring recordings when the sample asks for it', () => {
    const s = createSampler(zones3, strokes3, undefined, { unison: unison({ randomStrokeMode: 3 }), alternates });
    audioMock.created.length = 0;
    for (let i = 0; i < 4; i++) { s.noteOn(60, 100); s.noteOff(60); }
    const seq = sources();
    expect(new Set(seq).size).toBe(3);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
    for (const x of audioMock.created) expect(x.playbackRate.value).not.toBe(0);

    const plain = createSampler(zones3, strokes3, undefined, { unison: unison(), alternates });
    audioMock.created.length = 0;
    plain.noteOn(60, 100); plain.noteOff(60); plain.noteOn(60, 100);
    expect(sources()).toEqual([2, 2]); // no flag: every repeat is the key's own recording
  });

  it('plays at most the DSP\'s 56 voices: a further note takes the oldest one', () => {
    const wide = { ...zone, keyLow: 0, keyHigh: 127 };
    const s = createSampler([wide], new Map([[7, loopingStroke(7, 0)]]));
    for (let k = 0; k < MAX_VOICES; k++) s.noteOn(20 + k, 100);
    expect(s.sounding().size).toBe(MAX_VOICES);
    s.noteOn(100, 100);
    expect(s.sounding().size).toBe(MAX_VOICES);
    expect(s.sounding().has(20)).toBe(false); // the oldest gave way
    expect(s.sounding().has(100)).toBe(true);
  });
});
