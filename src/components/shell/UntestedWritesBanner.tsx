import { useEffect, useState } from 'react';
import { UNTESTED_WRITES_EVENT, UNTESTED_WRITES_KEY, untestedWritesAllowed, type LibraryKind } from '@/lib/device/write-guard';

/**
 * The warning shown while untested sample or piano writes are switched on
 * (/dev/hardware). Pure: `kinds` empty renders nothing.
 */
export function UntestedWritesNotice({ kinds }: { kinds: LibraryKind[] }) {
  if (!kinds.length) return null;
  const what = kinds.map((k) => `${k}s`).join(' and ');
  return (
    <p role="status" className="border-b border-warn bg-sink px-4 py-2 text-sm text-warn">
      <strong>Untested writes are ON</strong> for {what} on this computer: Send to Nord and Restore can write them to
      the Nord, and Restore removes the Nord’s copies it replaces. Turn them off on{' '}
      <a className="underline" href="#/dev/hardware">/dev/hardware</a>.
    </p>
  );
}

/**
 * App-wide: the notice, following the switch as it changes (in this tab via
 * {@link UNTESTED_WRITES_EVENT}, in another tab via `storage`). A production build
 * never reads the switch (`untestedWritesAllowed` fails closed), so it never shows.
 */
export function UntestedWritesBanner() {
  const [kinds, setKinds] = useState<LibraryKind[]>(() => untestedWritesAllowed());
  useEffect(() => {
    const update = () => setKinds(untestedWritesAllowed());
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === UNTESTED_WRITES_KEY) update(); };
    window.addEventListener(UNTESTED_WRITES_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(UNTESTED_WRITES_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return <UntestedWritesNotice kinds={kinds} />;
}
