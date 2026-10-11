import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attenuationGain, createPianoEngine, loopDecayTimeConstant, pianoKey, MAX_VOICES, MIX_HEADROOM, type PianoEngineEvents } from './pianoEngine';
import { readNspDirectory } from '@/lib/ns4/nsp-audio';
import { readNspZones, type NspZone } from '@/lib/ns4/nsp';
import { makeNpno, tone } from '@/lib/ns4/nsp-synth.testing';

// Minimal Web-Audio fake so createPianoEngine runs headless; records the nodes it creates.
type FakeParam = { calls: unknown[][]; setValueAtTime: (...a: number[]) => void; setTargetAtTime: (...a: number[]) => void };
type FakeSource = { buffer: { length: number } | null; loop: boolean; loopStart: number; loopEnd: number; playbackRate: { value: number }; onended: (() => void) | null; stopped: number | null; connect: (n: unknown) => unknown; start: () => void; stop: (t?: number) => void };
const audioMock = vi.hoisted(() => {
  const created: FakeSource[] = [];
  const gains: FakeParam[] = [];
  const nodes: { gain: FakeParam; to: unknown }[] = [];
  const ctx = {
    currentTime: 0,
    destination: {},
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (i: number) => data[i] };
    },
    createBufferSource: (): FakeSource => {
      const s: FakeSource = {
        buffer: null, loop: false, loopStart: 0, loopEnd: 0, playbackRate: { value: 1 }, onended: null, stopped: null,
        connect: (n) => n, start: () => {}, stop: (t = 0) => { s.stopped = t; },
      };
      created.push(s);
      return s;
    },
    createGain: () => {
      const calls: unknown[][] = [];
      const gain: FakeParam = { calls, setValueAtTime: (...a) => { calls.push(['set', ...a]); }, setTargetAtTime: (...a) => { calls.push(['target', ...a]); } };
      gains.push(gain);
      const node = { gain, to: null as unknown, connect: (n: unknown) => { node.to = n; return n; } };
      nodes.push(node);
      return node;
    },
    createDynamicsCompressor: () => {
      const p = () => ({ value: 0 });
      const node = { limiter: true, threshold: p(), knee: p(), ratio: p(), attack: p(), release: p(), to: null as unknown, connect: (n: unknown) => { node.to = n; return n; } };
      return node;
    },
  };
  return { created, gains, nodes, ctx };
});
vi.mock('@/components/sample/audioPlayer', () => ({ getSharedCtx: () => audioMock.ctx }));

beforeEach(() => { audioMock.created.length = 0; audioMock.gains.length = 0; audioMock.nodes.length = 0; audioMock.ctx.currentTime = 0; });

// Synthetic piano: zone 0 = keys 0–59 (root 48) with a loud and a soft layer of different
// lengths, zone 1 = keys 60–127 (root 72).
const s = (frames: number, velocityFrom: number) => ({ pcm: [tone(frames, 0.02, 3000, 1)], velocityFrom, before: [[0, 0, 0, 0]] });
function synth() {
  const bytes = makeNpno([s(3000, 0), s(2000, 64), s(1000, 0)], 1, 0x2c);
  return { bytes, dir: readNspDirectory(bytes)!, zones: readNspZones(bytes) };
}
function engineFor(events?: PianoEngineEvents) {
  const { bytes, dir, zones } = synth();
  return { engine: createPianoEngine(bytes, dir, zones, events)!, dir };
}

describe('pianoKey', () => {
  const zones: NspZone[] = [{ rootNote: 48, lowNote: 0, highNote: 59 }, { rootNote: 72, lowNote: 60, highNote: 127 }];

  it('finds the zone a key plays and how far to re-pitch its recording', () => {
    // A recording sounds 4 semitones above its key-map root (NSP_ROOT_OFFSET).
    expect(pianoKey(zones, 52)).toEqual({ zone: 0, semitones: 0 });
    expect(pianoKey(zones, 40)).toEqual({ zone: 0, semitones: -12 });
    expect(pianoKey(zones, 60)).toEqual({ zone: 1, semitones: -16 });
  });

  it('plays nothing for a key no zone covers', () => {
    expect(pianoKey([{ rootNote: 48, lowNote: 40, highNote: 59 }], 30)).toBeNull();
  });

});

describe('attenuationGain', () => {
  it('is full level at the hardest hit and falls with a softer touch', () => {
    expect(attenuationGain(127)).toBe(1);
    expect(attenuationGain(64)).toBeLessThan(attenuationGain(100));
    // 40·log10(64/127) dB (the touch law strokeFor selects layers by)
    expect(20 * Math.log10(attenuationGain(64))).toBeCloseTo(40 * Math.log10(64 / 127), 5);
  });
});

describe('loopDecayTimeConstant', () => {
  it('turns the per-update factor into seconds (22,050 updates a second)', () => {
    // 2^23 − 98 … 2^23 − 2782 in factory files: about 2.2 to 63 dB a second.
    const dbPerSecond = (c: number) => 20 * Math.log10(Math.E) / loopDecayTimeConstant(c)!;
    expect(dbPerSecond(1 - 98 / 2 ** 23)).toBeCloseTo(2.24, 1);
    expect(dbPerSecond(1 - 2782 / 2 ** 23)).toBeCloseTo(63.5, 0);
  });
  it('is absent when the note holds its level (or the value is unusable)', () => {
    expect(loopDecayTimeConstant(1)).toBeNull();
    expect(loopDecayTimeConstant(0)).toBeNull();
    expect(loopDecayTimeConstant(undefined)).toBeNull();
  });
});

describe('createPianoEngine', () => {
  it('is not made when the key map disagrees with the recordings', () => {
    const { bytes, dir, zones } = synth();
    expect(createPianoEngine(bytes, dir, zones.slice(0, 1))).toBeNull();
  });

  it('plays a key from its zone, re-pitched, at the level of the touch', () => {
    const { engine, dir } = engineFor();
    engine.noteOn(40, 127);
    expect(audioMock.created).toHaveLength(1);
    expect(audioMock.created[0].buffer!.length).toBe(dir.strokes[0].frames);
    expect(audioMock.created[0].playbackRate.value).toBeCloseTo(0.5, 6); // an octave below the recording
    expect(audioMock.gains[1].calls[0]).toEqual(['set', 1, 0]); // gains[0] is the mix bus
    expect(engine.sounding()).toEqual(new Set([40]));
  });

  it('mixes every note through one bus with headroom and a limiter, so chords do not clip', () => {
    const { engine } = engineFor();
    engine.noteOn(52, 127);
    engine.noteOn(72, 127);
    // nodes: the bus (made with the first note), then one gain per voice
    const [bus, first, second] = audioMock.nodes;
    expect(bus.gain.calls[0]).toEqual(['set', MIX_HEADROOM, 0]);
    expect(MIX_HEADROOM).toBeLessThan(0.5);
    expect(first.to).toBe(bus);
    expect(second.to).toBe(bus);
    const limiter = bus.to as { limiter: boolean; to: unknown };
    expect(limiter.limiter).toBe(true);
    expect(limiter.to).toBe(audioMock.ctx.destination);
  });

  it('picks the softer recording for a soft touch', () => {
    const { engine, dir } = engineFor();
    engine.noteOn(52, 20);
    expect(audioMock.created[0].buffer!.length).toBe(dir.strokes[1].frames);
  });

  it('holds several notes at once and fades one out on key-up', () => {
    const { engine } = engineFor();
    engine.noteOn(52, 100);
    engine.noteOn(72, 100);
    expect([...engine.sounding()]).toEqual([52, 72]);
    audioMock.ctx.currentTime = 1;
    engine.noteOff(52);
    expect([...engine.sounding()]).toEqual([72]);
    expect(audioMock.gains[1].calls.at(-1)![0]).toBe('target'); // the first voice (gains[0] is the mix bus)
    expect(audioMock.created[0].stopped).toBeGreaterThan(1); // stops after the fade, not at once
    expect(audioMock.created[1].stopped).toBeNull();
  });

  it('clears a note that rings out by itself', () => {
    const { engine } = engineFor();
    engine.noteOn(52, 100);
    audioMock.created[0].onended!();
    expect(engine.sounding().size).toBe(0);
  });

  it('restriking a held key fades the old note and keeps the new one', () => {
    const { engine } = engineFor();
    engine.noteOn(52, 100);
    engine.noteOn(52, 100);
    expect(audioMock.created[0].stopped).not.toBeNull();
    audioMock.created[0].onended!(); // the old note ending must not clear the new one
    expect(engine.sounding().has(52)).toBe(true);
  });

  it('decodes a recording once and reuses it', () => {
    const { engine } = engineFor();
    engine.noteOn(52, 100);
    engine.noteOn(53, 100);
    expect(audioMock.created[0].buffer).toBe(audioMock.created[1].buffer);
  });

  it('never sounds more voices than the cap', () => {
    const { engine } = engineFor();
    for (let k = 0; k < MAX_VOICES + 3; k++) engine.noteOn(k, 100);
    expect(engine.sounding().size).toBe(MAX_VOICES);
    expect(engine.sounding().has(0)).toBe(false); // the oldest went first
  });

  it('tells the keyboard whenever the held notes change', () => {
    const onChange = vi.fn();
    const { engine } = engineFor({ onChange });
    engine.noteOn(52, 100);
    expect(onChange).toHaveBeenCalledTimes(1);
    engine.noteOff(52);
    expect(onChange).toHaveBeenCalledTimes(2);
    engine.noteOn(72, 100);
    audioMock.created[1].onended!();
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenLastCalledWith(new Set());
  });

  it('sustains a held note in its loop, fading at the piano\'s own rate', () => {
    const looped = { ...s(3000, 0), loop: { start: 2000, length: 441 } };
    const bytes = makeNpno([looped, s(1000, 0)], 1, 0x2c);
    // Record +0x2E: the loop-sustain decay, Q23 (docs/PIANO-ENGINE.md §1.4).
    new DataView(bytes.buffer).setUint32(0x2c + 0x732 + 0x2e, 2 ** 23 - 1000);
    const dir = readNspDirectory(bytes)!;
    const engine = createPianoEngine(bytes, dir, readNspZones(bytes))!;
    engine.noteOn(40, 127); // an octave down: reaches the loop twice as late
    const src = audioMock.created[0];
    expect(src.loop).toBe(true);
    expect(src.loopStart).toBeCloseTo(2000 / 44100, 9);
    expect(src.loopEnd).toBeCloseTo(2441 / 44100, 9);
    const fall = audioMock.gains.map((g) => g.calls.find((c) => c[0] === 'target')).find(Boolean)!;
    expect(fall[2]).toBeCloseTo((2000 / 44100) / 0.5, 6);
    expect(fall[3]).toBeCloseTo(loopDecayTimeConstant(1 - 1000 / 2 ** 23)!, 9);
    expect(src.stopped).toBeGreaterThan(fall[2] as number); // ends once it has faded out

    engine.noteOn(72, 127); // no loop: plays through once
    expect(audioMock.created[1].loop).toBe(false);
  });

  it('stopAll releases everything', () => {
    const { engine } = engineFor();
    engine.noteOn(52, 100);
    engine.noteOn(72, 100);
    engine.stopAll();
    expect(engine.sounding().size).toBe(0);
    expect(audioMock.created.every((c) => c.stopped !== null)).toBe(true);
  });

  it('reports a recording it cannot decode instead of throwing', () => {
    const { bytes, dir, zones } = synth();
    const onError = vi.fn();
    const broken = bytes.slice();
    broken.fill(0, dir.strokes[2].offset, dir.strokes[2].offset + 2); // zero block header
    const engine = createPianoEngine(broken, dir, zones, { onError })!;
    expect(() => engine.noteOn(72, 100)).not.toThrow();
    expect(onError).toHaveBeenCalledOnce();
    expect(engine.sounding().size).toBe(0);
  });
});
