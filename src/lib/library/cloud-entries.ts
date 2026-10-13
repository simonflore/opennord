import type { CloudItem, CloudItemKind } from '../capabilities/types';
import { programNameFromFilename } from '../clavia/name';

/** A cloud entry is the file with that fingerprint: its id says so. */
export const cloudEntryId = (fingerprint: string): string => `cloud:${fingerprint}`;

/** What every cloud entry starts from. It comes with its fingerprint, which is what mergeBySound merges it by. */
export function cloudEntryBase(item: CloudItem) {
  return {
    id: cloudEntryId(item.fingerprint), name: programNameFromFilename(item.filename), source: 'cloud' as const,
    fingerprint: item.fingerprint, ...(item.slot ? { slot: item.slot } : {}),
  };
}

/** The items of one kind, one per file: a snapshot lists a file once per slot it is in, and its fingerprint is its id here. */
export function cloudItemsOf(items: CloudItem[], kind: CloudItemKind): CloudItem[] {
  const seen = new Set<string>();
  return items.filter((i) => i.kind === kind && !seen.has(i.fingerprint) && !!seen.add(i.fingerprint));
}

/** "Flute.NSMP4" → "nsmp4". */
export function extensionOf(filename: string): string | undefined {
  const m = /\.([A-Za-z0-9]+)$/.exec(filename);
  return m ? m[1].toLowerCase() : undefined;
}
