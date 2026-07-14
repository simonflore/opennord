import { useState } from 'react';
import { Dialog, Button } from '../ui';
import type { BundleDescriptor } from '../../lib/folder/pipeline';

export interface BundlePickerProps {
  open: boolean;
  /** The new/undecided backups to choose from. */
  bundles: BundleDescriptor[];
  /** Load these backups (paths); the rest are remembered as skipped. */
  onConfirm: (loadPaths: string[]) => void;
  /** Dismiss without choosing (treated as "Skip" by the caller). */
  onClose: () => void;
}

function backupName(path: string): string {
  return (path.split('/').pop() ?? path).replace(/\.ns4b$/i, '');
}
function sizeLabel(bytes: number): string {
  return bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`;
}

export function BundlePicker({ open, bundles, onConfirm, onClose }: BundlePickerProps) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(bundles.map((b) => b.path)));
  const toggle = (path: string) =>
    setChecked((s) => { const n = new Set(s); if (n.has(path)) n.delete(path); else n.add(path); return n; });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Load which backups?"
      footer={
        <>
          <Button variant="ghost" onClick={() => onConfirm([])}>Skip backups</Button>
          <Button variant="primary" onClick={() => onConfirm(bundles.filter((b) => checked.has(b.path)).map((b) => b.path))}>
            Load selected
          </Button>
        </>
      }
    >
      <p className="bundle-picker__hint">This folder has several backups. Pick the ones to add to your library.</p>
      <ul className="bundle-picker__list">
        {bundles.map((b) => (
          <li key={b.path} className="bundle-picker__row">
            <label>
              <input type="checkbox" checked={checked.has(b.path)} onChange={() => toggle(b.path)} />
              <span className="bundle-picker__name">{backupName(b.path)}</span>
              <span className="bundle-picker__size">{sizeLabel(b.size)}</span>
            </label>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
