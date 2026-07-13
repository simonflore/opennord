import { describe, it, expect, vi } from 'vitest';
import { resolveZone, playbackRate, detuneRatio, unisonVoices, velocityGain, envGainAt, scheduleAttackDecay, createSampler, loopSeconds, loopXfadeLen, crossfadeLoop, loopWindowDecayDb, sampleShouldLoop, type AmpEnvelope } from './sampleEngine';
import type { SampleUnison } from '../../lib/ns4/nsmp';
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';

// Minimal Web-Audio fake so createSampler runs headless; records every source
// node it creates so we can assert whether audition enabled looping.
type FakeParam = { value: number; setValueAtTime: () => void; linearRampToValueAtTime: () => void; cancelScheduledValues: () => void };
type FakeSource = { buffer: unknown; loop: boolean; loopStart: number; loopEnd: number; playbackRate: FakeParam; onended: (() => void) | null; connect: (n: unknown) => unknown; start: () => void; stop: () => void };
const audioMock = vi.hoisted(() => {
  const created: FakeSource[] = [];
  const param = (): FakeParam => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} });
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
    createGain: () => ({ gain: param(), connect: (n: unknown) => n }),
    createStereoPanner: () => ({ pan: param(), connect: (n: unknown) => n }),
  };
  return { created, ctx };
});
vi.mock('./audioPlayer', () => ({ SAMPLE_RATE: 44100, getSharedCtx: () => audioMock.ctx }));

const pz = (globalID: number, keyLow: number, keyHigh: number, velLow = 0, velTop = 127): PlayableZone =>
  ({ globalID, rootKey: 60, keyLow, keyHigh, velLow, velTop });

const unison = (over: Partial<SampleUnison> = {}): SampleUnison => ({
  mode: 1, topKey: 108, detuneMax: 0, sameDetuneMin: 0, panMax: 0,
  detuneMax2: 0, panMax2: 0, detuneMax3: 0, panMax3: 0,
  numVoice1: 2, numVoice2: 2, numVoice3: 2, numVoiceSame: 2,
  gainDb1: 0, gainDb2: 0, gainDb3: 0, gainDbSame: 0,
  randomStrokeMode: 0, blockRandomSustPed: 0, active: true, ...over,
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

describe('unisonVoices', () => {
  it('returns a single centered voice when unison is off', () => {
    expect(unisonVoices(null)).toEqual([{ detuneCents: 0, pan: 0, gain: 1 }]);
    expect(unisonVoices(unison({ active: false }))).toEqual([{ detuneCents: 0, pan: 0, gain: 1 }]);
  });
  it('stacks n symmetric voices, panned across the decoded width, with 1/√n gain', () => {
    const v = unisonVoices(unison({ numVoiceSame: 2, panMax3: 100 }));
    expect(v).toHaveLength(2);
    expect(v[0].pan).toBeCloseTo(-1, 6);
    expect(v[1].pan).toBeCloseTo(1, 6);
    expect(v[0].detuneCents).toBeCloseTo(-v[1].detuneCents, 6); // symmetric detune
    expect(v[0].gain).toBeCloseTo(1 / Math.SQRT2, 6);
  });
  it('clamps the voice count to 2..4', () => {
    expect(unisonVoices(unison({ numVoiceSame: 9 }))).toHaveLength(4);
    expect(unisonVoices(unison({ numVoiceSame: 0 }))).toHaveLength(2);
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
    const s = { loop: { loopStart: 44100, loopEnd: 88200, loops: true } } as DecodedStrokeResult;
    expect(loopSeconds(s)).toEqual({ loop: true, start: 1, end: 2 });
  });
  it('reports no loop when the region is absent or non-looping', () => {
    expect(loopSeconds({ loop: null } as DecodedStrokeResult).loop).toBe(false);
    expect(loopSeconds({ loop: { loopStart: 0, loopEnd: 1, loops: false } } as DecodedStrokeResult).loop).toBe(false);
  });
});

describe('loopXfadeLen', () => {
  it('caps at ~40ms, a quarter of the loop window, and the pre-loop headroom', () => {
    expect(loopXfadeLen(44100, 44100 + 44100)).toBe(Math.floor(0.04 * 44100)); // 40ms cap
    expect(loopXfadeLen(44100, 44100 + 400)).toBe(100);                        // quarter-window
    expect(loopXfadeLen(50, 50 + 44100)).toBe(50);                             // headroom
  });
});

describe('crossfadeLoop', () => {
  it('blends the loop tail toward the pre-loop audio, seamless at the wrap', () => {
    const ch = new Float32Array(100);
    const loopStart = 40, loopEnd = 80, xf = 10;
    ch.fill(1, loopStart - xf, loopStart); // pre-loop [30,40) = 1
    ch.fill(2, loopEnd - xf, loopEnd);     // tail     [70,80) = 2
    crossfadeLoop(ch, loopStart, loopEnd, xf);
    expect(ch[loopEnd - xf]).toBeCloseTo(2, 5); // window start: untouched tail
    expect(ch[loopEnd - 1]).toBeCloseTo(1, 5);  // window end: equals pre-loop → smooth wrap
    expect(ch[loopStart - 1]).toBe(1);          // pre-loop region left intact
  });
  it('is a no-op without enough headroom or window', () => {
    const ch = new Float32Array([0, 1, 2, 3, 4, 5]);
    const copy = Float32Array.from(ch);
    crossfadeLoop(ch, 1, 5, 10);
    expect(ch).toEqual(copy);
  });
});

// Build a stroke whose loop window has a given start→end amplitude ratio.
const strokeWithDecay = (globalID: number, startAmp: number, endAmp: number): DecodedStrokeResult => {
  const ch = new Float32Array(1000);
  const loopStart = 100, loopEnd = 400;
  for (let i = loopStart; i < loopEnd; i++) {
    const t = (i - loopStart) / (loopEnd - loopStart);
    ch[i] = startAmp * (1 - t) + endAmp * t;
  }
  return { globalID, channels: [ch], loop: { loopStart, loopEnd, loops: true } } as unknown as DecodedStrokeResult;
};

describe('loopWindowDecayDb / sampleShouldLoop', () => {
  it('is ~0 dB for a steady loop and positive for a decaying one', () => {
    expect(loopWindowDecayDb(strokeWithDecay(1, 0.5, 0.5)) ?? NaN).toBeCloseTo(0, 1);
    expect(loopWindowDecayDb(strokeWithDecay(1, 1.0, 0.25)) ?? NaN).toBeGreaterThan(3);
  });
  it('is null when the stroke does not loop', () => {
    expect(loopWindowDecayDb({ loop: null, channels: [new Float32Array(10)] } as unknown as DecodedStrokeResult)).toBeNull();
  });
  it('sustains steady samples and rings out decaying ones (per-sample median)', () => {
    expect(sampleShouldLoop([strokeWithDecay(1, 0.5, 0.5), strokeWithDecay(2, 0.5, 0.48)])).toBe(true);
    expect(sampleShouldLoop([strokeWithDecay(1, 1.0, 0.3), strokeWithDecay(2, 1.0, 0.25)])).toBe(false);
    expect(sampleShouldLoop([])).toBe(false);
  });
});

describe('createSampler audition playback', () => {
  const zone = { globalID: 7, rootKey: 60, keyLow: 21, keyHigh: 108, velLow: 0, velTop: 127 };
  const play = (stroke: DecodedStrokeResult): FakeSource => {
    audioMock.created.length = 0;
    createSampler([zone], new Map([[7, stroke]])).noteOn(60, 100);
    expect(audioMock.created).toHaveLength(1);
    return audioMock.created[0];
  };

  it('sustains a steady sample by looping the stored region', () => {
    const src = play(strokeWithDecay(7, 0.5, 0.5)); // ~0 dB decay → loop
    expect(src.loop).toBe(true);
    expect(src.loopStart).toBeCloseTo(100 / 44100, 6);
    expect(src.loopEnd).toBeCloseTo(400 / 44100, 6);
  });

  it('rings out a decaying sample — no loop even though loops=true (the CP80 case)', () => {
    const src = play(strokeWithDecay(7, 1.0, 0.25)); // strong decay → play once
    expect(src.loop).toBe(false);
  });

  it('applies the sample global detune to the playback rate', () => {
    audioMock.created.length = 0;
    createSampler([zone], new Map([[7, strokeWithDecay(7, 1.0, 0.25)]]), undefined, { detuneCents: 1200 })
      .noteOn(60, 100); // root note (rate 1) + one octave of detune → 2
    expect(audioMock.created[0].playbackRate.value).toBeCloseTo(2, 6);
  });

  it('plays a single source when unison is off, one per voice when engaged', () => {
    audioMock.created.length = 0;
    createSampler([zone], new Map([[7, strokeWithDecay(7, 1.0, 0.25)]]), undefined, {})
      .noteOn(60, 100);
    expect(audioMock.created).toHaveLength(1);

    audioMock.created.length = 0;
    createSampler([zone], new Map([[7, strokeWithDecay(7, 1.0, 0.25)]]), undefined,
      { unison: unison({ numVoiceSame: 3, panMax3: 80 }) }).noteOn(60, 100);
    expect(audioMock.created).toHaveLength(3); // one source per unison voice
  });

  it('round-robin jitters the rate per note; off plays every note identically', () => {
    const s = createSampler([zone], new Map([[7, strokeWithDecay(7, 1.0, 0.25)]]), undefined, { roundRobin: true });
    audioMock.created.length = 0;
    s.noteOn(60, 100); s.noteOff(60); s.noteOn(60, 100); s.noteOff(60); s.noteOn(60, 100);
    const rates = audioMock.created.map((x) => x.playbackRate.value);
    expect(new Set(rates).size).toBeGreaterThan(1);       // repeats differ (jittered)
    for (const r of rates) expect(r).toBeCloseTo(1, 1);   // …but only slightly (~±4¢)

    const off = createSampler([zone], new Map([[7, strokeWithDecay(7, 1.0, 0.25)]]), undefined, {});
    audioMock.created.length = 0;
    off.noteOn(60, 100); off.noteOff(60); off.noteOn(60, 100);
    expect(new Set(audioMock.created.map((x) => x.playbackRate.value)).size).toBe(1); // identical
  });
});
