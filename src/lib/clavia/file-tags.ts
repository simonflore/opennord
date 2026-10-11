/**
 * Every Nord file type by its tag — what kind of file it is and which models
 * write it, in a musician's words. CBIN files carry the tag at 0x08 (cbin.ts);
 * bundles and backups are ZIP files named by their extension.
 *
 * Source: the file specs Nord Sound Manager 9.22 registers per product (each
 * product constructor's `CFileType` / `CFileExtension` / `CBundleInfo` list,
 * e.g. `CElectro7` @0x100095dd4, `CMini` @0x1000df1a8), cross-checked against
 * the partitions each instrument's firmware registers (partitions.ts). Where
 * NSM leaves a kind unnamed (Stage 4 `ns4g`) the kind stays `unknown`.
 *
 * A Live slot stores the program record verbatim (real files: `.ns2l` and
 * `.ns2p` are both 547 bytes legacy, `.ns3l` and `.ns3f` both 592 NSM-era), so a
 * Live entry names its model's program tag; formats.ts reads a Live file with
 * the program reader when its record has the program record's length.
 * Settings, Song and Set List bodies are not mapped: those files are
 * identified, never decoded. Data only; clavia never imports a model.
 */
import type { NordModelId } from './partitions';

export type NordFileKind =
  | 'program' | 'performance' | 'live'
  | 'synth-preset' | 'organ-preset' | 'piano-preset'
  | 'song' | 'setlist' | 'settings'
  | 'synth-waves' | 'sample' | 'ram-data'
  | 'bundle' | 'backup'
  | 'unknown';

/** What a musician calls each kind of file. */
export const FILE_KIND_LABEL: Record<NordFileKind, string> = {
  program: 'Program',
  performance: 'Performance',
  live: 'Live',
  'synth-preset': 'Synth preset',
  'organ-preset': 'Organ preset',
  'piano-preset': 'Piano preset',
  song: 'Song',
  setlist: 'Set List',
  settings: 'Settings',
  'synth-waves': 'Synth waves',
  sample: 'Sample',
  'ram-data': 'Wave RAM data',
  bundle: 'Bundle',
  backup: 'Backup',
  unknown: 'Nord file',
};

export interface FileTagInfo {
  /** The CBIN tag, or the extension of a ZIP bundle / backup. */
  readonly tag: string;
  readonly kind: NordFileKind;
  /** Models that write it; the first is the anchor (as for `modelByTag`). */
  readonly models: readonly NordModelId[];
  /** Musician-facing name when the kind's own label is not specific enough (bundles). */
  readonly label?: string;
  /** A CBIN file (tag at 0x08) or a ZIP archive (named by extension). */
  readonly container: 'cbin' | 'zip';
  /** For a Live file: the program tag whose record it stores. */
  readonly program?: string;
}

type Row = readonly [tag: string, kind: NordFileKind, extra?: { label?: string; program?: string; models?: readonly NordModelId[] }];

const ZIP_KINDS: ReadonlySet<NordFileKind> = new Set(['bundle', 'backup']);

function family(models: readonly NordModelId[], rows: readonly Row[]): FileTagInfo[] {
  return rows.map(([tag, kind, extra]) => ({
    tag, kind, models: extra?.models ?? models, container: ZIP_KINDS.has(kind) ? 'zip' : 'cbin',
    ...(extra?.label && { label: extra.label }), ...(extra?.program && { program: extra.program }),
  }));
}

const PROGRAM_BUNDLE = { label: 'Program bundle' };

/** Every tag, grouped by the models that write it. */
export const FILE_TAGS: readonly FileTagInfo[] = [
  ...family(['stage-classic', 'stage-ex'], [
    ['nspg', 'program'], ['nss', 'synth-preset'], ['nsb', 'backup'],
  ]),
  ...family(['stage-2', 'stage-2-ex'], [
    ['ns2p', 'program'], ['ns2s', 'synth-preset'], ['ns2l', 'live', { program: 'ns2p' }], ['ns2y', 'settings'],
    ['ns2pb', 'bundle', PROGRAM_BUNDLE], ['ns2synthpb', 'bundle', { label: 'Synth bundle' }],
    ['ns2b', 'backup'], ['ns2exb', 'backup', { models: ['stage-2-ex'] }],
  ]),
  ...family(['stage-3'], [
    ['ns3f', 'program'], ['ns3s', 'song'], ['ns3y', 'synth-preset'], ['ns3l', 'live', { program: 'ns3f' }],
    ['ns3t', 'settings'], ['ns3b', 'backup'],
  ]),
  ...family(['stage-4'], [
    ['ns4p', 'program'], ['ns4y', 'synth-preset'], ['ns4o', 'organ-preset'], ['ns4n', 'piano-preset'],
    ['ns4l', 'live', { program: 'ns4p' }], ['ns4t', 'settings'], ['ns4g', 'unknown'], ['ns4b', 'backup'],
  ]),
  ...family(['electro-3', 'electro-3-hp'], [
    ['nepg', 'program'], ['neli', 'live', { program: 'nepg' }], ['nesy', 'settings'], ['neop', 'organ-preset'],
    ['neb', 'backup'],
  ]),
  ...family(['electro-4'], [
    ['ne4p', 'program'], ['ne4l', 'live', { program: 'ne4p' }], ['ne4s', 'settings'], ['ne4pb', 'bundle', PROGRAM_BUNDLE],
    ['ne4b', 'backup'], ['ne4db', 'backup'],
  ]),
  ...family(['electro-5'], [
    ['ne5p', 'program'], ['ne5t', 'setlist'], ['ne5l', 'live', { program: 'ne5p' }], ['ne5s', 'settings'],
    ['ne5pbundle', 'bundle', PROGRAM_BUNDLE], ['ne5tbundle', 'bundle', { label: 'Set List bundle' }], ['ne5b', 'backup'],
  ]),
  ...family(['electro-6'], [
    ['ne6p', 'program'], ['ne6l', 'live', { program: 'ne6p' }], ['ne6t', 'settings'],
    ['ne6pbundle', 'bundle', PROGRAM_BUNDLE], ['ne6b', 'backup'],
  ]),
  ...family(['electro-7'], [
    ['ne7p', 'program'], ['ne7l', 'live', { program: 'ne7p' }], ['ne7s', 'song'], ['ne7t', 'settings'],
    ['ne7r', 'synth-preset'], ['ne7pbundle', 'bundle', PROGRAM_BUNDLE], ['ne7sbundle', 'bundle', { label: 'Song bundle' }],
    ['ne7rbundle', 'bundle', { label: 'Synth preset bundle' }], ['ne7b', 'backup'],
  ]),
  ...family(['piano-1'], [
    ['nppg', 'program'], ['npli', 'live', { program: 'nppg' }], ['npsy', 'settings'], ['npb', 'backup'],
  ]),
  ...family(['piano-2'], [
    ['np2p', 'program'], ['np2l', 'live', { program: 'np2p' }], ['np2s', 'settings'], ['np2pb', 'bundle', PROGRAM_BUNDLE],
    ['np2b', 'backup'],
  ]),
  ...family(['piano-3'], [
    ['np3p', 'program'], ['np3l', 'live', { program: 'np3p' }], ['np3s', 'settings'],
    ['np3pbundle', 'bundle', PROGRAM_BUNDLE], ['np3b', 'backup'],
  ]),
  ...(['4', '5', '6'] as const).flatMap((n) => family([`piano-${n}`], [
    [`np${n}p`, 'program'], [`np${n}l`, 'live', { program: `np${n}p` }], [`np${n}t`, 'settings'],
    [`np${n}pbundle`, 'bundle', PROGRAM_BUNDLE], [`np${n}b`, 'backup'],
  ])),
  ...family(['grand'], [
    ['ngp', 'program'], ['ngl', 'live', { program: 'ngp' }], ['ngs', 'settings'],
    ['ngpbundle', 'bundle', PROGRAM_BUNDLE], ['ngb', 'backup'],
  ]),
  ...family(['grand-2'], [
    ['ng2p', 'program'], ['ng2l', 'live', { program: 'ng2p' }], ['ng2t', 'settings'],
    ['ng2pbundle', 'bundle', PROGRAM_BUNDLE], ['ng2b', 'backup'],
  ]),
  ...family(['organ-3'], [
    ['no3p', 'program'], ['no3l', 'live', { program: 'no3p' }], ['no3t', 'settings'],
    ['no3pbundle', 'bundle', PROGRAM_BUNDLE], ['no3b', 'backup'],
  ]),
  ...family(['c2'], [
    ['ncpg', 'program'], ['ncli', 'live', { program: 'ncpg' }], ['ncsy', 'settings'], ['ncb', 'backup'],
  ]),
  // The C2D's firmware registers no Live partition; NSM still lists `nc2l`.
  ...family(['c2d'], [
    ['nc2p', 'program'], ['nc2l', 'live', { program: 'nc2p' }], ['nc2s', 'settings'], ['nc2b', 'backup'],
  ]),
  ...family(['wave'], [
    ['nwp', 'program'], ['nws', 'synth-waves'], ['nwr', 'ram-data'], ['nwsy', 'settings'], ['nwi', 'sample'],
    ['nwb', 'backup'],
  ]),
  ...family(['wave-2'], [
    ['nw2p', 'program'], ['nw2l', 'live', { program: 'nw2p' }], ['nw2s', 'settings'],
    ['nw2pbundle', 'bundle', PROGRAM_BUNDLE], ['nw2b', 'backup'],
  ]),
  // The Leads: NSM's "Program" partition holds single sounds, "Performance" the 4-slot performances.
  ...family(['lead-4'], [
    ['nl4s', 'program'], ['nl4p', 'performance'], ['nl4t', 'settings'],
    ['nl4sbundle', 'bundle', PROGRAM_BUNDLE], ['nl4pbundle', 'bundle', { label: 'Performance bundle' }], ['nl4b', 'backup'],
  ]),
  ...family(['lead-a1'], [
    ['nlas', 'program'], ['nlap', 'performance'], ['nlat', 'settings'],
    ['nlasbundle', 'bundle', PROGRAM_BUNDLE], ['nlapbundle', 'bundle', { label: 'Performance bundle' }], ['nlab', 'backup'],
  ]),
];

const BY_TAG: ReadonlyMap<string, FileTagInfo> = new Map(FILE_TAGS.map((t) => [t.tag, t]));

/** The file type a CBIN tag or bundle/backup extension names (case-insensitive), or undefined. */
export function fileTagInfo(tag: string | undefined): FileTagInfo | undefined {
  return tag ? BY_TAG.get(tag.toLowerCase().replace(/^\./, '')) : undefined;
}

/** The musician-facing name of a file type, e.g. "Live", "Settings", "Program bundle". */
export function fileTagLabel(info: FileTagInfo | undefined): string {
  return info ? info.label ?? FILE_KIND_LABEL[info.kind] : FILE_KIND_LABEL.unknown;
}
