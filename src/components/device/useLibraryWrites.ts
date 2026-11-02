import { useEffect, useState } from 'react';
import { UNTESTED_WRITES_EVENT, UNTESTED_WRITES_KEY, libraryWritesNow, type LibraryKind } from '@/lib/device/write-guard';

/**
 * The sample and piano gate ({@link libraryWritesNow}), re-read when the /dev/hardware
 * switch changes: in this tab via {@link UNTESTED_WRITES_EVENT}, in another via
 * `storage`, as the untested-writes banner follows it. Anything that renders a
 * refusal from the gate reads it here, so the refusal follows the switch.
 */
export function useLibraryWrites(): Record<LibraryKind, boolean> {
  const [writes, setWrites] = useState(libraryWritesNow);
  useEffect(() => {
    const update = () => setWrites(libraryWritesNow());
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === UNTESTED_WRITES_KEY) update(); };
    window.addEventListener(UNTESTED_WRITES_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(UNTESTED_WRITES_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return writes;
}
