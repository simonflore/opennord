import type { BundleDescriptor } from '../../lib/folder/pipeline';
import { Button } from '../ui';

/** Pick which folder .ns4b to organize when several are present. */
export function BundleChooser({ bundles, onPick }: {
  bundles: BundleDescriptor[];
  onPick: (path: string) => void;
}) {
  return (
    <div className="ps">
      <div className="ps-nm">Organize which backup?</div>
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
