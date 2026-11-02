import type { ReactNode } from 'react';
import { Button, Menu, MenuItem } from '../ui';
import type { FolderLibrary } from '@/lib/folder/useFolderLibrary';

/** Said where a folder is chosen, in a browser that can't keep one linked (it's picked anew each visit). */
export const ONE_SHOT_FOLDER_NOTE = 'This browser can’t remember a folder, so you choose it each visit.';

/**
 * A list's one way to add to the library: import a file (copied into
 * OpenNord), or choose a folder (read where it is; nothing is copied).
 * `children` are a list's own
 * ways to add, listed first (Pianos: make one from a sample, in place of an import).
 */
export function AddMenu({ folder, noun, onImport, children }: {
  /** The folder source; without one (no provider) there's no folder to choose. */
  folder: FolderLibrary | null;
  /** What the list holds, for the import's hint ("a program file"). */
  noun?: string;
  onImport?: () => void;
  children?: ReactNode;
}) {
  return (
    <Menu label="Add to library" trigger={<Button variant="primary">+ Add</Button>}>
      {children}
      {onImport && <MenuItem onSelect={onImport} hint={`Keeps a copy of ${noun} in OpenNord`}>Import a file…</MenuItem>}
      {folder && (
        <MenuItem
          onSelect={() => void folder.choose()} disabled={folder.busy}
          hint={folder.canPersist ? 'Reads the Nord files in it, where they are' : `Reads the Nord files in it, where they are. ${ONE_SHOT_FOLDER_NOTE}`}
        >
          {folder.folderName ? 'Change folder…' : 'Choose a folder…'}
        </MenuItem>
      )}
    </Menu>
  );
}
