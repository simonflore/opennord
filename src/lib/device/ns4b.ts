/**
 * The NSM `.ns4b` backup format — partition ↔ folder/extension mapping, zip paths,
 * and the meta.xml header. Pure; no device or zip dependency. Derived from a real
 * NSM backup (see the Slice 3 spec).
 */
import type { LibraryKind } from './write-guard';

export interface PartitionSpec {
  partition: number;
  /** The top folder: the device's partition name, as NSM writes it. */
  folder: string;
  ext: string;
  /** Bank folder when the device's bank names aren't read (libraries use those). */
  bankLabel: (bank: number) => string;
  /** Set on the sample and piano libraries. */
  library?: LibraryKind;
}

const letterBank = (b: number): string => `Bank ${'ABCDEFGH'[b] ?? String(b + 1)}`;
const numberBank = (b: number): string => `Bank ${b + 1}`;

/**
 * The user Piano and Sample libraries. NSM backs both up in full, factory files
 * included (NSM registers them all; there is no
 * factory filter), as `<partition name>/<bank name>/<name>.<ext>`.
 */
export const LIBRARY_SPECS: PartitionSpec[] = [
  { partition: 1, folder: 'Piano', ext: 'npno', bankLabel: numberBank, library: 'piano' },
  { partition: 5, folder: 'Samp Lib', ext: 'nsmp4', bankLabel: numberBank, library: 'sample' },
];

/**
 * Programs, presets, Live and Settings: every user partition but the libraries. Small
 * enough to read in moments, so the safety backup before a reorganize reads these only.
 */
export const NON_LIBRARY_PARTITIONS: PartitionSpec[] = [
  { partition: 6, folder: 'Program', ext: 'ns4p', bankLabel: letterBank },
  { partition: 7, folder: 'Organ Preset', ext: 'ns4o', bankLabel: numberBank },
  { partition: 8, folder: 'Piano Preset', ext: 'ns4n', bankLabel: numberBank },
  { partition: 9, folder: 'Synth Preset', ext: 'ns4y', bankLabel: numberBank },
  { partition: 10, folder: 'Live', ext: 'ns4l', bankLabel: numberBank },
  { partition: 11, folder: 'Settings', ext: 'ns4t', bankLabel: numberBank },
];

/** The user partitions OpenNord backs up (the Native factory partitions and the Pedal library excluded, as NSM does). */
export const USER_PARTITIONS: PartitionSpec[] = [...NON_LIBRARY_PARTITIONS, ...LIBRARY_SPECS];

const EXT_TO_PARTITION: Record<string, number> = {
  ns4p: 6, ns4o: 7, ns4n: 8, ns4y: 9, ns4l: 10, ns4t: 11, npno: 1, nsmp4: 5,
};

/** The library a partition holds, or null for programs, presets, Live and Settings. */
export function libraryForPartition(partition: number): LibraryKind | null {
  return LIBRARY_SPECS.find((s) => s.partition === partition)?.library ?? null;
}

/**
 * Partition for a zip entry path, by the FILE's extension. null = an unknown extension
 * or a dotless name → skip. Parses the basename first so a dot inside a folder name
 * (e.g. "Samp Lib/Pad.1/x.ns4p") can't be mistaken for the extension.
 */
export function partitionForPath(path: string): number | null {
  const filename = path.replace(/^.*\//, '');
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return null;
  return EXT_TO_PARTITION[filename.slice(dot + 1).toLowerCase()] ?? null;
}

/** A backed-up file's name on the Nord: its zip path without the folders or the extension. */
export function nameFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
}

/**
 * Zip path for a backed-up file: `<Folder>/Bank <X>/<name>.<ext>`. A slash in the
 * name becomes `_`, as bank folders' do, so the file stays in its bank folder and
 * {@link nameFromPath} (which splits on "/" only) reads back the name stored. Only that
 * one: a restore matches the Nord's files by name, so any other character changed here
 * (a backslash included) would be written back under a new name (and the Nord's copy removed).
 */
export function backupPath(spec: PartitionSpec, bank: number, name: string): string {
  return `${spec.folder}/${spec.bankLabel(bank)}/${name.replace(/\//g, '_')}.${spec.ext}`;
}

/**
 * The zip path for a file, suffixing ` (slot N)` only when the plain `<name>` path is
 * already `taken` — two files can share a name within a bank (the slot differentiates
 * them), so this keeps both instead of silently overwriting. Shared by the device
 * backup writer and the offline organizer's re-serializer.
 */
export function disambiguatePath(
  spec: PartitionSpec, bank: number, name: string, slot: number, taken: (path: string) => boolean,
): string {
  const path = backupPath(spec, bank, name);
  return taken(path) ? backupPath(spec, bank, `${name} (slot ${slot})`) : path;
}

/** The root meta.xml (NSM-compatible attributes; product_content_version is the device's). */
export function buildMetaXml(contentVersion: number): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<backup file_version="1" backup_format_version="1" product_id="46" ' +
    'product_version="154" product_build="2888" ' +
    `product_content_version="${contentVersion}" manager_version="916" manager_build="1422"/>\n`
  );
}
