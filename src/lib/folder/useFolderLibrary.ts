import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pickFolder, restoreFolder, rescan, grantAndScan, forgetFolder, supportsPersistentFolders,
  fileFromHandle, requestWriteAccess, writeFileToDir, listDirNames,
} from './access';
import { resolveWriteName, type WriteResult } from './writeBack';
import { type Scanner, type ScanBatch, type BundleDescriptor } from './pipeline';
import { createScanner } from './scanner';
import { loadBundleChoice, saveBundleChoice, clearBundleChoice } from './bundlePrefs';
import type { FolderSource } from './source';
import type { ScanResult } from './scan';
import { getErrorMessage } from '../errors';

const emptyResult = (): ScanResult => ({ programs: [], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
const EMPTY = emptyResult();

/** A user dismissing the folder picker is not an error worth surfacing. */
function isCancel(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  return /cancel|no folder chosen|aborted/i.test(getErrorMessage(err));
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
  /** Open a folder-relative path as a File (e.g. to stream a `.ns4b`). Throws if no folder is connected. */
  openBundle: (path: string) => Promise<File>;
  /**
   * Write a file into the connected folder.  Escalates to readwrite on first call.
   * Returns `{target:'download'}` when no folder is connected or permission is denied;
   * otherwise writes the file, re-scans, and returns `{target:'folder', path}`.
   */
  writeBack: (
    name: string,
    write: (w: FileSystemWritableFileStream) => Promise<void>,
    opts: { mode: 'new' | 'overwrite' },
  ) => Promise<WriteResult>;
}

/** `r` with one scan batch added. */
function withBatch(r: ScanResult, b: ScanBatch): ScanResult {
  const next = { ...r, programs: [...r.programs], presets: [...r.presets], pianos: [...r.pianos], samples: [...r.samples],
    errors: [...r.errors], backupPianos: [...r.backupPianos], backupSamples: [...r.backupSamples] };
  addBatch(next, b);
  return next;
}
/** Add a scan batch to `r` in place (a result nothing renders yet). */
function addBatch(r: ScanResult, b: ScanBatch) {
  r.programs.push(...b.programs);
  r.presets.push(...(b.presets ?? []));
  r.pianos.push(...b.pianos);
  r.samples.push(...b.samples);
  r.errors.push(...b.errors);
  r.backupPianos.push(...(b.backupPianos ?? []));
  r.backupSamples.push(...(b.backupSamples ?? []));
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
  const genRef = useRef(0); // scan generation: ignore batches/expansions from a superseded scan
  // Operation token: which in-flight choose/reconnect/refresh/restore may still
  // clear `busy` on completion. Deliberately separate from genRef — genRef must
  // only bump once a new scan actually starts (inside runScan, after a pick
  // succeeds), or a re-pick that's merely attempted (and fails/cancels) would
  // invalidate a concurrent applyBundleSelection()'s in-flight expandBundles
  // calls, silently dropping already-decided-and-persisted bundle entries.
  const opRef = useRef(0);

  const append = useCallback((gen: number) => (b: ScanBatch) => {
    if (gen !== genRef.current) return;
    setResult((r) => withBatch(r, b));
  }, []);

  /** Run Pass A on a source, then apply remembered choices / open the gate.
   *  `dirHandle` (when the source has one) keys the remembered bundle choices
   *  to the actual directory, not just its display name. Bumps genRef itself,
   *  right as the new scan actually starts — not any earlier, so a re-pick
   *  that's merely attempted (and fails or is cancelled) never invalidates a
   *  concurrent applyBundleSelection()'s in-flight expansion of the OLD
   *  folder's bundles. */
  const runScan = useCallback(async (
    name: string, source: FolderSource, dirHandle?: FileSystemDirectoryHandle | null, keep = false,
  ) => {
    const gen = ++genRef.current;
    scannerRef.current?.dispose?.();
    const scanner = makeScanner();
    scannerRef.current = scanner;
    // `keep` (a refresh of the same folder): the last scan stays shown until the
    // new one has re-read what was showing (the loose files and the remembered
    // backups), so the lists, and an entry open beside them, don't empty out
    // meanwhile. A new folder starts empty and fills as it scans.
    let staged: ScanResult | null = keep ? emptyResult() : null;
    if (!keep) { setResult(EMPTY); setBundles([]); }
    setNewBundles([]); setPickerOpen(false); // a backup applied mid-refresh would be overwritten
    const shown = append(gen);
    const onBatch = (b: ScanBatch) => {
      if (!staged) shown(b);
      else if (gen === genRef.current) addBatch(staged, b);
    };

    // Up to the commit below, a refresh that fails leaves an emptied list with
    // the reason (the last scan was kept on screen and mustn't pass for current).
    let found: BundleDescriptor[], choice: Awaited<ReturnType<typeof loadBundleChoice>>, undecided: BundleDescriptor[];
    try {
      found = await scanner.scanLoose(source, onBatch);
      if (gen !== genRef.current) return;
      if (!staged) setBundles(found);

      choice = await loadBundleChoice(name, dirHandle ?? undefined);
      if (gen !== genRef.current) return;
      const decided = new Set(choice?.decided ?? []);
      const skipped = new Set(choice?.skipped ?? []);
      undecided = found.filter((b) => !decided.has(b.path) && !skipped.has(b.path));
      if (!staged) setNewBundles(undecided);

      // Re-apply remembered "load" choices silently.
      const toReload = found.filter((b) => decided.has(b.path)).map((b) => b.path);
      if (toReload.length > 0) await scanner.expandBundles(toReload, onBatch);
      if (gen !== genRef.current) return;
    } catch (err) {
      if (!staged || gen !== genRef.current) throw err;
      setResult({ ...emptyResult(), errors: [{ path: '(folder)', reason: `Couldn't refresh the folder: ${getErrorMessage(err)}` }] });
      setBundles([]);
      return;
    }
    if (staged) { setResult(staged); setBundles(found); setNewBundles(undecided); staged = null; }

    if (undecided.length >= 2) {
      setPickerOpen(true);
    } else if (undecided.length === 1 && !choice) {
      // First sight of this folder, single backup → auto-expand and remember.
      const only = undecided[0].path;
      await scanner.expandBundles([only], onBatch);
      await saveBundleChoice({ folderName: name, handle: dirHandle ?? undefined, decided: [only], skipped: [] });
      if (gen !== genRef.current) return;
      setNewBundles([]);
    }
  }, [append, makeScanner]);

  // Restore a saved folder on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Owned upfront (before restoreFolder()'s await) — checked again right
      // after it resolves, before touching any state: if the user manually
      // picked/reconnected while this was pending, a late "granted" here must
      // not clobber the newer folder's handle/name with the old one.
      const op = ++opRef.current;
      try {
        const state = await restoreFolder();
        if (cancelled || op !== opRef.current) return;
        if (state.status === 'granted') {
          setFolderName(state.name); setHandle(state.handle);
          // Mirrors choose()/reconnect(): busy must cover the restore scan
          // too, or a restored folder reads as "connected, found nothing"
          // while the (possibly slow) initial scan is still filling in
          // results.
          setBusy(true);
          try {
            await runScan(state.name, state.source, state.handle);
          } finally {
            // Only clear busy if a newer operation (a fresh choose/reconnect/
            // refresh, possibly after Forget) hasn't already superseded this
            // one — otherwise an abandoned/slow restore scan that finally
            // settles would clobber a legitimately in-flight newer busy state.
            if (!cancelled && op === opRef.current) setBusy(false);
          }
        } else if (state.status === 'needs-permission') {
          setFolderName(state.name); setPending(state.handle);
        }
      } catch (err) {
        if (cancelled || op !== opRef.current) return;
        // A saved handle can go stale (folder deleted/renamed outside the
        // browser). Say why the linked folder vanished — the banner offers
        // Change folder — instead of leaving a silent empty state.
        console.error('Folder restore failed', err);
        setReconnectError(getErrorMessage(err));
      }
    })();
    return () => { cancelled = true; };
  }, [runScan]);

  const choose = useCallback(async () => {
    // Owned upfront (before any await) so a stale completion — e.g. this call
    // getting abandoned via Forget and then finally settling — can tell it's
    // no longer the current operation and skip clearing busy, or (checked
    // again right after pickFolder() resolves) skip touching state entirely.
    // Deliberately not genRef: bumping that here, before the pick even
    // resolves, would invalidate a concurrent applyBundleSelection() in-flight
    // expansion the moment Re-pick is clicked, even if the pick then fails or
    // is cancelled.
    const op = ++opRef.current;
    setBusy(true); setReconnectError(null);
    try {
      const r = await pickFolder();
      // Superseded while the OS picker was open (e.g. Forget + another pick
      // already completed) — must not overwrite the newer folder's state or
      // dispose its in-progress scan.
      if (op !== opRef.current) return;
      setFolderName(r.name); setHandle(r.handle ?? null); setPending(null);
      await runScan(r.name, r.source, r.handle);
    } catch (err) {
      if (op !== opRef.current) return;
      if (!isCancel(err)) {
        console.error('Folder pick failed', err);
        // Preserve whatever was already loaded — a failed re-pick (the
        // Android/Google-Drive empty-selection case included) must not wipe
        // out a previously connected fallback folder's programs/presets/etc,
        // which for a File[] source can never be recovered by a refresh.
        setResult((r) => ({ ...r, errors: [...r.errors, { path: '(folder)', reason: getErrorMessage(err) }] }));
      }
    } finally { if (op === opRef.current) setBusy(false); }
  }, [runScan]);

  const reconnect = useCallback(async () => {
    if (!pending) return;
    const op = ++opRef.current;
    setBusy(true); setReconnectError(null);
    try {
      const source = await grantAndScan(pending);
      // Superseded while the permission prompt was open (e.g. Forget + a
      // fresh pick already completed) — must not overwrite the newer
      // folder's handle or dispose its in-progress scan.
      if (op !== opRef.current) return;
      if (source) {
        setHandle(pending); setPending(null);
        await runScan(folderName ?? pending.name, source, pending);
      } else {
        // Permission wasn't granted — say so rather than silently doing nothing.
        setReconnectError(`Couldn't read “${folderName ?? 'the folder'}” — your browser blocked access. Click Reconnect folder and choose Allow, or Change folder.`);
      }
    } catch (err) {
      if (op !== opRef.current) return;
      if (!isCancel(err)) { console.error('Folder reconnect failed', err); setReconnectError(getErrorMessage(err)); }
    } finally { if (op === opRef.current) setBusy(false); }
  }, [pending, folderName, runScan]);

  const refresh = useCallback(async () => {
    if (!handle || !folderName) return;
    const op = ++opRef.current;
    setBusy(true);
    try {
      await runScan(folderName, rescan(handle), handle, true);
    } catch (err) {
      // Anything else (the folder can't be read at all, a backup failing to load
      // after the new list is in) is reported beside the list it leaves standing.
      if (op !== opRef.current) return;
      setResult((r) => ({ ...r, errors: [...r.errors, { path: '(folder)', reason: `Couldn't refresh the folder: ${getErrorMessage(err)}` }] }));
    } finally { if (op === opRef.current) setBusy(false); }
  }, [handle, folderName, runScan]);

  const forget = useCallback(async () => {
    // Reset the UI first so Forget always responds instantly — it's the escape
    // hatch; never gate it on the IDB write completing. That includes busy: a
    // restored folder's scan can be slow or hang, and abandoning its
    // generation above doesn't unblock an in-flight scanLoose() call, so
    // without this Choose/Re-pick would stay disabled indefinitely.
    genRef.current++; // abandon in-flight batches/expansions
    opRef.current++; // and any in-flight operation's claim on clearing busy
    setHandle(null); setPending(null); setFolderName(null); setReconnectError(null);
    setResult(EMPTY); setBundles([]); setNewBundles([]); setPickerOpen(false);
    setBusy(false);
    await forgetFolder(); await clearBundleChoice();
  }, []);

  const openBundlePicker = useCallback(() => setPickerOpen(true), []);
  const closeBundlePicker = useCallback(() => setPickerOpen(false), []);

  const openBundle = useCallback(async (path: string): Promise<File> => {
    if (handle) return fileFromHandle(handle, path);
    const scanner = scannerRef.current;
    if (scanner?.openBundle) return scanner.openBundle(path);
    throw new Error('No folder is connected.');
  }, [handle]);

  const writeBack = useCallback(async (
    name: string,
    write: (w: FileSystemWritableFileStream) => Promise<void>,
    opts: { mode: 'new' | 'overwrite' },
  ): Promise<WriteResult> => {
    if (!handle) return { target: 'download' };
    if (!(await requestWriteAccess(handle))) return { target: 'download' };
    const existing = await listDirNames(handle);
    const finalName = resolveWriteName(name, opts.mode, existing);
    await writeFileToDir(handle, finalName, write);
    await refresh(); // a failed rescan says so in the list; the file is written either way
    return { target: 'folder', path: finalName };
  }, [handle, refresh]);

  const applyBundleSelection = useCallback(async (loadPaths: string[]) => {
    const scanner = scannerRef.current;
    if (!scanner || !folderName) { setPickerOpen(false); return; }
    const gen = genRef.current;
    const load = newBundles.filter((b) => loadPaths.includes(b.path)).map((b) => b.path);
    const skip = newBundles.filter((b) => !loadPaths.includes(b.path)).map((b) => b.path);
    const prior = await loadBundleChoice(folderName, handle ?? undefined);
    await saveBundleChoice({
      folderName,
      handle: handle ?? undefined,
      decided: [...new Set([...(prior?.decided ?? []), ...load])],
      skipped: [...new Set([...(prior?.skipped ?? []), ...skip])],
    });
    setPickerOpen(false); setNewBundles([]);
    await scanner.expandBundles(load, append(gen));
  }, [folderName, handle, newBundles, append]);

  return {
    folderName, result, bundles, newBundles, pickerOpen,
    needsReconnect: pending !== null, reconnectError, busy,
    canPersist: supportsPersistentFolders(),
    choose, reconnect, refresh, forget,
    openBundlePicker, closeBundlePicker, applyBundleSelection,
    openBundle, writeBack,
  };
}
