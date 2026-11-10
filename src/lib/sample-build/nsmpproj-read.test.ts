import { describe, expect, it } from 'vitest';
import { addClip, addTake, addZone, emptyProject, projectProblems, setKeys, type SampleProject } from './model';
import { writeNsmpproj } from './nsmpproj';
import { nsmpprojAudioNames, nsmpprojToProject, parseNsmpproj } from './nsmpproj-read';
import type { ClipAudio } from './render';
import { readWav } from './import-files';

const tone = (seconds: number): ClipAudio => ({
  sampleRate: 44100, channels: [Float32Array.from({ length: Math.round(44100 * seconds) }, (_, i) => 0.5 * Math.sin(i / 20))],
});

function build(): { p: SampleProject; audio: Map<string, ClipAudio> } {
  const audio = new Map<string, ClipAudio>();
  let p = { ...emptyProject('Disco Strings'), category: 9 };
  const a = addClip(p, { label: 'Strings_C3.wav', source: { kind: 'file', fileName: 'Strings_C3.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: 88200 });
  audio.set(a.clipId, tone(2));
  const take = { clipId: a.clipId, start: 441, end: 88200, loop: { start: 22050 }, loopDecaySeconds: 4, loopCrossfadeMs: 50, gainDb: -6, tuneCents: 12 };
  const z = addZone(a.project, 48, take);
  p = addTake(z.project, z.zoneId, { ...take, start: 0, end: 44100, loop: null, loopDecaySeconds: null, loopCrossfadeMs: undefined, gainDb: 0, tuneCents: 0 }).project;
  return { p: setKeys(p, z.zoneId, 36, 60), audio };
}

describe('opening a Nord Sample Editor project', () => {
  it('reads back what OpenNord writes: zones, takes, the one that plays, trim, loop, crossfade, decay, level, tuning', () => {
    const { p, audio } = build();
    const written = writeNsmpproj(p, (id) => audio.get(id));
    const nse = parseNsmpproj(written.projectText);
    expect(nsmpprojAudioNames(nse)).toEqual(['Strings_C3.wav']);
    const byName = new Map([...written.wavs].map(([n, b]) => [n.toLowerCase(), readWav(b).audio]));
    const r = nsmpprojToProject(nse, byName);
    expect(projectProblems(r.project)).toEqual([]);
    expect(r.notes).toEqual([]);
    expect(r.project).toMatchObject({ name: 'Disco Strings', category: 9 });
    const z = r.project.zones[0];
    expect([z.rootKey, z.keyLow, z.keyHigh]).toEqual([48, 36, 60]);
    expect(z.takes).toHaveLength(2);
    expect(z.layers[0].takeId).toBe(z.takes[0].id);
    expect(z.takes[0]).toMatchObject({ start: 441, end: 88200, loop: { start: 22050 }, loopDecaySeconds: 4, loopCrossfadeMs: 50, tuneCents: 12 });
    expect(z.takes[0].gainDb).toBeCloseTo(-6, 2);
    expect(z.takes[1]).toMatchObject({ start: 0, end: 44100, loop: null });
  });

  it('finds recordings by file name, takes the switched-on sample, and says what it couldn’t carry', () => {
    const text = `SMACEditorProject {
  m_fileFormatVersion = 54
  audio_file {
    m_id = 1
    m_fullName = ../../Downloads/Pad.wav
    m_sampleRate = 44100
  }
  audio_file {
    m_id = 2
    m_fullName = ../Gone.wav
    m_sampleRate = 44100
  }
  common_zone {
    m_zoneId = 7
    common_stroke {
      m_globalID = 1
      m_fileID = 1
      m_start = 100.000000
      m_stop = 40000.000000
      m_loopEnabled = 0
      m_shortLoopEnabled = 1
      m_loopStart = 40000.000000
    }
    common_stroke {
      m_globalID = 2
      m_fileID = 1
      m_start = 0.000000
      m_stop = 44100.000000
      m_loopEnabled = 1
      m_loopStart = 20000.000000
      m_loopXFadeLengthLong = 441.000000
    }
    common_stroke {
      m_globalID = 3
      m_fileID = 2
      m_start = 0.000000
      m_stop = 100.000000
    }
  }
  instrument {
    m_name = Pad
    m_categoryCategory = 15
    map_info {
      map_zone {
        m_zoneId = 7
        m_rootKey = 60
        m_isEnabled = 1
        m_btmNote = 55
        m_topNote = 70
        map_stroke {
          m_globalID = 1
          m_isEnabled = 0
          m_gain = 1.000000
          m_detune = 0
        }
        map_stroke {
          m_globalID = 2
          m_isEnabled = 1
          m_gain = 0.500000
          m_detune = -5
        }
        map_stroke {
          m_globalID = 3
          m_isEnabled = 0
          m_gain = 1.000000
          m_detune = 0
        }
      }
    }
  }
}
`;
    const r = nsmpprojToProject(parseNsmpproj(text), new Map([['pad.wav', tone(1)]]));
    const z = r.project.zones[0];
    expect(z.takes).toHaveLength(2);
    const playing = z.takes.find((t) => t.id === z.layers[0].takeId)!;
    expect(playing).toMatchObject({ start: 0, end: 44100, loop: { start: 20000 }, loopCrossfadeMs: 10, tuneCents: -5 });
    expect(playing.gainDb).toBeCloseTo(-6.02, 1);
    expect(r.notes.join(' ')).toMatch(/“Gone\.wav”/);
    expect(r.notes.join(' ')).toMatch(/short loop/);
    expect(r.notes.join(' ')).toMatch(/One sample without its recording/);
  });

  it('says plainly when the file isn’t a project, or no recording was found', () => {
    expect(() => parseNsmpproj('hello')).toThrow(/isn’t a Nord Sample Editor project/);
    const { p, audio } = build();
    const nse = parseNsmpproj(writeNsmpproj(p, (id) => audio.get(id)).projectText);
    expect(() => nsmpprojToProject(nse, new Map())).toThrow(/None of the project’s recordings were found/);
  });
});
