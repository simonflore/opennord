import { useState } from 'react';
import { SamplesBrowse } from './SamplesBrowse';
import { SampleInspector, type InspectorInput } from './SampleInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { useSamplesState } from '@/lib/library/SamplesContext';
import { useDevice } from '@/lib/device/DeviceContext';
import { pullSample } from '@/lib/device/samples';
import { useSplitLayout } from '@/lib/responsive';
import type { SampleEntry } from '@/lib/library/sample-entries';
import { getErrorMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/file';
import { useFolder } from '@/lib/folder/FolderContext';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';

/**
 * The Samples screen as master/detail. Folder samples open in the inspector
 * (bytes in hand); device samples are pulled off the board with progress, then
 * opened in the same inspector — staying on the Samples screen. "+ Import sample"
 * persists a file and opens it; "Preview a file" opens the inspector's own
 * drag/drop/pick zone for a throwaway look (not stored).
 */
export function SamplesSplit() {
  const wide = useSplitLayout();
  const s = useSamplesState();
  const { session } = useDevice();
  const folder = useFolder();
  // The thing currently shown in the detail pane: pulled/folder bytes, or null.
  const [inspect, setInspect] = useState<InspectorInput | null>(null);
  const [loadNew, setLoadNew] = useState(false);
  const [pullPct, setPullPct] = useState<number | null>(null);
  const [pullError, setPullError] = useState('');

  async function openEntry(e: SampleEntry) {
    setPullError('');
    if (e.source === 'local' && e.bytes) {
      setLoadNew(false);
      setInspect({ bytes: e.bytes, name: e.name });
      return;
    }
    if (e.source === 'nord' && e.device && session) {
      setLoadNew(false); setInspect(null); setPullPct(0);
      try {
        const bytes = await pullSample(session, e.device,
          (done, total) => setPullPct(total ? Math.round((done / total) * 100) : 0));
        setInspect({ bytes, name: e.name });
      } catch (err) {
        setPullError(`Could not read ${e.name}: ${getErrorMessage(err)}`);
      } finally {
        setPullPct(null);
      }
      return;
    }
    if (e.source === 'backup' && e.backupRef) {
      setLoadNew(false); setInspect(null); setPullPct(0);
      try {
        const bytes = await extractBackupEntry(folder, e.backupRef);
        setInspect({ bytes, name: e.name, factory: e.factory });
      } catch (err) {
        setPullError(`Could not read ${e.name}: ${getErrorMessage(err)}`);
      } finally {
        setPullPct(null);
      }
      return;
    }
  }
  const startLoadNew = () => { setInspect(null); setLoadNew(true); setPullError(''); };
  const back = () => { setInspect(null); setLoadNew(false); setPullError(''); };

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
        setPullError(`“${f.name}” isn’t a Nord sample (.nsmp, .nsmp3 or .nsmp4). Programs belong on the Library page.`);
        return;
      }
      setPullError('');
      const bytes = await readFileBytes(f);
      await s.importSample(f);                  // persist + add to the list
      setLoadNew(false);
      setInspect({ bytes, name: f.name });      // open it now
    };
    input.oncancel = cleanup;
    input.click();
  }

  const status = pullPct !== null
    ? <p className="ps-sub">Pulling sample… {pullPct}%</p>
    : pullError
      ? <p className="ps-sub" role="alert">{pullError}</p>
      : null;

  const list = (
    <div className="lib-master">
      {status}
      <SamplesBrowse
        entries={s.shown}
        source={s.source} generation={s.generation} query={s.query}
        nordCount={s.nordCount} localCount={s.localCount}
        showSourceFacet={s.showSourceFacet} showUnknownGen={s.showUnknownGen}
        onSource={s.setSource} onGeneration={s.setGeneration} onQuery={s.setQuery}
        onOpen={(e) => void openEntry(e)} onLoadNew={startLoadNew}
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
  const hasDetail = loadNew || inspect !== null;
  const detail = hasDetail ? inspector : <p className="lib-empty">Pick a sample to inspect it.</p>;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={detail}
      hasDetail={hasDetail}
      onBack={back}
      backLabel="← Samples"
    />
  );
}
