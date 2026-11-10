/**
 * A build as a Nord Sample Editor project (`.nsmpproj`), for players who want to carry on in
 * the editor: the project text plus one WAV per recording, side by side, zipped. The editor
 * finds the WAVs by a path relative to the project, so the two must be unzipped together.
 *
 * The layout follows three projects the editor saved (file format 54, editor v4.14–v4.32):
 * plain text, `name {` … `}` sections indented two spaces, `key = value` lines, floats with six
 * decimals. A zone is written three times (`common_zone` with its strokes, `instrument_zone`,
 * `map_zone`), tied by `m_zoneId`; a stroke is tied across them by `m_globalID`, and to its
 * recording by `m_fileID`. Every take of a zone becomes a stroke; the one that plays is
 * enabled (`map_stroke m_isEnabled`), as the editor marks a zone's active sample.
 *
 * What the project carries and how (positions in frames of the WAV):
 * - trim: `m_start` / `m_stop`; the editor's view margin `m_begin` / `m_end` is one second
 *   either side, clamped to the recording, as the editor saves it;
 * - loop: `m_loopEnabled`, `m_loopStart`, `m_loopLengthLong` = stop − loop start,
 *   `m_startSecondary` halfway between start and loop start (the editor's own relations);
 *   loop crossfade as `m_loopXFadeLengthLong` (frames), so the audio is not baked here;
 *   loop decay as `m_loopDecay`, the time to fall 40 dB like the take's (`loopDecayRaw`);
 * - level as the stroke's linear `m_gain`; tuning as its `m_detune` in cents;
 * - root and keys on `map_zone`; category on the instrument (the same ids, 15 = User).
 *
 * Not known and so written as the editor's defaults, or worked out: `m_strength` is taken as
 * the stroke's peak in thousandths of a dB (the examples' values fit that), and `m_crc` /
 * `m_crcProj` are the CRC of the sample file built from the same project when there is one
 * (the editor stores its last export's CRC there), else 0.
 */
import { strToU8, zipSync } from 'fflate';
import { encodeWav, nseExportRate } from '../ns4/wav';
import { resampleForExport } from '../ns4/nse-resample';
import { takeOf, type SampleProject, type Take } from './model';
import { crossfadeFrames, type ClipAudio, type ReadAudio } from './render';

/** The editor's project format version in the files this follows. */
export const NSMPPROJ_FORMAT_VERSION = 54;
/** User, the editor's category for an instrument nobody filed. */
const USER_CATEGORY = 15;
/** The notes the editor keeps per-note gain and tuning for (`note_info`), in every project seen. */
const NOTE_INFO_FIRST = 17, NOTE_INFO_LAST = 108;

const f6 = (n: number) => n.toFixed(6);

/** The editor's zone settings left at their defaults (imaging, EQ), in its order. */
const ZONE_DEFAULTS: [string, string][] = [
  ['m_ImagingEnable', '0'], ['m_ImagingL', f6(1)], ['m_ImagingR2L', f6(0)], ['m_ImagingL2R', f6(0)], ['m_ImagingR', f6(1)],
  ['m_eqLowCutFreq', f6(50)], ['m_eqLowCutEnable', '0'], ['m_eqMidGain_0', f6(0)], ['m_eqMidGain_1', f6(0)],
  ['m_eqMidFreq_0', f6(1000)], ['m_eqMidFreq_1', f6(4000)], ['m_eqMidQ_0', f6(0.5)], ['m_eqMidQ_1', f6(0.5)],
  ['m_eqMidEnable_0', '0'], ['m_eqMidEnable_1', '0'], ['m_eqHiCutFreq', f6(10000)], ['m_eqHiCutEnable', '0'],
  ['m_eqMidGain_2', f6(0)], ['m_eqMidFreq_2', f6(6000)], ['m_eqMidQ_2', f6(0.5)], ['m_eqMidEnable_2', '0'],
  ['m_eqMidDynGainEn_0', '0'], ['m_eqMidDynGainEn_1', '0'], ['m_eqMidDynGainEn_2', '0'],
  ['m_eqMidVarGainEn_0', '0'], ['m_eqMidVarGainEn_1', '0'], ['m_eqMidVarGainEn_2', '0'],
  ['m_eqMidVarGainAtcTime_0', f6(0)], ['m_eqMidVarGainAtcTime_1', f6(0)], ['m_eqMidVarGainAtcTime_2', f6(0)],
  ['m_eqMidVarGainDcyTime_0', f6(0)], ['m_eqMidVarGainDcyTime_1', f6(0)], ['m_eqMidVarGainDcyTime_2', f6(0)],
  ['m_eqDynLPEnable', '0'], ['m_eqDynLPHoldOff', f6(0.2)], ['m_eqDynLPInitialFreqHi', f6(17000)], ['m_eqDynLPInitialFreqLo', f6(10000)],
  ['m_eqDynLPFinalFreqHi', f6(5000)], ['m_eqDynLPFinalFreqLo', f6(3000)], ['m_eqDynLPReleaseFreqHi', f6(8000)],
  ['m_eqDynLPReleaseFreqLo', f6(3000)], ['m_eqDynLPFinalFreq2Hi', f6(3000)], ['m_eqDynLPFinalFreq2Lo', f6(2000)],
  ['m_eqTrackingMultFactor', f6(1)],
  ...Array.from({ length: 10 }, (_, i): [string, string] => [`m_eqTrackingGain${i + 1}`, f6(0)]),
  ['m_eqTrackingEnable', '0'],
  ...Array.from({ length: 10 }, (_, i): [string, string] => [`m_eqTrackingBand${i + 1}Enable`, '0']),
];

/** Text in the editor's layout: sections indented two spaces a level. */
class Out {
  private lines: string[] = [];
  private depth = 0;
  open(name: string) { this.lines.push(`${'  '.repeat(this.depth++)}${name} {`); }
  close() { this.lines.push(`${'  '.repeat(--this.depth)}}`); }
  kv(key: string, value: string | number) { this.lines.push(`${'  '.repeat(this.depth)}${key} = ${value}`); }
  text() { return `${this.lines.join('\n')}\n`; }
}

/** A recording as it goes out: at a rate the editor accepts, and the factor its frame positions scale by. */
interface OutClip { fileId: number; fileName: string; audio: ClipAudio; scale: number }

/** A file name safe on every system, without its extension. */
const safeStem = (s: string) => s.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Recording';

/** Peak of [from, to) over every channel, in thousandths of a dB (0 is full scale). */
function strength(audio: ClipAudio, from: number, to: number): number {
  let peak = 0;
  for (const ch of audio.channels) for (let i = Math.max(0, from); i < Math.min(ch.length, to); i++) peak = Math.max(peak, Math.abs(ch[i]));
  return peak > 0 ? Math.min(0, Math.round(20 * Math.log10(peak) * 1000)) : -96000;
}

export interface NsmpprojOptions {
  /** Seconds since 1970, for the editor's modify dates. */
  now?: number;
  /** The sample file OpenNord builds from this project, whose CRC the editor keeps as its last export's. */
  builtFile?: Uint8Array;
  /** Name and version written as the project's maker. */
  maker?: { name: string; version: string };
}

/** The `.nsmpproj` text and the WAVs it names, by file name. Throws when a used recording's audio is missing. */
export function writeNsmpproj(p: SampleProject, read: ReadAudio, opts: NsmpprojOptions = {}): { projectText: string; wavs: Map<string, Uint8Array> } {
  if (p.target === 'npno') throw new Error('A Nord Sample Editor project holds a sample, not a piano: switch the format to Stage 4 or Stage 3.');
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const zones = [...p.zones].sort((a, b) => a.rootKey - b.rootKey);

  // The recordings the takes use, each written once, under a name not taken yet.
  const clips = new Map<string, OutClip>();
  const taken = new Set<string>();
  for (const z of zones) for (const t of z.takes) {
    if (clips.has(t.clipId)) continue;
    const clip = p.clips.find((c) => c.id === t.clipId);
    const a = read(t.clipId);
    if (!clip || !a) throw new Error(`The audio for “${clip?.label ?? 'a take'}” couldn’t be read, so the project wasn’t written.`);
    let name = `${safeStem(clip.label)}.wav`;
    for (let k = 2; taken.has(name.toLowerCase()); k++) name = `${safeStem(clip.label)} ${k}.wav`;
    taken.add(name.toLowerCase());
    const rate = nseExportRate(a.sampleRate);
    const audio = rate === a.sampleRate ? a : {
      sampleRate: rate, channels: resampleForExport(a.channels, a.sampleRate, rate).map((ch) => Float32Array.from(ch)),
    };
    clips.set(t.clipId, { fileId: clips.size + 1, fileName: name, audio, scale: rate / a.sampleRate });
  }

  // Ids: zones and strokes are numbered as the editor does, by any unique number.
  let nextStroke = 1;
  const strokeIds = new Map<Take, number>();
  for (const z of zones) for (const t of z.takes) strokeIds.set(t, nextStroke++);
  const zoneId = (i: number) => 100 + i;

  const positionsOf = (t: Take) => {
    const c = clips.get(t.clipId)!;
    const at = (f: number) => f * c.scale;
    const frames = c.audio.channels[0].length;
    const start = at(t.start), stop = Math.min(frames, at(t.end));
    const loopStart = t.loop ? at(t.loop.start) : stop;
    const xfade = crossfadeFrames(t, c.audio.sampleRate / c.scale) * c.scale; // the fade in frames of the recording, then of the WAV
    return {
      c, start, stop, loopStart, xfade,
      begin: Math.max(0, start - c.audio.sampleRate), end: Math.min(frames, stop + c.audio.sampleRate),
      strength: strength(c.audio, Math.round(start), Math.round(stop)),
    };
  };
  const positions = new Map(zones.flatMap((z) => z.takes.map((t) => [t, positionsOf(t)] as const)));
  const strengths = [...positions.values()].map((s) => s.strength);

  const o = new Out();
  o.open('SMACEditorProject');
  o.kv('m_fileFormatVersion', NSMPPROJ_FORMAT_VERSION);
  o.kv('m_createdByProdName', opts.maker?.name ?? 'OpenNord');
  o.kv('m_createdByProdVer', opts.maker?.version ?? '');
  o.open('document');
  o.kv('m_zones.size', zones.length);
  o.kv('m_instruments.size', 1);
  o.kv('m_audioFiles.size', clips.size);
  o.kv('m_maxStrength', 0);
  o.kv('m_minStrength', strengths.length ? Math.min(...strengths) : 0);
  o.kv('m_modifyDate', now);
  o.close();
  for (const c of clips.values()) {
    o.open('audio_file');
    o.kv('m_id', c.fileId);
    o.kv('m_fullName', c.fileName);
    o.kv('m_sampleRate', c.audio.sampleRate);
    o.kv('m_modifyDate', now);
    o.close();
  }

  zones.forEach((z, i) => {
    o.open('common_zone');
    o.kv('m_zoneId', zoneId(i));
    o.kv('m_strokes.size', z.takes.length);
    o.kv('m_modifyDate', now);
    o.kv('m_mapTopNote', 0);
    for (const t of z.takes) {
      const s = positions.get(t)!;
      o.open('common_stroke');
      o.kv('m_globalID', strokeIds.get(t)!);
      o.kv('m_fileID', s.c.fileId);
      o.kv('m_strokeType', 0);
      o.kv('m_strength', s.strength);
      o.kv('m_shortLoopUsesPitch', 1);
      o.kv('m_begin', f6(s.begin));
      o.kv('m_end', f6(s.end));
      o.kv('m_start', f6(s.start));
      o.kv('m_startSecondary', f6((s.start + s.loopStart) / 2));
      o.kv('m_stop', f6(s.stop));
      o.kv('m_loopEnabled', t.loop ? 1 : 0);
      o.kv('m_shortLoopEnabled', 0);
      o.kv('m_loopLengthShort', f6(0));
      o.kv('m_loopXFadeShort', 10);
      o.kv('m_loopStart', f6(s.loopStart));
      o.kv('m_loopLengthLong', f6(s.stop - s.loopStart));
      o.kv('m_loopDecayEnabled', t.loop && t.loopDecaySeconds ? 1 : 0);
      o.kv('m_loopDecay', f6(t.loopDecaySeconds ?? 20));
      o.kv('m_loopDetune', 0);
      o.kv('m_loopXFadeLengthLong', f6(s.xfade));
      o.kv('m_loopXFModeLong', 0);
      o.kv('m_release', f6(0));
      o.kv('m_fadeInEnable', 0);
      o.kv('m_fadeInLength', f6(9600));
      o.kv('m_fadeOutLength', f6(9600));
      o.kv('m_fadeOutRef', 0);
      o.kv('m_fadeOutMode', 0);
      o.kv('m_fadeOutEnable', 0);
      o.kv('m_modifyDate', now);
      o.close();
    }
    o.close();
  });

  const crc = opts.builtFile && opts.builtFile.length >= 0x1c
    ? new DataView(opts.builtFile.buffer, opts.builtFile.byteOffset).getUint32(0x18, true) : 0;
  o.open('instrument');
  o.kv('m_id', 0);
  o.kv('m_type', 0);
  o.kv('m_name', p.name.replace(/[\r\n]+/g, ' ').trim() || 'Sample');
  o.kv('m_crc', crc);
  o.kv('m_crcProj', crc);
  o.kv('m_revision', 0);
  o.kv('m_zones.size', zones.length);
  o.kv('m_maps.size', 1);
  o.kv('m_modifyDate', now);
  o.kv('m_loopDecayEnabled', 0);
  o.kv('m_loopDecayHi', f6(20));
  o.kv('m_loopDecayLo', f6(20));
  o.open('default_params');
  o.kv('m_bufferSize', 0);
  o.kv('m_buffer', '');
  o.close();
  o.open('samplib_attrs');
  for (const [k, v] of [['m_decay', 5], ['m_release', 30], ['m_monoMode', 0], ['m_dynamics', 0], ['m_velAmpl', 1], ['m_velTimbre', 1],
    ['m_octaveShift', 0], ['m_atkVelocityAmount', 0], ['m_ne3SlowAttackMode', 0], ['m_fltSlope', 0], ['m_phaseVar', 0], ['m_rndStart', 0],
    ['m_fltKBT', 1], ['m_voiceMode', 0]] as const) o.kv(k, v);
  o.close();
  o.kv('m_categoryCategory', p.category > 0 ? p.category : USER_CATEGORY);
  for (const [k, v] of [['m_categorySubCategory', 0], ['m_categoryTimbre', 0], ['m_categoryEnvelope', 0], ['m_categoryMotion', 1],
    ['m_categoryProduction', 'Production'], ['m_categoryOrigin', 'Origin'], ['m_categoryDynamicsEnable', 0]] as const) o.kv(k, v);
  for (const [k, v] of ZONE_DEFAULTS.slice(5, 15)) o.kv(k, v); // the instrument's own low cut and two mid bands
  zones.forEach((z, i) => {
    o.open('instrument_zone');
    o.kv('m_zoneId', zoneId(i));
    o.kv('m_strokes.size', z.takes.length);
    o.kv('m_modifyDate', now);
    for (const t of z.takes) {
      o.open('instrument_stroke');
      o.kv('m_globalID', strokeIds.get(t)!);
      o.kv('m_modifyDate', now);
      o.close();
    }
    o.close();
  });

  o.open('map_info');
  o.kv('m_id', 0);
  o.kv('m_name', 'Map');
  o.kv('m_gain', f6(1));
  o.kv('m_detune', 0);
  o.kv('m_files.size', clips.size);
  o.kv('m_notes.size', NOTE_INFO_LAST - NOTE_INFO_FIRST + 1);
  o.kv('m_zones.size', zones.length);
  o.kv('m_modifyDate', now);
  for (let k = 0; k < 8; k++) o.kv(`m_macroSpinCtrlVal[${k}]`, f6(1));
  o.kv('m_normalize', 0);
  o.kv('m_emphasisMode', 0);
  for (const c of clips.values()) {
    o.open('map_audiofile');
    o.kv('m_id', c.fileId);
    o.kv('m_isEnabled', 1);
    o.kv('m_modifyDate', now);
    o.close();
  }
  for (let n = NOTE_INFO_FIRST; n <= NOTE_INFO_LAST; n++) {
    o.open('note_info');
    o.kv('m_no', n);
    o.kv('m_gain', f6(1));
    o.kv('m_detune', 0);
    o.kv('m_modifyDate', now);
    o.close();
  }
  zones.forEach((z, i) => {
    const playing = takeOf(z, z.layers[0]);
    o.open('map_zone');
    o.kv('m_zoneId', zoneId(i));
    o.kv('m_rootKey', z.rootKey);
    o.kv('m_isEnabled', 1);
    o.kv('m_btmNote', z.keyLow);
    o.kv('m_topNote', z.keyHigh);
    o.kv('m_zoneMode', 0);
    o.kv('m_zonePlayback', 0);
    o.kv('m_isOneShot', 0);
    for (const [k, v] of ZONE_DEFAULTS) o.kv(k, v);
    o.kv('m_strokes.size', z.takes.length);
    o.kv('m_modifyDate', now);
    for (const t of z.takes) {
      o.open('map_stroke');
      o.kv('m_globalID', strokeIds.get(t)!);
      o.kv('m_isEnabled', t === playing ? 1 : 0);
      o.kv('m_gain', f6(10 ** (t.gainDb / 20)));
      o.kv('m_detune', Math.round(t.tuneCents));
      o.kv('m_relStrength', 1);
      o.kv('m_relStrengthEdited', 0);
      o.kv('m_relStrengthTop', 16384);
      o.kv('m_relStrengthTopEdited', 0);
      o.kv('m_velocityMin', 0);
      o.kv('m_velocityMax', 127);
      o.kv('m_attackLen', f6(0));
      o.kv('m_modifyDate', now);
      o.close();
    }
    o.close();
  });
  o.close(); // map_info
  o.close(); // instrument
  o.close(); // SMACEditorProject

  const wavs = new Map<string, Uint8Array>();
  for (const c of clips.values()) wavs.set(c.fileName, encodeWav(c.audio.channels, c.audio.sampleRate));
  return { projectText: o.text(), wavs };
}

/** The project and its WAVs in one zip, side by side so the editor finds them once unzipped. */
export function zipNsmpproj(projectFileName: string, written: ReturnType<typeof writeNsmpproj>): Uint8Array {
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = { [projectFileName]: strToU8(written.projectText) };
  for (const [name, bytes] of written.wavs) files[name] = [bytes, { level: 0 }]; // audio barely compresses
  return zipSync(files);
}
