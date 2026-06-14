/**
 * The NSM `.ns4b` backup format — partition ↔ folder/extension mapping, zip paths,
 * and the meta.xml header. Pure; no device or zip dependency. Derived from a real
 * NSM backup (see the Slice 3 spec).
 */

export interface PartitionSpec {
  partition: number;
  folder: string;
  ext: string;
  bankLabel: (bank: number) => string;
}

const letterBank = (b: number): string => `Bank ${'ABCDEFGH'[b] ?? String(b + 1)}`;
const numberBank = (b: number): string => `Bank ${b + 1}`;

/** The six user partitions OpenNord backs up (factory partitions excluded). */
export const USER_PARTITIONS: PartitionSpec[] = [
  { partition: 6, folder: 'Program', ext: 'ns4p', bankLabel: letterBank },
  { partition: 7, folder: 'Organ Preset', ext: 'ns4o', bankLabel: numberBank },
  { partition: 8, folder: 'Piano Preset', ext: 'ns4n', bankLabel: numberBank },
  { partition: 9, folder: 'Synth Preset', ext: 'ns4y', bankLabel: numberBank },
  { partition: 10, folder: 'Live', ext: 'ns4l', bankLabel: numberBank },
  { partition: 11, folder: 'Settings', ext: 'ns4t', bankLabel: numberBank },
];

const EXT_TO_PARTITION: Record<string, number> = {
  ns4p: 6, ns4o: 7, ns4n: 8, ns4y: 9, ns4l: 10, ns4t: 11,
};

/** Partition for a zip entry path, by extension. null = factory (npno/nsmp4) or non-file → skip. */
export function partitionForPath(path: string): number | null {
  const ext = path.toLowerCase().replace(/^.*\./, '');
  return EXT_TO_PARTITION[ext] ?? null;
}

/** Zip path for a backed-up file: `<Folder>/Bank <X>/<name>.<ext>`. */
export function backupPath(spec: PartitionSpec, bank: number, name: string): string {
  return `${spec.folder}/${spec.bankLabel(bank)}/${name}.${spec.ext}`;
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
