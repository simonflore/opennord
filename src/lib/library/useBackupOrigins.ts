import { useEffect, useRef, useState } from 'react';
import type { BackupRef } from '@/lib/clavia/backup/backup-index';
import { extractZipEntryHead } from '@/lib/clavia/backup/zip-directory';
import { nsmpHeadFactory, NSMP_FACTORY_HEAD_BYTES } from '@/lib/ns4/nsmp';

const idOf = (ref: BackupRef) => `backup:${ref.bundlePath}!${ref.entry.path}`;

/** Lazily resolve factory-vs-user for backup refs by reading each file's head
 *  (a tiny ranged read, never the GB audio) and checking the structural flag.
 *  Returns id→factory, filling in as resolves complete; unknown ids stay absent. */
export function useBackupOrigins(
  refs: BackupRef[],
  openBundle: (path: string) => Promise<File>,
): ReadonlyMap<string, boolean> {
  const [origins, setOrigins] = useState<ReadonlyMap<string, boolean>>(new Map());
  const started = useRef(new Set<string>());
  const key = refs.map(idOf).join('\n');
  useEffect(() => {
    let cancelled = false;
    const files = new Map<string, Promise<File>>();
    (async () => {
      for (const ref of refs) {
        const id = idOf(ref);
        if (started.current.has(id)) continue;
        started.current.add(id);
        try {
          let fp = files.get(ref.bundlePath);
          if (!fp) { fp = openBundle(ref.bundlePath); files.set(ref.bundlePath, fp); }
          const factory = nsmpHeadFactory(await extractZipEntryHead(await fp, ref.entry, NSMP_FACTORY_HEAD_BYTES));
          if (factory !== undefined && !cancelled) setOrigins((m) => new Map(m).set(id, factory));
        } catch { started.current.delete(id); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, openBundle]);
  return origins;
}
