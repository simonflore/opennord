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

export interface FolderLibrary {
  /** Connected folder name, or null when none. */
  folderName: string | null;
  /** Latest scan results (programs/samples/errors). */
  result: ScanResult;
  /** A saved folder needs its permission re-granted (show a reconnect banner). */
  needsReconnect: boolean;
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
    try {
      const r = await pickFolder();
      setFolderName(r.name);
      setHandle(r.handle ?? null);
      setPending(null);
      setResult(scan(r.files, r.errors));
    } catch {
      /* user cancelled — leave state untouched */
    } finally {
      setBusy(false);
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await grantAndScan(pending);
      if (res) {
        setHandle(pending);
        setPending(null);
        setResult(scan(res.files, res.errors));
      }
    } finally {
      setBusy(false);
    }
  }, [pending]);

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
    await forgetFolder();
    setHandle(null);
    setPending(null);
    setFolderName(null);
    setResult(EMPTY);
  }, []);

  return {
    folderName,
    result,
    needsReconnect: pending !== null,
    busy,
    canPersist: supportsPersistentFolders(),
    choose,
    reconnect,
    refresh,
    forget,
  };
}
