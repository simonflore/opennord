/**
 * Reading an SFZ instrument (https://sfzformat.com): a text file of `<header>`s and
 * `opcode=value` pairs that maps recordings onto keys and velocities. This reads the part of
 * it a Nord sample can hold (which recording, which keys, its root, velocity, tuning, level,
 * start, end and loop) and names what it leaves out. Pure: files are handed in.
 *
 * Opcodes are inherited `<global>` → `<master>` → `<group>` → `<region>`, each header resetting
 * the levels below it; `<control>` sets `default_path` and key offsets for the regions after it.
 */

import { noteMidi } from './analysis/note-name';

/** The opcodes of one region, with everything it inherits merged in. */
type SfzOpcodes = Record<string, string>;

export interface SfzParse {
  regions: { opcodes: SfzOpcodes; control: SfzOpcodes }[];
  /** `#include`d files that couldn't be read. */
  missingIncludes: string[];
}

const MAX_INCLUDE_DEPTH = 8;

/** Strip `//` and block comments, keeping line breaks so later errors would still line up. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '');
}

/**
 * Expand `#include "file"` (read through `include`, relative to the including file) and
 * `#define $NAME value`. Defines apply to the text after them, as sfizz does.
 */
function preprocess(
  text: string, include: (path: string) => string | undefined, defines: [string, string][], missing: string[], depth: number,
): string {
  const out: string[] = [];
  for (const raw of stripComments(text).split(/\r?\n/)) {
    let line = raw;
    const def = /^\s*#define\s+(\$\w+)\s+(.*?)\s*$/.exec(line);
    if (def) {
      const at = defines.findIndex(([name]) => name === def[1]);
      if (at >= 0) defines.splice(at, 1);
      // Longest names first, so `$VEL10` isn't read as `$VEL1` followed by "0".
      defines.push([def[1], def[2]]);
      defines.sort((a, b) => b[0].length - a[0].length);
      continue;
    }
    if (line.includes('$')) for (const [name, value] of defines) line = line.split(name).join(value);
    const inc = /^\s*#include\s+"([^"]+)"/.exec(line);
    if (inc) {
      const body = depth < MAX_INCLUDE_DEPTH ? include(inc[1]) : undefined;
      if (body === undefined) missing.push(inc[1]);
      else out.push(preprocess(body, include, defines, missing, depth + 1));
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

type Level = 'global' | 'master' | 'group' | 'region';
const LEVELS: Level[] = ['global', 'master', 'group', 'region'];
const isLevel = (header: string): header is Level => (LEVELS as string[]).includes(header);

/**
 * Parse SFZ text into its regions. `include` reads an `#include`d file by the path the SFZ
 * gives (relative to the instrument's folder); without it, includes are reported missing.
 */
export function parseSfz(text: string, include: (path: string) => string | undefined = () => undefined): SfzParse {
  const missingIncludes: string[] = [];
  const body = preprocess(text, include, [], missingIncludes, 0);

  const levels: Record<Level, SfzOpcodes> = { global: {}, master: {}, group: {}, region: {} };
  let control: SfzOpcodes = {};
  let current: Level | 'control' | 'other' | null = null;
  const regions: SfzParse['regions'] = [];
  const closeRegion = () => {
    if (current === 'region') regions.push({ opcodes: { ...levels.global, ...levels.master, ...levels.group, ...levels.region }, control: { ...control } });
  };

  // A value runs to the next header or opcode, so sample paths may hold spaces.
  const token = /<(\w+)>|([A-Za-z0-9_]+)=/g;
  const matches = [...body.matchAll(token)];
  matches.forEach((m, i) => {
    if (m[1] !== undefined) {
      closeRegion();
      const header = m[1].toLowerCase();
      if (header === 'control') { control = {}; current = 'control'; return; }
      if (!isLevel(header)) { current = 'other'; return; } // <curve>, <effect>, <midi>, <sample>: not a region's
      for (const below of LEVELS.slice(LEVELS.indexOf(header))) levels[below] = {};
      current = header;
      return;
    }
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    const value = body.slice(m.index! + m[0].length, end).trim();
    const name = m[2].toLowerCase();
    if (current === 'control') control[name] = value;
    else if (current && current !== 'other') levels[current][name] = value;
  });
  closeRegion();
  return { regions, missingIncludes };
}

const NOTE = /^([a-g])(#|b)?(-?\d+)$/i;

/** An SFZ key: a MIDI number or a name (`c4` is 60, as in the SFZ spec). */
export function sfzKey(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  if (Number.isFinite(n)) return Math.round(n);
  const m = NOTE.exec(value.trim());
  if (!m) return undefined;
  return noteMidi(m[1], m[2], Number(m[3]));
}

const num = (value: string | undefined): number | undefined => {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/** One region, read: what a Nord sample can hold, with the SFZ's defaults filled in. */
export interface SfzRegion {
  /** The recording's path as the SFZ names it, `default_path` included, with `/` separators. */
  sample: string;
  lokey: number;
  hikey: number;
  /** The key the recording sounds at; `'sample'` takes it from the WAV's own root, when it has one. */
  keycenter: number | 'sample';
  lovel: number;
  hivel: number;
  /** Cents, `tune` and `transpose` together. */
  tuneCents: number;
  /** dB, `volume` and `amplitude` together. */
  gainDb: number;
  /** First frame played. */
  offset: number;
  /** Last frame played, when the SFZ says. */
  end?: number;
  /** `no_loop`/`one_shot` → none; a loop mode → the SFZ's points, else the WAV's; no mode → the WAV's own loop, if any. */
  loop: 'none' | 'sfz' | 'file';
  loopStart?: number;
  loopEnd?: number;
  /** `trigger=release` etc.: plays on another event than a key going down. */
  trigger: string;
  /** Round robin position (1 = first), and random range, for alternates. */
  seqPosition: number;
  random: boolean;
  /** Key switch this region needs, if any. */
  keyswitch?: number;
  keyswitchDefault?: number;
  /** False when the region plays one pitch on every key (`pitch_keytrack=0`). */
  keytrack: boolean;
  /** Opcodes present that a Nord sample has no place for. */
  dropped: string[];
}

/** What the Nord sample holds elsewhere or not at all, by the opcode families that set it. */
const DROPPED: [RegExp, string][] = [
  [/^ampeg_|^amp_veltrack$|^amp_velcurve_/, 'volume envelope'],
  [/^fil|^cutoff|^resonance/, 'filter'],
  [/^pitcheg_|^pitchlfo_|^bend_/, 'pitch envelope and bend'],
  [/^amplfo_|^lfo\d/, 'LFOs'],
  [/^eq\d|^effect\d/, 'EQ and effects'],
  [/^xf(in|out)_|^xfin|^xfout/, 'crossfades'],
  [/^pan$|^width$|^position$/, 'pan and width'],
];

/** Read one parsed region. */
export function sfzRegion({ opcodes: o, control: c }: SfzParse['regions'][number]): SfzRegion {
  const shift = (num(c.note_offset) ?? 0) + 12 * (num(c.octave_offset) ?? 0);
  const key = sfzKey(o.key);
  const lokey = (sfzKey(o.lokey) ?? key ?? 0) + shift;
  const hikey = (sfzKey(o.hikey) ?? key ?? 127) + shift;
  const given = sfzKey(o.pitch_keycenter) ?? key;
  // The default root (60) is a pitch, not a key the offsets move.
  const center = o.pitch_keycenter?.toLowerCase() === 'sample' ? 'sample' as const : given !== undefined ? given + shift : 60;
  const amplitude = num(o.amplitude) ?? 0;
  const mode = (o.loop_mode ?? o.loopmode)?.toLowerCase();
  const loopStart = num(o.loop_start ?? o.loopstart);
  const loopEnd = num(o.loop_end ?? o.loopend);
  // As players read it: with no loop mode, the WAV's own loop decides (and loop points
  // written out alone don't loop); a loop mode loops on the SFZ's points, else the WAV's.
  const looping = mode === 'loop_continuous' || mode === 'loop_sustain';
  const loop = mode === undefined ? 'file'
    : looping && loopStart !== undefined && loopEnd !== undefined ? 'sfz' : looping ? 'file' : 'none';
  const dropped = new Set<string>();
  for (const name of Object.keys(o)) for (const [re, label] of DROPPED) if (re.test(name)) dropped.add(label);
  return {
    sample: `${c.default_path ?? ''}${o.sample ?? ''}`.replace(/\\/g, '/'),
    lokey, hikey, keycenter: center,
    lovel: num(o.lovel) ?? 1, hivel: num(o.hivel) ?? 127,
    tuneCents: (num(o.tune) ?? 0) + 100 * (num(o.transpose) ?? 0),
    gainDb: (num(o.volume) ?? 0) + (amplitude > 0 ? 20 * Math.log10(amplitude / 100) : 0),
    offset: Math.max(0, Math.round(num(o.offset) ?? 0)),
    end: num(o.end),
    loop, loopStart, loopEnd,
    trigger: (o.trigger ?? 'attack').toLowerCase(),
    seqPosition: num(o.seq_position) ?? 1,
    random: (num(o.lorand) ?? 0) > 0,
    keyswitch: sfzKey(o.sw_last),
    keyswitchDefault: sfzKey(o.sw_default),
    keytrack: (num(o.pitch_keytrack) ?? 100) !== 0,
    dropped: [...dropped],
  };
}
