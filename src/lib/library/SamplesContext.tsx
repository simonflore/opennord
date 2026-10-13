import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { useImportedSamples } from '@/lib/library/useImportedSamples';
import { useSamplesPrefs } from '@/lib/library/prefs';
import {
  sampleEntriesFromScanned, nordSampleEntriesFromDevice, sampleEntriesFromBackupRefs,
  filterSamples, sortSamples, presentSampleCategories, cloudSampleEntries, sampleFilename,
  type SampleEntry, type SampleGeneration,
} from '@/lib/library/sample-entries';
import { useCloudSnapshot } from '@/lib/library/CloudSnapshotContext';
import { sameSizeOnly, useSoundRows } from '@/lib/library/useSoundRows';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import { readNsmp } from '@/lib/ns4/nsmp';
import { safeFilename } from '@/lib/ns4/bundle';
import type { LibrarySource } from '@/lib/library/types';
import { enumerateSampleLibrary, pullSample } from '@/lib/device/samples';
import { findUnusedSamples, normalizeSampleName, type SampleUsage } from '@/lib/device/dependencies';
import { useBackupOrigins } from './useBackupOrigins';
import { planOffload } from '@/lib/device/offload';
import { executePlan } from '@/lib/device/execute';
import { saveUnrestored } from '@/lib/device/unrestored';
import type { RemoveResult } from '@/lib/library/keep-copies';
import { sessionDeviceIO } from '@/lib/device/device-io';
import { WriteBlockedError } from '@/lib/device/write-guard';
import { buildOccupancy, type Addr } from '@/lib/device/reorg';
import { PARTITION_SAMP_LIB } from '@/lib/device/opcodes';
import { pickCopyFolder } from '@/lib/library/keep-copies';
import { removeUnused } from '@/lib/library/remove-unused';
import { getErrorMessage } from '@/lib/errors';
import { useListFilters } from '@/lib/library/useListFilters';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';

// Numbers each Nord session, so reads key by session without holding on to it.
const sessionNos = new WeakMap<object, number>();
let lastSessionNo = 0;
function sessionNo(session: object): number {
  let n = sessionNos.get(session);
  if (n === undefined) sessionNos.set(session, (n = ++lastSessionNo));
  return n;
}
const nordReadPrefix = (session: object) => `nord@${sessionNo(session)}:`;

// pure helper, exported for tests
export function selectedBytes(entries: SampleEntry[], selected: Set<string>): number {
  return entries.filter((e) => selected.has(e.id)).reduce((n, e) => n + (e.device?.sizeBytes ?? e.size ?? 0), 0);
}

const SAMPLE_EXT: Record<string, string> = { og: 'nsmp', '3': 'nsmp3', '4': 'nsmp4', npno: 'npno' };
const extForGeneration = (g: string) => SAMPLE_EXT[g] ?? 'nsmp4';
const SAMPLE_ROWS_HERE_ONLY = { fingerprint: sameSizeOnly<SampleEntry> };

/** Merges device + folder samples into one filtered/sorted list and owns the
 *  Samples-screen view state. Mirrors useLibraryStateValue for programs. */
function useSamplesStateValue() {
  const { session, sampleEntries, setSampleEntries, isCurrent } = useDevice();
  const folder = useFolder();
  const imported = useImportedSamples();
  const prefs = useSamplesPrefs();
  const origins = useBackupOrigins(folder.result.backupSamples, folder.openBundle);
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [generation, setGeneration] = useState<SampleGeneration | 'all'>('all');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [query, setQuery] = useState('');

  // Sample-usage scan (device-connected): which installed samples no program uses.
  // On-demand — it's one device round-trip per program — so a button triggers it.
  const [usage, setUsage] = useState<SampleUsage | null>(null);
  const [scanPct, setScanPct] = useState<number | null>(null);
  const [scanError, setScanError] = useState('');
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);
  const [removePct, setRemovePct] = useState<number | null>(null);
  const toggleSelected = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearSelected = () => setSelected(new Set());

  // The usage tags and the picked samples name this Nord's slots: a new
  // connection starts without them, so nothing picked on one Nord is removed
  // from the next.
  useEffect(() => {
    setUsage(null); setScanPct(null); setScanError(''); setUnusedOnly(false); setSelected(new Set());
  }, [session]);

  async function scanUsage() {
    if (!session) return;
    setScanPct(0);
    setScanError('');
    try {
      const u = await findUnusedSamples(session, (done, total) => {
        if (isCurrent(session)) setScanPct(total ? Math.round((done / total) * 100) : 0);
      });
      if (isCurrent(session)) setUsage(u); // not tags for another Nord connected meanwhile
    } catch (e) {
      // Scan failed (unsupported, disconnected, or a program it couldn't read):
      // leave the list untagged and say why.
      if (isCurrent(session)) { setUsage(null); setScanError(getErrorMessage(e)); }
    } finally {
      if (isCurrent(session)) setScanPct(null); // a scan on another Nord's session doesn't touch this one's
    }
  }

  // Lazily enumerate the user Sample Library when a device is connected. Cheap
  // (names/slots only); absent partitions reject and are ignored. No byte pull
  // here — the pull happens on tap, in SamplesSplit.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    enumerateSampleLibrary(session)
      .then((es) => { if (!cancelled) setSampleEntries(es); })
      .catch(() => { /* sample partition absent/unsupported — leave empty */ });
    return () => { cancelled = true; };
  }, [session, setSampleEntries]);

  // Tag device samples the scan found unused (match by normalized name).
  const unusedNames = useMemo(() => (usage ? new Set(usage.unused.map((s) => normalizeSampleName(s.name))) : null), [usage]);
  const allEntries: SampleEntry[] = useMemo(() => [
    ...nordSampleEntriesFromDevice(sampleEntries).map((e) =>
      unusedNames ? { ...e, unused: unusedNames.has(normalizeSampleName(e.name)) } : e),
    ...sampleEntriesFromScanned(folder.result.samples),
    ...sampleEntriesFromBackupRefs(folder.result.backupSamples).map((e) => ({ ...e, factory: origins.get(e.id) })),
    ...imported.entries,
  ], [sampleEntries, unusedNames, folder.result.samples, folder.result.backupSamples, origins, imported.entries]);
  // One row per sample, as in the program list: `allEntries` stays what is here
  // and on the Nord (what backup, the share picker and the Nord cleanup read);
  // rows add the cloud. An entry whose bytes aren't here (on the Nord, inside a
  // backup) is never fingerprinted, so it never merges: it only hints.
  const cloud = useCloudSnapshot();
  const cloudEntries = useMemo(() => cloudSampleEntries(cloud.items), [cloud.items]);
  // No type for the hint: a device sample's listing says no generation, and every
  // entry here is a sample. A sample can be tens of megabytes: with no cloud
  // samples to match, only files of the same length are hashed.
  const sampleRows = cloudEntries.length ? undefined : SAMPLE_ROWS_HERE_ONLY;
  const { rows, byId, nordCount, localCount, showCloud, showSourceFacet } = useSoundRows(allEntries, cloudEntries, sampleRows);
  const storedCount = imported.entries.length;
  const storedBytes = imported.entries.reduce((n, e) => n + (e.size ?? 0), 0);
  const showUnknownGen = allEntries.some((e) => e.generation === 'unknown' && e.source === 'local');
  const unusedCount = usage ? usage.unused.length : null;
  // Categories present across the *unfiltered* list — drives whether the
  // category facet is worth showing (only when there's more than one).
  const categoriesPresent = presentSampleCategories(rows);

  // The list follows the search a beat behind (an interruptible render), so the
  // field keeps up with typing in a big folder.
  const listQuery = useDeferredValue(query);
  const shown = useMemo(() => sortSamples(
    filterSamples(rows, source, generation, listQuery, unusedOnly, category), prefs.sort, prefs.favorites),
  [rows, source, generation, listQuery, unusedOnly, category, prefs.sort, prefs.favorites]);
  const entryById = useCallback((id: string) => byId.get(id), [byId]);
  const fetchItem = useCapabilities().cloud.fetchItem;

  const isRemovable = (e: SampleEntry) => e.source === 'nord' && e.unused && e.device;
  const removableUnused = allEntries.filter(isRemovable);
  // Of the rows listed: a search or facet in force must not pick, for removal,
  // unused entries it is hiding.
  const selectAllUnused = () => setSelected(new Set(shown.filter(isRemovable).map((e) => e.id)));
  const selectedFreeBytes = selectedBytes(allEntries, selected);
  // The selection from the whole list, not the filtered one: removal deletes
  // every selected entry, so the confirm dialog (keep-a-copy, re-install links)
  // must see the ones a search or facet is hiding too.
  const selectedEntries = useMemo(() => allEntries.filter((e) => selected.has(e.id)), [allEntries, selected]);

  async function removeFromNord({ keepCopyIds }: { keepCopyIds: Set<string> }): Promise<RemoveResult> {
    if (!session) return { removed: 0, failed: 0 };
    const targets = removableUnused.filter((e) => selected.has(e.id));
    if (targets.length === 0) return { removed: 0, failed: 0 };
    // Unconfirmed layout on this keyboard: refuse up front with the calm message.
    if (!session.canWrite(PARTITION_SAMP_LIB)) throw new WriteBlockedError();
    // Where the copies go, asked first: the folder picker needs the click that
    // started this. A browser download won't do: it never says whether the
    // file was saved, and the sample is deleted next.
    const saveCopy = targets.some((e) => keepCopyIds.has(e.id)) ? await pickCopyFolder() : null;
    setRemoving(true);
    setRemovePct(0);
    const onThisNord = <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => { if (isCurrent(session)) fn(...args); }; // not another Nord connected meanwhile
    try {
      return await removeUnused({
        targets, keepCopyIds, saveCopy,
        rescan: (onProgress) => findUnusedSamples(session, onProgress),
        pull: (e) => pullSample(session, e.device!, () => {}),
        filenameOf: (e) => `${e.name}.${extForGeneration(e.generation)}`,
        remove: (entries, onProgress) => {
          const addrs: Addr[] = entries.map((e) => ({ bank: e.device!.bank, slot: e.device!.slot }));
          return session.withSession(PARTITION_SAMP_LIB, () =>
            executePlan(sessionDeviceIO(session), PARTITION_SAMP_LIB, planOffload(addrs), buildOccupancy(entries.map((e) => e.device!)),
              { onProgress: (p) => onProgress(p.opIndex, p.opCount) }));
        },
        relist: () => enumerateSampleLibrary(session),
        keepUnrestored: saveUnrestored,
        onUsage: onThisNord(setUsage),
        onListed: onThisNord(setSampleEntries),
        onProgress: onThisNord(setRemovePct),
        afterRemoval: onThisNord(clearSelected),
      });
    } finally {
      setRemoving(false); setRemovePct(null);
    }
  }

  // Reads of sample bytes that are still running, by readKey. A second request
  // for the same sample (StrictMode's second effect run, a quick re-open) joins
  // the read in flight instead of reading it twice; progress goes to the latest
  // requester. A Nord pull whose requesters have all gone (aborted their signal)
  // by the time its turn on the session comes is dropped, so the sample opened
  // next isn't stuck behind the ones clicked past. Settled reads are dropped,
  // so the next open reads afresh.
  type Read = { bytes: Promise<Uint8Array>; progress: (pct: number) => void; users: number };
  const reads = useRef(new Map<string, Read>());
  /**
   * Which read a sample's bytes come from (a local sample's are in hand): its
   * id and size, and for a Nord sample also the session and what the slot holds (its id names a slot, which may hold
   * another sample after a reconnect or once the list is read again), so a read
   * is never reused for different bytes.
   */
  const readKey = useCallback(
    (e: SampleEntry) => (e.source === 'nord' && session
      ? `${nordReadPrefix(session)}${e.id}:${e.name}:${e.device?.sizeBytes ?? ''}`
      : `${e.id}:${e.size ?? ''}`), // a backup entry rewritten (a refresh) reads again
    [session],
  );
  // A new session (or none) forgets the last one's reads, so none is joined; a
  // pull still running there finishes or fails on its own.
  useEffect(() => {
    const live = session ? nordReadPrefix(session) : null;
    for (const key of [...reads.current.keys()]) {
      if (key.startsWith('nord@') && (!live || !key.startsWith(live))) reads.current.delete(key);
    }
  }, [session]);
  const readSample = useCallback((e: SampleEntry, onProgress: (pct: number) => void, signal: AbortSignal): Promise<Uint8Array> => {
    if (e.source === 'local' && e.bytes) return Promise.resolve(e.bytes);
    const key = readKey(e);
    let r = reads.current.get(key);
    if (!r) {
      const read: Read = { bytes: Promise.resolve(new Uint8Array()), progress: onProgress, users: 0 };
      // A cloud-only sample is fetched each time it is opened and not kept: one can be tens of megabytes.
      const fromCloud = e.source === 'cloud' && e.fingerprint && fetchItem ? fetchItem(e.fingerprint) : null;
      const raw = fromCloud ?? (e.source === 'nord' && e.device && session
        ? pullSample(session, e.device, (done, total) => read.progress(total ? Math.round((done / total) * 100) : 0), () => read.users > 0)
        : e.source === 'backup' && e.backupRef ? extractBackupEntry(folder, e.backupRef) : null);
      if (!raw) {
        return Promise.reject(new Error(e.source === 'nord' ? 'connect your Nord to read it.'
          : e.source === 'cloud' ? 'sign in to fetch it from the cloud.' : 'its file isn’t available.'));
      }
      read.bytes = raw.finally(() => { if (reads.current.get(key) === read) reads.current.delete(key); });
      reads.current.set(key, read);
      r = read;
    }
    r.progress = onProgress;
    if (!signal.aborted) {
      const joined = r;
      joined.users++;
      signal.addEventListener('abort', () => { joined.users--; }, { once: true });
    }
    return r.bytes;
  }, [session, folder, readKey, fetchItem]);

  // A copy of a sample (fetched from the cloud, or pulled off the Nord) in
  // OpenNord's own storage, named as Save names it.
  const { add } = imported;
  const keepCopy = useCallback((e: SampleEntry, bytes: Uint8Array) => {
    const file = readNsmp(bytes);
    const name = file.recognized ? sampleFilename(e.name, file.codec, file.legacy) : `${safeFilename(e.name)}.${extForGeneration(e.generation)}`;
    return add(new File([bytes as BlobPart], name));
  }, [add]);

  // The list's filters, once: `filtered` and the "clear filters" button both read
  // this, and a filter counts while set even if its facet is hidden right now.
  const { filtered, clearFilters, ensureListed } = useListFilters(shown, [
    // Counts once the list has caught up with the search (listQuery).
    { active: listQuery.trim() !== '', reset: () => setQuery('') },
    { active: source !== 'all', reset: () => setSource('all') },
    { active: generation !== 'all', reset: () => setGeneration('all') },
    { active: category !== 'all', reset: () => setCategory('all') },
    { active: unusedOnly, reset: () => setUnusedOnly(false) },
  ]);
  return {
    all: allEntries, rows, total: rows.length, showCloud, keepCopy, clearFilters, filtered, ensureListed, readSample, readKey,
    shown, source, setSource, generation, setGeneration,
    category, setCategory, categoriesPresent, query, setQuery,
    prefs, entryById, nordCount, localCount, showSourceFacet, showUnknownGen, folder,
    // Sample-usage cleanup (device-connected)
    canScanUsage: !!session, scanUsage, scanPct, scanError, unusedCount,
    unusedOnly, setUnusedOnly, missingCount: usage ? usage.missing.length : null,
    importSample: imported.add, removeSample: imported.remove, storedCount, storedBytes,
    // Selection + removal
    selected, selectedEntries, toggleSelected, selectAllUnused, clearSelected, selectedFreeBytes,
    removeFromNord, removing, removePct,
  };
}

type SamplesState = ReturnType<typeof useSamplesStateValue>;
type SamplesData = Pick<SamplesState, 'all' | 'rows' | 'ensureListed'>;
const Ctx = createContext<SamplesState | null>(null);
const DataCtx = createContext<SamplesData | null>(null);

export function SamplesProvider({ children }: { children: ReactNode }) {
  const state = useSamplesStateValue();
  // What the always-mounted shell reads (the rail's count, the ⌘K palette):
  // its own context, so a search keystroke here doesn't re-render the shell.
  const { all, rows, ensureListed } = state;
  const data = useMemo(() => ({ all, rows, ensureListed }), [all, rows, ensureListed]);
  return (
    <DataCtx.Provider value={data}>
      <Ctx.Provider value={state}>{children}</Ctx.Provider>
    </DataCtx.Provider>
  );
}

/** The entries and the jump-to helper, without the search state (see SamplesProvider). */
export function useSamplesData(): SamplesData {
  const v = useContext(DataCtx);
  if (!v) throw new Error('useSamplesData must be used within SamplesProvider');
  return v;
}

export function useSamplesState(): SamplesState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSamplesState must be used within SamplesProvider');
  return v;
}
