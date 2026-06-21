import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pickFolder, restoreFolder, rescan, grantAndScan, forgetFolder, supportsPersistentFolders,
} from './access';
import { type Scanner, type ScanBatch, type BundleDescriptor } from './pipeline';
import { createScanner } from './scanner';
import { loadBundleChoice, saveBundleChoice, clearBundleChoice } from './bundlePrefs';
import type { FolderSource } from './source';
import type { ScanResult } from './scan';

const EMPTY: ScanResult = { programs: [], samples: [], errors: [] };

/** A user dismissing the folder picker is not an error worth surfacing. */
function isCancel(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel|no folder chosen|aborted/i.test(msg);
}

export interface FolderLibrary {
  /** Connected folder name, or null when none. */
  folderName: string | null;
  /** Latest scan results (programs/samples/errors), built up progressively. */
  result: ScanResult;
  /** All `.ns4b` backups detected in the folder. */
  bundles: BundleDescriptor[];
  /** Backups not yet decided (neither loaded nor skipped) — drive the picker/banner. */
  newBundles: BundleDescriptor[];
  /** Whether the multi-bundle picker is showing. */
  pickerOpen: boolean;
  /** A saved folder needs its permission re-granted (show a reconnect banner). */
  needsReconnect: boolean;
  /** Set when a reconnect attempt was denied/blocked — shown in the banner. */
  reconnectError: string | null;
  /** True while a pick/scan is in flight. */
  busy: boolean;
  /** Whether this browser keeps the folder across reloads. */
  canPersist: boolean;
  choose: () => Promise<void>;
  reconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  forget: () => Promise<void>;
  openBundlePicker: () => void;
  closeBundlePicker: () => void;
  /** Load the chosen backups (the rest are remembered as skipped), then close the picker. */
  applyBundleSelection: (loadPaths: string[]) => Promise<void>;
}

export function useFolderLibrary(makeScanner: () => Scanner = createScanner): FolderLibrary {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult>(EMPTY);
  const [bundles, setBundles] = useState<BundleDescriptor[]>([]);
  const [newBundles, setNewBundles] = useState<BundleDescriptor[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [pending, setPending] = useState<FileSystemDirectoryHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);

  const scannerRef = useRef<Scanner | null>(null);
  const genRef = useRef(0); // generation token: ignore batches from a superseded scan

  const append = useCallback((gen: number) => (b: ScanBatch) => {
    if (gen !== genRef.current) return;
    setResult((r) => ({
      programs: [...r.programs, ...b.programs],
      samples: [...r.samples, ...b.samples],
      errors: [...r.errors, ...b.errors],
    }));
  }, []);

  /** Run Pass A on a source, then apply remembered choices / open the gate. */
  const runScan = useCallback(async (name: string, source: FolderSource) => {
    const gen = ++genRef.current;
    scannerRef.current?.dispose?.();
    const scanner = makeScanner();
    scannerRef.current = scanner;
    setResult(EMPTY); setBundles([]); setNewBundles([]); setPickerOpen(false);
    const onBatch = append(gen);

    const found = await scanner.scanLoose(source, onBatch);
    if (gen !== genRef.current) return;
    setBundles(found);

    const choice = await loadBundleChoice(name);
    if (gen !== genRef.current) return;
    const decided = new Set(choice?.decided ?? []);
    const skipped = new Set(choice?.skipped ?? []);
    const undecided = found.filter((b) => !decided.has(b.path) && !skipped.has(b.path));
    setNewBundles(undecided);

    // Re-apply remembered "load" choices silently.
    const toReload = found.filter((b) => decided.has(b.path)).map((b) => b.path);
    if (toReload.length > 0) await scanner.expandBundles(toReload, onBatch);
    if (gen !== genRef.current) return;

    if (undecided.length >= 2) {
      setPickerOpen(true);
    } else if (undecided.length === 1 && !choice) {
      // First sight of this folder, single backup → auto-expand and remember.
      const only = undecided[0].path;
      await scanner.expandBundles([only], onBatch);
      await saveBundleChoice({ folderName: name, decided: [only], skipped: [] });
      if (gen !== genRef.current) return;
      setNewBundles([]);
    }
  }, [append, makeScanner]);

  // Restore a saved folder on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await restoreFolder();
      if (cancelled) return;
      if (state.status === 'granted') {
        setFolderName(state.name); setHandle(state.handle);
        await runScan(state.name, state.source);
      } else if (state.status === 'needs-permission') {
        setFolderName(state.name); setPending(state.handle);
      }
    })();
    return () => { cancelled = true; };
  }, [runScan]);

  const choose = useCallback(async () => {
    setBusy(true); setReconnectError(null);
    try {
      const r = await pickFolder();
      setFolderName(r.name); setHandle(r.handle ?? null); setPending(null);
      await runScan(r.name, r.source);
    } catch (err) {
      if (!isCancel(err)) {
        console.error('Folder pick failed', err);
        setResult({ programs: [], samples: [], errors: [{ path: '(folder)', reason: err instanceof Error ? err.message : String(err) }] });
      }
    } finally { setBusy(false); }
  }, [runScan]);

  const reconnect = useCallback(async () => {
    if (!pending) return;
    setBusy(true); setReconnectError(null);
    try {
      const source = await grantAndScan(pending);
      if (source) {
        setHandle(pending); setPending(null);
        await runScan(folderName ?? pending.name, source);
      } else {
        // Permission wasn't granted — say so rather than silently doing nothing.
        setReconnectError(`Couldn't read “${folderName ?? 'the folder'}” — your browser blocked access. Click Reconnect and choose Allow, or Re-pick the folder.`);
      }
    } catch (err) {
      if (!isCancel(err)) { console.error('Folder reconnect failed', err); setReconnectError(err instanceof Error ? err.message : String(err)); }
    } finally { setBusy(false); }
  }, [pending, folderName, runScan]);

  const refresh = useCallback(async () => {
    if (!handle || !folderName) return;
    setBusy(true);
    try { await runScan(folderName, rescan(handle)); } finally { setBusy(false); }
  }, [handle, folderName, runScan]);

  const forget = useCallback(async () => {
    // Reset the UI first so Forget always responds instantly — it's the escape
    // hatch; never gate it on the IDB write completing.
    genRef.current++; // abandon in-flight batches
    setHandle(null); setPending(null); setFolderName(null); setReconnectError(null);
    setResult(EMPTY); setBundles([]); setNewBundles([]); setPickerOpen(false);
    await forgetFolder(); await clearBundleChoice();
  }, []);

  const openBundlePicker = useCallback(() => setPickerOpen(true), []);
  const closeBundlePicker = useCallback(() => setPickerOpen(false), []);

  const applyBundleSelection = useCallback(async (loadPaths: string[]) => {
    const scanner = scannerRef.current;
    if (!scanner || !folderName) { setPickerOpen(false); return; }
    const gen = genRef.current;
    const load = newBundles.filter((b) => loadPaths.includes(b.path)).map((b) => b.path);
    const skip = newBundles.filter((b) => !loadPaths.includes(b.path)).map((b) => b.path);
    const prior = await loadBundleChoice(folderName);
    await saveBundleChoice({
      folderName,
      decided: [...new Set([...(prior?.decided ?? []), ...load])],
      skipped: [...new Set([...(prior?.skipped ?? []), ...skip])],
    });
    setPickerOpen(false); setNewBundles([]);
    await scanner.expandBundles(load, append(gen));
  }, [folderName, newBundles, append]);

  return {
    folderName, result, bundles, newBundles, pickerOpen,
    needsReconnect: pending !== null, reconnectError, busy,
    canPersist: supportsPersistentFolders(),
    choose, reconnect, refresh, forget,
    openBundlePicker, closeBundlePicker, applyBundleSelection,
  };
}
