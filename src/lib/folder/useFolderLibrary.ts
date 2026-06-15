import { useCallback, useEffect, useState } from 'react';
import {
  pickFolder, restoreFolder, rescan, grantAndScan, forgetFolder,
  supportsPersistentFolders,
} from './access';
import { scanFiles, type RawFile, type ScanError, type ScanResult } from './scan';

const EMPTY: ScanResult = { programs: [], samples: [], errors: [] };

/** Scan files and fold the access-layer read errors in with the parse errors. */
function scan(files: RawFile[], readErrors: ScanError[]): ScanResult {
  const r = scanFiles(files);
  return { ...r, errors: [...readErrors, ...r.errors] };
}

/** A user dismissing the folder picker is not an error worth surfacing. */
function isCancel(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel|no folder chosen|aborted/i.test(msg);
}

/** Turn a real (non-cancel) failure into a visible one-line note. */
function noticeResult(err: unknown): ScanResult {
  return { programs: [], samples: [], errors: [{ path: '(folder)', reason: err instanceof Error ? err.message : String(err) }] };
}

export interface FolderLibrary {
  /** Connected folder name, or null when none. */
  folderName: string | null;
  /** Latest scan results (programs/samples/errors). */
  result: ScanResult;
  /** A saved folder needs its permission re-granted (show a reconnect banner). */
  needsReconnect: boolean;
  /** Set when a reconnect attempt was denied/blocked — shown in the banner. */
  reconnectError: string | null;
  /** True while a pick/scan is in flight. */
  busy: boolean;
  /** Whether this browser keeps the folder across reloads. */
  canPersist: boolean;
  /** Prompt for a folder and scan it. */
  choose: () => Promise<void>;
  /** Re-request permission for a saved folder, then scan. */
  reconnect: () => Promise<void>;
  /** Re-scan the current folder (manual refresh). FSA only. */
  refresh: () => Promise<void>;
  /** Forget the folder and clear results. */
  forget: () => Promise<void>;
}

export function useFolderLibrary(): FolderLibrary {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult>(EMPTY);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [pending, setPending] = useState<FileSystemDirectoryHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);

  // Restore a saved folder on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await restoreFolder();
      if (cancelled) return;
      if (state.status === 'granted') {
        setFolderName(state.name);
        setResult(scan(state.files, state.errors));
      } else if (state.status === 'needs-permission') {
        setFolderName(state.name);
        setPending(state.handle);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const choose = useCallback(async () => {
    setBusy(true);
    setReconnectError(null);
    try {
      const r = await pickFolder();
      setFolderName(r.name);
      setHandle(r.handle ?? null);
      setPending(null);
      setResult(scan(r.files, r.errors));
    } catch (err) {
      // Ignore the user dismissing the picker; surface anything real.
      if (!isCancel(err)) { console.error('Folder pick failed', err); setResult(noticeResult(err)); }
    } finally {
      setBusy(false);
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    setReconnectError(null);
    try {
      const res = await grantAndScan(pending);
      if (res) {
        setHandle(pending);
        setPending(null);
        setResult(scan(res.files, res.errors));
      } else {
        // Permission wasn't granted — say so rather than silently doing nothing.
        // Stay in the reconnect state so they can retry or Forget.
        setReconnectError(`Couldn't read “${folderName ?? 'the folder'}” — your browser blocked access. Click Reconnect and choose Allow, or Re-pick the folder.`);
      }
    } catch (err) {
      if (!isCancel(err)) { console.error('Folder reconnect failed', err); setReconnectError(err instanceof Error ? err.message : String(err)); }
    } finally {
      setBusy(false);
    }
  }, [pending, folderName]);

  const refresh = useCallback(async () => {
    if (!handle) return;
    setBusy(true);
    try {
      const { files, errors } = await rescan(handle);
      setResult(scan(files, errors));
    } finally {
      setBusy(false);
    }
  }, [handle]);

  const forget = useCallback(async () => {
    // Reset the UI first so Forget always responds instantly — it's the escape
    // hatch; never gate it on the IDB write completing.
    setHandle(null);
    setPending(null);
    setFolderName(null);
    setReconnectError(null);
    setResult(EMPTY);
    await forgetFolder();
  }, []);

  return {
    folderName,
    result,
    needsReconnect: pending !== null,
    reconnectError,
    busy,
    canPersist: supportsPersistentFolders(),
    choose,
    reconnect,
    refresh,
    forget,
  };
}
