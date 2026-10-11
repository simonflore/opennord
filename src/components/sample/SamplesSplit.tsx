import { useEffect, useRef, useState } from 'react';
import { SamplesBrowse } from './SamplesBrowse';
import { SampleInspector, type InspectorInput } from './SampleInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { EmptyNote } from '@/components/library/EmptyNote';
import { useSamplesState } from '@/lib/library/SamplesContext';
import { useSplitLayout } from '@/lib/responsive';
import { getErrorMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/file';
import { useNavigate } from '@tanstack/react-router';
import { openSample } from '@/components/library/openEntry';

/**
 * The Samples screen as master/detail. Folder samples open in the inspector
 * (bytes in hand); device samples are pulled off the board with progress, then
 * opened in the same inspector — staying on the Samples screen. "+ Import sample"
 * persists a file and opens it; "Preview a file" opens the inspector's own
 * drag/drop/pick zone for a throwaway look (not stored).
 */
export function SamplesSplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = useSamplesState();
  // The thing currently shown in the detail pane: pulled/folder bytes, or null.
  const [inspect, setInspect] = useState<InspectorInput | null>(null);
  const [loadNew, setLoadNew] = useState(false);
  const [pullPct, setPullPct] = useState<number | null>(null);
  const [pullError, setPullError] = useState('');
  // An import that wasn't a sample file: shown above the list, apart from the open sample.
  const [importError, setImportError] = useState('');
  const navigate = useNavigate();

  // The route names the open sample; `attempt` bumps to retry it. The effect
  // asks the context for its bytes (readSample shares a read already running,
  // so StrictMode doesn't pull twice), and its cleanup ignores a read that a
  // newer route, a retry or leaving has overtaken. The lookup and reader are
  // read through a ref: they change identity often, and must not restart a read.
  const [attempt, setAttempt] = useState(0);
  const known = !!(selectedId && s.entryById(selectedId));
  const io = useRef({ entryById: s.entryById, readSample: s.readSample });
  useEffect(() => { io.current = { entryById: s.entryById, readSample: s.readSample }; });

  useEffect(() => {
    if (!selectedId) {
      setInspect((i) => (i?.id ? null : i)); // leaving a sample closes it (a preview stays)
      return;
    }
    setLoadNew(false);
    setPullError('');
    setInspect(null);
    const e = io.current.entryById(selectedId);
    if (!e) return; // named but not (yet) in the list
    let cancelled = false;
    const bytes = io.current.readSample(e, (pct) => { if (!cancelled) setPullPct(pct); });
    if (!bytes) return;
    if (e.source !== 'local') setPullPct(0);
    bytes.then(
      (b) => { if (!cancelled) setInspect({ id: e.id, bytes: b, name: e.name, factory: e.factory }); },
      (err) => { if (!cancelled) setPullError(`Could not read ${e.name}: ${getErrorMessage(err)}`); },
    ).finally(() => { if (!cancelled) setPullPct(null); });
    return () => { cancelled = true; setPullPct(null); };
  }, [selectedId, known, attempt]);

  // Back to the bare list (which closes the open sample and drops its read).
  const toList = () => { if (selectedId) navigate({ to: '/library/samples' }); };
  const startLoadNew = () => { toList(); setInspect(null); setLoadNew(true); setPullError(''); };
  const back = () => { toList(); setInspect(null); setLoadNew(false); setPullError(''); };

  function importSample() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nsmp,.nsmp3,.nsmp4'; // D3: no .npno (Pianos category)
    input.style.display = 'none';
    document.body.appendChild(input);
    const cleanup = () => input.remove();
    input.onchange = async () => {
      const f = input.files?.[0];
      cleanup();
      if (!f) return;
      if (!['.nsmp', '.nsmp3', '.nsmp4'].some((e) => f.name.toLowerCase().endsWith(e))) {
        setImportError(`“${f.name}” isn’t a Nord sample (.nsmp, .nsmp3 or .nsmp4). Programs belong on the Library page.`);
        return;
      }
      setImportError('');
      const bytes = await readFileBytes(f);
      await s.importSample(f);                  // persist + add to the list
      toList();
      setLoadNew(false);
      setInspect({ bytes, name: f.name });      // open it now
    };
    input.oncancel = cleanup;
    input.click();
  }

  // The open sample's progress and errors show in the detail; only an import
  // problem shows above the list.
  const status = importError ? <p className="ps-sub" role="alert">{importError}</p> : null;

  const list = (
    <div className="lib-master">
      {status}
      <SamplesBrowse
        entries={s.shown}
        source={s.source} generation={s.generation} query={s.query}
        nordCount={s.nordCount} localCount={s.localCount}
        showSourceFacet={s.showSourceFacet} showUnknownGen={s.showUnknownGen}
        category={s.category} onCategory={s.setCategory} categoriesPresent={s.categoriesPresent}
        onSource={s.setSource} onGeneration={s.setGeneration} onQuery={s.setQuery} clearFilters={s.clearFilters} filtered={s.filtered}
        // Clicking the open sample again retries it, but only when it didn't open.
        onOpen={(e) => (e.id !== selectedId ? openSample(navigate, e.id) : !inspect && pullPct === null && setAttempt((n) => n + 1))}
        onLoadNew={startLoadNew}
        activeId={selectedId ?? null}
        onImport={importSample}
        onRemove={(id) => void s.removeSample(id)}
        storedCount={s.storedCount} storedBytes={s.storedBytes}
        prefs={s.prefs}
        canScanUsage={s.canScanUsage} onScanUsage={() => void s.scanUsage()} scanPct={s.scanPct}
        unusedCount={s.unusedCount} unusedOnly={s.unusedOnly} onUnusedOnly={s.setUnusedOnly}
        selected={s.selected} toggleSelected={s.toggleSelected}
        selectAllUnused={s.selectAllUnused} clearSelected={s.clearSelected}
        selectedFreeBytes={s.selectedFreeBytes}
        removeFromNord={s.removeFromNord}
        removing={s.removing} removePct={s.removePct}
      />
    </div>
  );

  const initial = loadNew ? undefined : (inspect ?? undefined);
  // Remount the inspector per sample (key on name+size) so its load effect re-runs.
  const inspector = (
    <SampleInspector key={initial ? `${initial.name}-${initial.bytes.length}` : 'new'} initial={initial} />
  );
  // A sample named by the route is the detail even before its bytes arrive, so a
  // phone shows its progress, error or "not found" instead of the bare list.
  const hasDetail = loadNew || inspect !== null || !!selectedId;
  const detail = loadNew || inspect ? inspector
    : !selectedId ? <EmptyNote>Pick a sample to inspect it.</EmptyNote>
    : !known ? <EmptyNote>This sample isn’t in your library (yet). Pick it from the list.</EmptyNote>
    : pullError ? <div role="alert"><EmptyNote>{pullError} Click it in the list to try again.</EmptyNote></div>
    : <EmptyNote>Reading the sample… {pullPct ?? 0}%</EmptyNote>;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={detail}
      hasDetail={hasDetail}
      onBack={back}
      backLabel="← Samples"
      selectedId={selectedId}
    />
  );
}
