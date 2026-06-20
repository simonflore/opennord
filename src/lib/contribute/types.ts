import type { NordFileInfo } from '../clavia/nord-file';

/** One read of a program: its identity + the header-stripped body we diff. */
export interface Capture {
  model: NordFileInfo;
  body: Uint8Array;
}

/** One labeled single-control change, baseline → after. */
export interface ContributionEntry {
  /** Display label (vocab item label, or free-form text). */
  label: string;
  /** Set when the label came from the model's curated vocab. */
  vocabId?: string;
  /** What the musician set it to, e.g. "min -> max". */
  valueNote: string;
  /** Body-relative byte ranges that moved. */
  ranges: Array<{ start: number; end: number }>;
  /** True when >1 range moved — likely more than one thing changed; not trusted. */
  multiRegion: boolean;
  /** Full after-body, base64 (enables offline bit-level re-diff). */
  afterB64: string;
}

/** The downloadable contribution file. */
export interface ContributionBundle {
  schema: 'opennord.contribution/1';
  model: { name: string; pid: string; fileTag: string };
  tool: { version: string; capturedAt: string };
  baseline: { bodyLen: number; bodyB64: string };
  entries: ContributionEntry[];
}

/** A curated control name for a model's labeling dropdown. */
export interface ControlVocabItem {
  id: string;
  label: string;
  section: string;
}
