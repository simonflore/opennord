import './library.css';
import { Button, BrowseToolbar, type FacetGroup } from '../ui';
import { CategoryPanel } from './CategoryPanel';
import { LibraryCard } from './LibraryCard';
import { LibraryEmpty } from './LibraryEmpty';
import { BundlePicker } from './BundlePicker';
import { NewBackupsBanner } from './NewBackupsBanner';
import { EngineTags } from './EngineTags';
import { ZoneStrip } from './ZoneStrip';
import { SlotTag, genTone } from './SlotTag';
import { CardRemoveButton } from './CardRemoveButton';
import type { LibraryEntry, LibrarySource, LibrarySort } from '../../lib/library/types';
import type { LibraryPrefsApi } from '../../lib/library/prefs';
import type { FolderLibrary } from '../../lib/folder/useFolderLibrary';

interface Props {
  entries: LibraryEntry[];
  source: LibrarySource | 'all';
  query: string;
  onSource: (s: LibrarySource | 'all') => void;
  /** Format-generation facet (Stage 2/3/4). Shown only when >1 generation is present. */
  generation?: LibraryEntry['generation'] | 'all';
  onGeneration?: (g: LibraryEntry['generation'] | 'all') => void;
  generationsPresent?: Array<NonNullable<LibraryEntry['generation']>>;
  /** Musical-category facet (Bass, Pad, Organ…). Shown only when >1 category is present. */
  category?: string | 'all';
  onCategory?: (c: string | 'all') => void;
  categoriesPresent?: string[];
  onQuery: (q: string) => void;
  onOpen: (e: LibraryEntry) => void;
  /** The entry open in the detail pane, highlighted in the list. */
  activeId?: string;
  onImport: () => void;
  /** Remove an imported program (local source only). */
  onRemove: (id: string) => void;
  /** Message shown when an import was rejected (wrong file type); '' when none. */
  importError?: string;
  onDismissImportError?: () => void;
  /** Sort order + favorites (organize). */
  prefs: LibraryPrefsApi;
  /** The connected folder source (name, scan results, connect/refresh/forget). */
  folder: FolderLibrary;
}

const TABS: Array<LibrarySource | 'all'> = ['all', 'nord', 'local', 'backup', 'cloud'];
const TAB_LABEL: Record<LibrarySource | 'all', string> = { all: 'All', nord: 'On Nord', local: 'Local', backup: 'Backup', cloud: 'Cloud' };

const SORT_LABEL: Record<LibrarySort, string> = { default: 'Default', name: 'Name (A–Z)', source: 'Source' };

export function LibraryView({
  entries, source, query, onSource, onQuery, onOpen, onImport, onRemove, activeId,
  generation = 'all', onGeneration, generationsPresent = [],
  category = 'all', onCategory, categoriesPresent = [],
  importError, onDismissImportError, prefs, folder,
}: Props) {
  // Unpack the grouped props so the JSX below reads the same as before.
  const { sort, setSort: onSort, favorites, toggleFavorite: onToggleFavorite } = prefs;
  const { folderName, canPersist, needsReconnect, busy, reconnectError } = folder;
  const onChooseFolder = folder.choose, onReconnect = folder.reconnect, onRefresh = folder.refresh, onForget = folder.forget;
  const folderCount = folder.result.programs.length + folder.result.samples.length;
  const scanErrors = folder.result.errors;
  // Folder-level failures (a failed pick itself, not one unreadable file
  // inside it — the Android/Google-Drive empty-selection case is exactly
  // this) carry the actual guidance text. Touch-only Android users can't
  // hover a tooltip, so those need to render inline; per-file errors keep
  // the existing hover-summary treatment.
  const folderScanErrors = scanErrors.filter((e) => e.path === '(folder)');
  const fileScanErrors = scanErrors.filter((e) => e.path !== '(folder)');

  const nord = entries.filter((e) => e.source === 'nord').length;
  const local = entries.length - nord;

  // When a search/facet is hiding everything, show the shared "no match" state
  // rather than the first-run onboarding (which would wrongly read as "empty").
  const filtered = query.trim() !== '' || source !== 'all'
    || (generationsPresent.length > 1 && (generation ?? 'all') !== 'all')
    || (categoriesPresent.length > 1 && (category ?? 'all') !== 'all');
  const clearFilters = () => { onQuery(''); onSource('all'); onGeneration?.('all'); onCategory?.('all'); };

  // A folder is connected but turned up nothing at all — distinct from never
  // having picked one, and distinct from "found presets/pianos/samples/backups
  // but no programs" (those aren't program `entries` but they are real finds,
  // so the folder isn't actually empty). Telling the user to "choose a folder"
  // reads as if their pick didn't register at all, which is exactly what
  // happens on Android when a Google Drive (or other cloud-backed) folder is
  // chosen: the browser hands back zero readable files with no error, so
  // scanErrors is empty too.
  const folderResult = folder.result;
  const folderFoundNothing = folderResult.presets.length === 0 && folderResult.pianos.length === 0
    && folderResult.samples.length === 0 && folder.bundles.length === 0;
  const connectedButEmpty = !!folderName && !busy && !needsReconnect && scanErrors.length === 0 && folderFoundNothing;

  const facets: FacetGroup[] = [
    {
      ariaLabel: 'Filter by source',
      value: source,
      options: TABS.map((t) => ({ key: t, label: TAB_LABEL[t] })),
      onChange: (k) => onSource(k as LibrarySource | 'all'),
    },
    ...(generationsPresent.length > 1 ? [{
      ariaLabel: 'Filter by format',
      value: generation ?? 'all',
      options: [{ key: 'all', label: 'All' }, ...generationsPresent.map((g) => ({ key: g, label: g }))],
      onChange: (k: string) => onGeneration?.(k as LibraryEntry['generation'] | 'all'),
    }] : []),
    ...(categoriesPresent.length > 1 ? [{
      ariaLabel: 'Filter by category',
      value: category ?? 'all',
      options: [{ key: 'all', label: 'All' }, ...categoriesPresent.map((c) => ({ key: c, label: c }))],
      onChange: (k: string) => onCategory?.(k),
    }] : []),
  ];

  const actions = (
    <>
      {folderName ? (
        <span className="inline-flex items-center gap-2 text-[13px] text-dim" title={folderName}>
          📁 {folderName} · {folderCount} {folderCount === 1 ? 'file' : 'files'}
          {canPersist && !needsReconnect
            ? <Button variant="ghost" className="px-2 py-0.5" onClick={onRefresh} disabled={busy} aria-label="Refresh folder">⟳</Button>
            : <Button variant="ghost" className="px-2 py-0.5" onClick={onChooseFolder} disabled={busy}>Re-pick</Button>}
          {/* Disconnect only forgets the folder pointer — it never touches the user's files. */}
          <Button variant="ghost" className="px-2 py-0.5" onClick={onForget} aria-label="Disconnect folder" title="Disconnect this folder">✕</Button>
        </span>
      ) : (
        <Button variant="ghost" onClick={onChooseFolder} disabled={busy}>Choose folder</Button>
      )}
      <Button variant="primary" onClick={onImport}>+ Import file</Button>
    </>
  );

  const headExtra = (
    <>
      {needsReconnect && folderName && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-line px-[14px] py-2.5 text-ink">
          {reconnectError
            ? <span className="text-danger">{reconnectError}</span>
            : <span>Reconnect <strong>{folderName}</strong> to load your patches.</span>}
          <Button variant="ghost" onClick={onReconnect} disabled={busy}>Reconnect</Button>
          {/* Never disabled: Forget only clears local state, so it stays the
              escape hatch when a pending browser dialog has wedged `busy`. */}
          <Button variant="ghost" onClick={onForget}>Forget</Button>
        </div>
      )}
      {folderScanErrors.map((e, i) => (
        <div key={i} className="mb-3 rounded-md border border-line px-[14px] py-2.5 text-[13px] text-ink" role="alert">
          {e.reason}
        </div>
      ))}
      {fileScanErrors.length > 0 && (
        <div className="mb-3 text-[13px] text-dim" title={fileScanErrors.map((e) => `${e.path} — ${e.reason}`).join('\n')}>
          {fileScanErrors.length} {fileScanErrors.length === 1 ? 'file' : 'files'} couldn't be read — hover for details.
        </div>
      )}
      {importError && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-line px-[14px] py-2.5 text-ink" role="alert">
          <span className="text-danger">{importError}</span>
          <Button variant="ghost" onClick={onDismissImportError}>Dismiss</Button>
        </div>
      )}
      {!folder.pickerOpen && (
        <NewBackupsBanner count={folder.newBundles.length} onReview={folder.openBundlePicker} />
      )}
      <BundlePicker
        open={folder.pickerOpen}
        bundles={folder.newBundles}
        onConfirm={(paths) => { void folder.applyBundleSelection(paths); }}
        onClose={() => { void folder.applyBundleSelection([]); }}
      />
    </>
  );

  return (
    <CategoryPanel
      title="Programs"
      counts={<>{entries.length} programs · {nord} on Nord · {local} local</>}
      actions={actions}
      headExtra={headExtra}
      toolbar={
        <BrowseToolbar
          query={query}
          onQuery={onQuery}
          placeholder="Search patches by name…"
          facets={facets}
          sort={sort}
          sortOptions={(Object.keys(SORT_LABEL) as LibrarySort[]).map((k) => ({ key: k, label: SORT_LABEL[k] }))}
          onSort={(k) => onSort(k as LibrarySort)}
          sortAriaLabel="Sort patches"
        />
      }
      isEmpty={entries.length === 0}
      emptyState={
        <LibraryEmpty noun="program" filtered={filtered} onClear={clearFilters}>
          {connectedButEmpty ? (
            <>
              <p>“{folderName}” is connected, but no Nord files turned up in it.</p>
              <p className="mt-2 text-[13px] text-dim [&_code]:text-ink">
                Check that it actually holds <code>.ns4p</code>/<code>.ns4b</code> files. On Android, a folder backed
                by Google Drive or another cloud app can look connected but hand over nothing readable — try making
                those files available offline (or moving them to on-device storage) and re-pick.
              </p>
              <Button variant="ghost" onClick={onChooseFolder} disabled={busy}>Choose a different folder</Button>
            </>
          ) : (
            <>
              <p>Nothing here yet.</p>
              <Button variant="primary" onClick={onChooseFolder} disabled={busy}>Choose a folder of Nord files</Button>
              <p className="mt-2 text-[13px] text-dim [&_code]:text-ink">Subfolders and <code>.ns4b</code> backups are included. Or import a single file, or connect your Nord.</p>
            </>
          )}
        </LibraryEmpty>
      }
    >
          {entries.map((e) => (
            <LibraryCard
              key={e.id}
              name={e.name}
              source={e.source}
              favorite={favorites.has(e.id)}
              onToggleFavorite={() => onToggleFavorite(e.id)}
              onOpen={() => onOpen(e)}
              selected={e.id === activeId}
              badge={<SlotTag tone={e.slot ? undefined : genTone(e.generation)}>{e.slot ?? e.typeLabel ?? 'file'}</SlotTag>}
              engines={e.engines
                ? <EngineTags summary={e.engines} />
                : <span className="text-[11px] text-muted">—</span>}
              strip={<ZoneStrip program={e.program} />}
              footExtras={e.source === 'local' && (
                <CardRemoveButton name={e.name} onRemove={(ev) => { ev.stopPropagation(); onRemove(e.id); }} />
              )}
            />
          ))}
    </CategoryPanel>
  );
}
