/**
 * Sample Inspector view-model — pure derivations from the decoded .nsmp layer to
 * display data. No DOM, no audio. Reused by the Sample Inspector components.
 */
import type { NsmpFile } from './nsmp';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** MIDI note number → scientific name (C4 = 60, A0 = 21, C-1 = 0). */
export function noteName(midi: number): string {
  const n = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${n}${Math.floor(midi / 12) - 1}`;
}

export interface SampleHeaderView {
  name: string;
  /** ".nsmp3" / ".nsmp4" / "—". */
  codecLabel: string;
  version: string;
  checksumOk: boolean;
  strokeCount: number;
  sizeBytes: number;
  isFactory: boolean;
}

export function sampleHeaderView(file: NsmpFile, sizeBytes: number): SampleHeaderView {
  return {
    name: file.name ?? 'Unnamed',
    codecLabel: file.codec ? `.nsmp${file.codec}` : '—',
    version: file.version ?? '—',
    checksumOk: file.checksumValid,
    strokeCount: file.strokeCount,
    sizeBytes,
    isFactory: file.suspectedFactory,
  };
}
