import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { SamplesBrowse } from './SamplesBrowse';
import { SampleInspector, type InspectorInput } from './SampleInspector';
import { Button } from '@/components/ui';
import { CategorySplit } from '@/components/library/CategorySplit';
import { EmptyNote, NotListedNote } from '@/components/library/EmptyNote';
import { useSamplesState } from '@/lib/library/SamplesContext';
import { useOpenSample } from '@/lib/library/useOpenSample';
import { useSplitLayout } from '@/lib/responsive';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import { COMMUNITY_SHARE_TO } from '@/components/shell/nav';
import { canShareAudio } from '@/lib/library/share-audio';
import { useCloseRemoved, useLeaveEntry, useOpenEntry } from '@/components/library/openEntry';

/**
 * The Samples screen as master/detail. Folder samples open in the inspector
 * (bytes in hand); device samples are pulled off the board with progress, then
 * opened in the same inspector — staying on the Samples screen. "Import a file…"
 * (in "+ Add") persists a file and opens it; "Preview a file…" opens the inspector's own
 * drag/drop/pick zone for a throwaway look (not stored).
 */
export function SamplesSplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = useSamplesState();
  // The sample the route names, read by useOpenSample.
  const open = useOpenSample(selectedId);
  // "Preview a file…": the inspector's own drop/pick zone, off the route.
  const [loadNew, setLoadNew] = useState(false);
  // An import that wasn't a sample file: shown above the list, apart from the open sample.
  const [importError, setImportError] = useState('');
  const closeRemoved = useCloseRemoved('/library/samples');
  const openEntry = useOpenEntry();
  const community = useCapabilities().community;
  const navigate = useNavigate();
  const share = (id: string) => () => void navigate({ to: COMMUNITY_SHARE_TO, search: { item: id } as never });

  // Opening a sample from the route closes a preview.
  useEffect(() => {
    if (!selectedId) return;
    setLoadNew(false);
    setImportError('');
  }, [selectedId]);

  // Off the open sample, to the bare list (which closes it and lets go of its read).
  const toList = useLeaveEntry('/library/samples');
  const startLoadNew = () => { toList(); setLoadNew(true); setImportError(''); };
  const back = () => { toList(); setLoadNew(false); };

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
      const id = await s.importSample(f);      // persist + add to the list
      setLoadNew(false);
      openEntry.sample(id);                     // and open it, like any library sample
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
        onOpen={(e) => openEntry.sample(e.id)}
        onLoadNew={startLoadNew}
        activeId={selectedId ?? null}
        onImport={importSample}
        onRemove={(id) => void s.removeSample(id).then(() => closeRemoved(id))}
        storedCount={s.storedCount} storedBytes={s.storedBytes}
        prefs={s.prefs}
        canScanUsage={s.canScanUsage} onScanUsage={() => void s.scanUsage()} scanPct={s.scanPct} scanError={s.scanError}
        unusedCount={s.unusedCount} unusedOnly={s.unusedOnly} onUnusedOnly={s.setUnusedOnly}
        selected={s.selected} selectedEntries={s.selectedEntries} toggleSelected={s.toggleSelected}
        selectAllUnused={s.selectAllUnused} clearSelected={s.clearSelected}
        selectedFreeBytes={s.selectedFreeBytes}
        removeFromNord={s.removeFromNord}
        removing={s.removing} removePct={s.removePct}
      />
    </div>
  );

  // Remount the inspector per sample (key on name+size) so its load effect re-runs.
  const inspector = (initial?: InspectorInput, factory?: boolean, onShare?: () => void) => (
    <SampleInspector key={initial ? `${initial.name}-${initial.bytes.length}` : 'new'} initial={initial} factory={factory} onShare={onShare} />
  );
  // A sample named by the route is the detail even before its bytes arrive, so a
  // phone shows its progress, error or "not found" instead of the bare list.
  // Its factory tag comes from the entry as it is now (a backup's origin can
  // resolve after its bytes do).
  const hasDetail = !!selectedId || loadNew;
  // Offered for a library file of your own; not for a pull off the Nord, a backup's factory entry or a preview.
  const openEntryNow = selectedId ? s.entryById(selectedId) : undefined;
  const shareOpen = openEntryNow && canShareAudio(community, openEntryNow) ? share(openEntryNow.id) : undefined;
  const detail = selectedId ? (
    open.state === 'missing' ? <NotListedNote noun="sample" />
    : open.state === 'failed' ? (
      <div role="alert" className="flex flex-col items-center">
        <EmptyNote>{open.error}</EmptyNote>
        <Button variant="secondary" onClick={open.retry}>Try again</Button>
      </div>
    )
    : open.state === 'open' ? (
      <>
        {!open.listed && <EmptyNote>This sample isn’t in your library right now.</EmptyNote>}
        {inspector(open.sample, open.factory, open.factory ? undefined : shareOpen)}
      </>
    )
    : <EmptyNote>Reading the sample…{open.state === 'reading' && open.pct !== null && ` ${open.pct}%`}</EmptyNote>
  ) : loadNew ? inspector()
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
