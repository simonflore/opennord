import type { BundleDescriptor } from '../../lib/folder/pipeline';
import { Button } from '../ui';

/** Pick which folder .ns4b to organize. Used both inside the Organizer (several
 *  bundles present) and on the Device landing (the linked folder's backups). */
export function BundleChooser({ bundles, onPick, title = 'Organize which backup?' }: {
  bundles: BundleDescriptor[];
  onPick: (path: string) => void;
  /** Heading above the list. */
  title?: string;
}) {
  return (
    <div className="ps">
      <div className="ps-nm">{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {bundles.map((b) => (
          <Button key={b.path} variant="secondary" onClick={() => onPick(b.path)}>
            {b.path.replace(/^.*\//, '')} · {(b.size / 1e9).toFixed(2)} GB
          </Button>
        ))}
      </div>
    </div>
  );
}
