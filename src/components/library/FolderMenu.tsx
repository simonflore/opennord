import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '../ui';
import type { FolderLibrary } from '@/lib/folder/useFolderLibrary';

/**
 * The connected folder as one item, with what can be done to it in its menu:
 * Rescan (or Reconnect, after a reload that lost access), Change and Forget.
 * In the rail's Sources on a wide screen; in the list's toolbar on a phone,
 * where the rail is hidden. Nothing without a folder: choosing one is in each
 * list's Add menu.
 */
export function FolderMenu({ folder, place, className }: {
  folder: FolderLibrary | null;
  place: 'rail' | 'toolbar';
  className?: string;
}) {
  if (!folder?.folderName) return null;
  const { folderName, canPersist, needsReconnect, busy } = folder;
  const files = folder.result.programs.length + folder.result.samples.length;
  const summary = `${files} ${files === 1 ? 'file' : 'files'}`;
  return (
    <Menu
      label={`Folder ${folderName}`}
      align={place === 'rail' ? 'start' : 'end'}
      trigger={<FolderTrigger place={place} className={className} name={folderName} summary={busy ? 'scanning…' : summary} attention={needsReconnect} />}
    >
      <MenuLabel>{folderName}</MenuLabel>
      {needsReconnect
        ? <MenuItem onSelect={() => void folder.reconnect()} disabled={busy} hint="Your browser asks again after a reload">Reconnect folder</MenuItem>
        : canPersist && <MenuItem onSelect={() => void folder.refresh()} disabled={busy} hint="Pick up files added or changed since">Rescan folder</MenuItem>}
      <MenuItem onSelect={() => void folder.choose()} disabled={busy}>Change folder…</MenuItem>
      <MenuSeparator />
      {/* Never disabled: it's the way out of a scan or a prompt that hangs. */}
      <MenuItem tone="quiet" onSelect={() => void folder.forget()} hint="Your files stay where they are">Forget folder</MenuItem>
    </Menu>
  );
}

/** The folder's name and how many files it gave; Radix hands its ref and handlers through (asChild). */
function FolderTrigger({ place, name, summary, attention, className, ...rest }: ComponentProps<'button'> & {
  place: 'rail' | 'toolbar'; name: string; summary: string; attention: boolean;
}) {
  return (
    <button
      type="button"
      title={name}
      className={cn(
        'cursor-pointer items-center text-dim transition-colors duration-[120ms] hover:text-ink',
        'focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]',
        place === 'rail'
          // Set like the rail's own entries.
          ? 'flex w-full gap-2 border-0 bg-transparent py-1.5 pr-4 pl-4 text-left font-mono text-xs lowercase hover:tint-hover focus-visible:-outline-offset-2'
          : 'inline-flex max-w-[220px] gap-1.5 rounded-md border border-line bg-transparent px-2.5 py-1.5 text-[13px]',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true">📁</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className={attention ? 'text-warn' : 'text-muted'}>{attention ? 'reconnect' : summary}{place === 'toolbar' && ' ▾'}</span>
    </button>
  );
}
