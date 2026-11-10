import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { addClip, addTake, addZone, emptyProject, setKeys, setTarget, type SampleProject } from './model';
import { writeNsmpproj, zipNsmpproj } from './nsmpproj';
import { NSE_PROJECT_KEYS } from './nsmpproj-keys.testdata';
import { parseWav } from '../ns4/wav';
import type { ClipAudio } from './render';

/** Sections (by path) and their keys in order, from a project's text; values by section for checks. */
function parse(text: string) {
  const keys: Record<string, string[]> = {};
  const values: { path: string; kv: Record<string, string> }[] = [];
  const stack: string[] = [];
  const open: Record<string, string>[] = [];
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s) continue;
    if (s.endsWith('{')) {
      stack.push(s.slice(0, -1).trim());
      keys[stack.join('/')] ??= [];
      const kv: Record<string, string> = {};
      open.push(kv);
      values.push({ path: stack.join('/'), kv });
    } else if (s === '}') { stack.pop(); open.pop(); }
    else {
      const at = s.indexOf(' =');
      const k = s.slice(0, at), v = s.slice(at + 2).trim();
      const list = keys[stack.join('/')];
      if (!list.includes(k)) list.push(k);
      open[open.length - 1][k] = v;
    }
  }
  return { keys, values, all: (path: string) => values.filter((x) => x.path.endsWith(path)).map((x) => x.kv) };
}

const tone = (rate: number, seconds: number): ClipAudio => ({
  sampleRate: rate,
  channels: [Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 220 * i) / rate))],
});

function build(): { p: SampleProject; audio: Map<string, ClipAudio> } {
  const audio = new Map<string, ClipAudio>();
  let p = emptyProject('Disco Strings');
  const a = addClip(p, { label: 'Strings_C3.wav', source: { kind: 'file', fileName: 'Strings_C3.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: 88200 });
  audio.set(a.clipId, tone(44100, 2));
  const b = addClip(a.project, { label: 'Strings_C4.wav', source: { kind: 'file', fileName: 'Strings_C4.wav' }, audioRef: 'b', sampleRate: 22050, channels: 1, frames: 44100 });
  audio.set(b.clipId, tone(22050, 2));
  const take = (clipId: string, end: number) => ({ clipId, start: 0, end, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 });
  const z1 = addZone(b.project, 48, { ...take(a.clipId, 88200), start: 441, loop: { start: 22050 }, loopCrossfadeMs: 100, gainDb: -6, tuneCents: 12, loopDecaySeconds: 4 });
  p = addTake(z1.project, z1.zoneId, take(a.clipId, 44100)).project; // a waiting take
  const z2 = addZone(p, 60, take(b.clipId, 44100));
  p = setKeys(setKeys(z2.project, z1.zoneId, 36, 54), z2.zoneId, 55, 84);
  return { p, audio };
}

describe('writeNsmpproj', () => {
  it('has the editor’s sections and keys, in the editor’s order', () => {
    const { p, audio } = build();
    const { projectText } = writeNsmpproj(p, (id) => audio.get(id), { now: 1716488004, maker: { name: 'OpenNord', version: 'test' } });
    expect(parse(projectText).keys).toEqual(NSE_PROJECT_KEYS);
    expect(projectText.startsWith('SMACEditorProject {\n  m_fileFormatVersion = 54\n')).toBe(true);
    expect(projectText.endsWith('    }\n  }\n}\n')).toBe(true);
    expect(projectText).toContain('\n      m_buffer = \n'); // the editor writes an empty value with its space
  });

  it('carries zones, takes, trim, loop, crossfade, decay, level and tuning', () => {
    const { p, audio } = build();
    const out = parse(writeNsmpproj(p, (id) => audio.get(id), { now: 1 }).projectText);
    const zones = out.all('map_info/map_zone');
    expect(zones.map((z) => [z.m_rootKey, z.m_btmNote, z.m_topNote])).toEqual([['48', '36', '54'], ['60', '55', '84']]);
    // Every take is a stroke; the one that plays is enabled, as the editor marks a zone's active sample.
    const mapStrokes = out.all('map_zone/map_stroke');
    expect(mapStrokes.map((s) => s.m_isEnabled)).toEqual(['1', '0', '1']);
    expect(Number(mapStrokes[0].m_gain)).toBeCloseTo(10 ** (-6 / 20), 5);
    expect(mapStrokes[0].m_detune).toBe('12');
    const [looped, waiting, other] = out.all('common_zone/common_stroke');
    expect(looped).toMatchObject({
      m_fileID: '1', m_loopEnabled: '1', m_start: '441.000000', m_stop: '88200.000000', m_loopStart: '22050.000000',
      m_loopLengthLong: '66150.000000', m_startSecondary: '11245.500000', m_loopXFadeLengthLong: '4410.000000',
      m_loopDecayEnabled: '1', m_loopDecay: '4.000000', m_begin: '0.000000', m_end: '88200.000000',
    });
    expect(Number(looped.m_strength)).toBe(Math.round(20 * Math.log10(0.5) * 1000));
    expect(waiting).toMatchObject({ m_loopEnabled: '0', m_loopStart: '44100.000000', m_loopLengthLong: '0.000000' });
    // A 22.05 kHz recording goes out at 44.1 kHz, the editor's lowest rate; its positions scale with it.
    expect(other).toMatchObject({ m_fileID: '2', m_stop: '88200.000000' });
    expect(out.all('audio_file')).toEqual([
      expect.objectContaining({ m_id: '1', m_fullName: 'Strings_C3.wav', m_sampleRate: '44100' }),
      expect.objectContaining({ m_id: '2', m_fullName: 'Strings_C4.wav', m_sampleRate: '44100' }),
    ]);
    expect(out.all('instrument')[0]).toMatchObject({ m_name: 'Disco Strings', m_categoryCategory: '15', m_crc: '0' });
    expect(out.all('note_info')).toHaveLength(92);
  });

  it('writes the WAVs it names, untouched by level or crossfade, and zips them beside the project', () => {
    const { p, audio } = build();
    const written = writeNsmpproj(p, (id) => audio.get(id));
    const files = unzipSync(zipNsmpproj('Disco Strings.nsmpproj', written));
    expect(Object.keys(files).sort()).toEqual(['Disco Strings.nsmpproj', 'Strings_C3.wav', 'Strings_C4.wav']);
    expect(strFromU8(files['Disco Strings.nsmpproj'])).toBe(written.projectText);
    const wav = parseWav(files['Strings_C3.wav']);
    expect(wav.sampleRate).toBe(44100);
    expect(wav.channels[0].length).toBe(88200);
    expect(parseWav(files['Strings_C4.wav']).channels[0].length).toBe(88200);
  });

  it('keeps the CRC of the sample built from the project, as the editor keeps its last export’s', () => {
    const { p, audio } = build();
    const built = new Uint8Array(64);
    new DataView(built.buffer).setUint32(0x18, 886437759, true);
    const out = parse(writeNsmpproj(p, (id) => audio.get(id), { builtFile: built }).projectText);
    expect(out.all('instrument')[0]).toMatchObject({ m_crc: '886437759', m_crcProj: '886437759' });
  });

  it('gives two recordings with the same name different files', () => {
    let { p, audio } = build();
    const c = addClip(p, { label: 'Strings_C3.wav', source: { kind: 'file', fileName: 'Strings_C3.wav' }, audioRef: 'c', sampleRate: 44100, channels: 1, frames: 44100 });
    audio = new Map(audio).set(c.clipId, tone(44100, 1));
    p = addZone(c.project, 90, { clipId: c.clipId, start: 0, end: 44100, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 }).project;
    expect([...writeNsmpproj(p, (id) => audio.get(id)).wavs.keys()]).toEqual(['Strings_C3.wav', 'Strings_C4.wav', 'Strings_C3 2.wav']);
  });

  it('refuses a piano and a take whose audio is missing, saying why', () => {
    const { p, audio } = build();
    expect(() => writeNsmpproj(setTarget(p, 'npno'), (id) => audio.get(id))).toThrow(/piano/);
    expect(() => writeNsmpproj(p, () => undefined)).toThrow(/couldn’t be read/);
  });
});
