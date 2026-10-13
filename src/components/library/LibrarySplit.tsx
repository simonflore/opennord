import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Blueprint, Button, Dialog } from '@/components/ui';
import { ItemActions } from './ItemActions';
import { RemoveFromLibraryDialog } from './CardRemoveButton';
import { PushFlowPanel } from '@/components/device/PushFlowPanel';
import { usePushFlow } from '@/components/device/usePushFlow';
import { useDevice } from '@/lib/device/DeviceContext';
import { identifyDevice } from '@/lib/device/connect-probe';
import { NS4_PRODUCT_ID } from '@/lib/device/negotiate';
import { sendRefusal } from '@/lib/device/send-check';
import { READ_ONLY_REASON } from '@/lib/device/write-guard';
import { hasCbinMagic, readCbinHeader } from '@/lib/clavia/cbin';
import { safeFilename } from '@/lib/ns4/bundle';
import { downloadBytes } from '@/lib/download';
import { isImported, type LibraryEntry } from '@/lib/library/types';
import { LibraryView } from './LibraryView';
import { useStepKeys } from './useStepKeys';
import { useFullViewKeys } from './useFullViewKeys';
import { ProgramView } from '@/components/program/ProgramView';
import { CategorySplit } from './CategorySplit';
import { EmptyNote, NotListedNote } from './EmptyNote';
import { useLibraryState } from '@/lib/library/LibraryContext';
import { useSplitLayout } from '@/lib/responsive';
import { useCloseRemoved, useOpenEntry } from './openEntry';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import { COMMUNITY_SHARE_TO } from '@/components/shell/nav';

const noop = () => {};

/**
 * The Library as master/detail. `/library/programs/{-$programId}` renders
 * this: at wide widths the list stays visible beside a detail pane; below the
 * split breakpoint it shows one pane at a time (today's full-page behavior).
 */
export function LibrarySplit({ selectedId, full = false, onFull }: {
  selectedId?: string;
  /** The open program across the full width (`?view=full`), wide screens only. */
  full?: boolean;
  /** Open or close the full view; without it there's no full view. */
  onFull?: (on: boolean) => void;
}) {
  const wide = useSplitLayout();
  const s = useLibraryState();
  const closeRemoved = useCloseRemoved('/library/programs');
  const open = useOpenEntry();
  const entry = selectedId ? s.entryById(selectedId) : undefined;
  // A Nord slot opens like any program: it's read from the keyboard on the way.
  // A read that failed waits for Try again rather than repeating on its own.
  const { reading, failed, read } = s.nord;
  const unread = entry?.source === 'nord' && !entry.program ? entry.id : undefined;
  useEffect(() => {
    if (unread && !reading && failed?.id !== unread) read(unread);
  }, [unread, reading, failed, read]);
  // J/K step through the programs, here so they keep working with the list folded away (narrow).
  useStepKeys(s.shown, selectedId, open.program);
  // Stable, so the program table's memoised rows skip renders that don't touch them.
  const { remove } = s.imported;
  const onRemove = useCallback((id: string) => void remove(id).then(() => closeRemoved(id)), [remove, closeRemoved]);

  const list = (
    <LibraryView
      entries={s.shown}
      source={s.source}
      query={s.query}
      onSource={s.setSource}
      generation={s.generation}
      onGeneration={s.setGeneration}
      generationsPresent={s.generationsPresent}
      category={s.category}
      onCategory={s.setCategory}
      categoriesPresent={s.categoriesPresent}
      onQuery={s.setQuery}
      clearFilters={s.clearFilters}
      filtered={s.filtered}
      activeId={selectedId}
      onOpen={open.program}
      onImport={s.importFile}
      onRemove={onRemove}
      importError={s.importError}
      onDismissImportError={s.clearImportError}
      prefs={s.prefs}
      folder={s.folder}
      engines={s.engines}
      onToggleEngine={s.toggleEngine}
      splitOnly={s.splitOnly}
      onSplitOnly={s.setSplitOnly}
    />
  );

  // The program view (when loaded) is the same node in both layouts; only the
  // "nothing to show" copy differs — narrow points back to the list (which is
  // hidden behind the back button), wide points at the list beside it.
  // Keyed per program: the list and programs share one route now, so without a
  // key the next program would inherit this one's view state (its scene).
  const program = entry?.program ? <ProgramView key={entry.id} program={entry.program} /> : null;
  // The inspector is a quick look; the full view gives the engines the page.
  // Only wide, where the list sits beside the program: narrow already shows it alone.
  const canFull = wide && !!program && !!onFull;
  const showFull = canFull && full;
  useFullViewKeys(canFull, showFull, onFull ?? noop);

  // The open program's actions: Send to Nord · Save to computer · More.
  const device = useDevice();
  const push = usePushFlow(device.session, device.refresh, device.productId === NS4_PRODUCT_ID); // focus: seen to answer on a Stage 4 only
  // A send belongs to the Nord it was started for: after an unplug and a reconnect
  // (maybe to another Nord) the picked slot and what it held are stale, so it ends.
  const [pushFor, setPushFor] = useState<typeof device.session>(null);
  const { cancel: cancelPush } = push;
  useEffect(() => { if (device.session !== pushFor) cancelPush(); }, [device.session, pushFor, cancelPush]);
  const [removing, setRemoving] = useState<LibraryEntry | null>(null);
  // Sharing is a build-injected route: offered only where the community is there,
  // and for a program that's a file of yours (a Nord slot is shared once it's kept).
  const canShare = useCapabilities().community.available;
  const navigate = useNavigate();
  const bytes = entry?.bytes;
  const actions = entry && bytes && (
    <ItemActions
      send={{
        onSend: () => { setPushFor(device.session); push.startPush({ bytes, name: entry.name }); },
        disabledReason: !device.session ? 'Connect your Nord to send it.'
          : !device.session.canWrite(device.session.programPartition) ? READ_ONLY_REASON
          : sendRefusal(bytes, identifyDevice(device.productId).model),
      }}
      save={{ onSave: () => downloadBytes(bytes, programFilename(entry, bytes)) }}
      more={[
        ...(canShare && entry.source !== 'nord'
          ? [{ label: 'Share to community', onSelect: () => void navigate({ to: COMMUNITY_SHARE_TO, search: { program: entry.id } as never }) }]
          : []),
        ...(isImported(entry.id) ? [{ label: 'Remove from library', onSelect: () => setRemoving(entry) }] : []),
      ]}
    />
  );

  // The blueprint frame is mounted HERE rather than on the shell's <main>
  // (routes/root.tsx) on purpose: <main> is shared by every app screen, and
  // mounting it there would silently ship the grid to device, samples,
  // compatibility and dev before any of them has been looked at.
  // `quiet` keeps patch density the subject; the frame stays at the page
  // boundary and never enters a row or card.
  return (
    <div className="relative">
      <Blueprint variant="quiet" />
      <div className="relative z-10">
        <CategorySplit
          wide={wide}
          master={list}
          detail={(program ? (
            // The bar scrolls away with the page (it wraps on a phone, beside a reason
            // to connect); the program's own header is what stays pinned.
            <div>
              <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 pb-1">
                {canFull && (
                  <Button variant="ghost" onClick={() => onFull(!showFull)} aria-keyshortcuts={showFull ? 'F Escape' : 'F'}>
                    {showFull ? '← Programs' : 'Full view'}
                    <kbd aria-hidden="true" className="font-mono text-[10px] text-muted">{showFull ? 'Esc' : 'F'}</kbd>
                  </Button>
                )}
                <div className="ml-auto">{actions}</div>
              </div>
              {program}
            </div>
          ) : null)
            ?? (unread ? <NordReadNote name={entry!.name} failed={failed?.id === unread ? failed.message : undefined} onRetry={() => read(unread)} />
              : selectedId && !entry ? <NotListedNote noun="program" /> : null)}
          hasDetail={!!selectedId}
          // Nothing open: the table spans the page, every column showing. Open,
          // on a wide screen, the program sits in an inspector column beside it.
          solo={!selectedId}
          inspector
          full={showFull}
          list="/library/programs"
          backLabel="← Library"
          selectedId={selectedId}
        />
      </div>
      {push.pushSource && device.session && device.session === pushFor && (
        // While it writes, it can't be dismissed: the write would go on unseen, and its error with it.
        <Dialog open portal onClose={() => { if (!push.busy) push.cancel(); }} title="Send to Nord" className="w-[min(96vw,760px)]">
          <PushFlowPanel push={push} entries={device.entries} />
        </Dialog>
      )}
      {removing && (
        <RemoveFromLibraryDialog
          name={removing.name}
          onCancel={() => setRemoving(null)}
          onRemove={() => { const id = removing.id; setRemoving(null); onRemove(id); }}
        />
      )}
    </div>
  );
}

/** The detail while a Nord slot is read from the keyboard, or why it couldn't be. */
function NordReadNote({ name, failed, onRetry }: { name: string; failed?: string; onRetry: () => void }) {
  if (!failed) return <EmptyNote><span role="status">Reading “{name}” from your Nord…</span></EmptyNote>;
  return (
    <EmptyNote>
      <p role="alert" className="m-0 mb-2">Couldn’t read “{name}” from your Nord: {failed}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </EmptyNote>
  );
}

/** The file name a program is saved under: its name and its own kind of file. */
function programFilename(entry: LibraryEntry, bytes: Uint8Array): string {
  const ext = entry.typeLabel ?? (hasCbinMagic(bytes) ? `.${readCbinHeader(bytes).tag}` : '.ns4p');
  return `${safeFilename(entry.name)}${ext}`;
}
