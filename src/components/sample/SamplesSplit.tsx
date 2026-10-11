import { useEffect, useState } from 'react';
import { SamplesBrowse } from './SamplesBrowse';
import { SampleInspector, type InspectorInput } from './SampleInspector';
import { CategorySplit, useBackToList } from '@/components/library/CategorySplit';
import { EmptyNote, NotListedNote } from '@/components/library/EmptyNote';
import { useSamplesState } from '@/lib/library/SamplesContext';
import { useOpenSample } from '@/lib/library/useOpenSample';
import { useSplitLayout } from '@/lib/responsive';
import { readFileBytes } from '../../lib/file';
import { useNavigate } from '@tanstack/react-router';
import { useCloseRemoved, useOpenEntry } from '@/components/library/openEntry';

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
  // The sample the route names, read by useOpenSample.
  const open = useOpenSample(selectedId);
  // A file shown off the route: an import just made, or "Preview a file" (loadNew).
  const [preview, setPreview] = useState<InspectorInput | null>(null);
  const [loadNew, setLoadNew] = useState(false);
  // An import that wasn't a sample file: shown above the list, apart from the open sample.
  const [importError, setImportError] = useState('');
  const navigate = useNavigate();
  const closeRemoved = useCloseRemoved('/library/samples');
  const openEntry = useOpenEntry();

  // Opening a sample from the route closes a preview.
  useEffect(() => {
    if (!selectedId) return;
    setPreview(null);
    setLoadNew(false);
    setImportError('');
  }, [selectedId]);

  // Off the open sample, to the bare list (which closes it and lets go of its read),
  // replacing it so Back doesn't reopen it.
  const toList = () => { if (selectedId) navigate({ to: '/library/samples', replace: true }); };
  const startLoadNew = () => { toList(); setPreview(null); setLoadNew(true); setImportError(''); };
  const backToList = useBackToList('/library/samples');
  const back = () => { if (selectedId) backToList(); setPreview(null); setLoadNew(false); };

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
      setPreview({ bytes, name: f.name });      // open it now
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
        // Clicking the open sample again retries it, but only when its read failed.
        onOpen={(e) => (e.id !== selectedId ? openEntry.sample(e.id) : open.state === 'failed' && open.retry())}
        onLoadNew={startLoadNew}
        activeId={selectedId ?? null}
        onImport={importSample}
        onRemove={(id) => void s.removeSample(id).then(() => closeRemoved(id))}
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

  // Remount the inspector per sample (key on name+size) so its load effect re-runs.
  const inspector = (initial?: InspectorInput, factory?: boolean) => (
    <SampleInspector key={initial ? `${initial.name}-${initial.bytes.length}` : 'new'} initial={initial} factory={factory} />
  );
  // A sample named by the route is the detail even before its bytes arrive, so a
  // phone shows its progress, error or "not found" instead of the bare list.
  // Its factory tag comes from the entry as it is now (a backup's origin can
  // resolve after its bytes do).
  const hasDetail = !!selectedId || loadNew || preview !== null;
  const detail = selectedId ? (
    open.state === 'missing' ? <NotListedNote noun="sample" />
    : open.state === 'failed' ? <div role="alert"><EmptyNote>{open.error} Click it in the list to try again.</EmptyNote></div>
    : open.state === 'open' ? (
      <>
        {!open.listed && <EmptyNote>This sample isn’t in your library right now.</EmptyNote>}
        {inspector(open.sample, open.factory)}
      </>
    )
    : <EmptyNote>Reading the sample…{open.state === 'reading' && open.pct !== null && ` ${open.pct}%`}</EmptyNote>
  ) : loadNew ? inspector()
    : preview ? inspector(preview)
    : <EmptyNote>Pick a sample to inspect it.</EmptyNote>;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={detail}
      hasDetail={hasDetail}
      list="/library/samples"
      onBack={back}
      backLabel="← Samples"
      selectedId={selectedId}
    />
  );
}
