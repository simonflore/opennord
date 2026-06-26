import type { PresetEntry } from '@/lib/library/preset-entries';
import { pullPreset } from '@/lib/device/presets';
import { downloadBytes } from '@/lib/download';
import type { NordSession } from '@/lib/device/session';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Button } from '@/components/ui';

const KIND_LABEL: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'Organ preset', 'piano-preset': 'Piano preset', 'synth-preset': 'Synth preset',
};
// Download filename extension by kind. Device presets are Stage-4-only (ns4o/n/y); a folder-sourced ns3y/ns2y synth preset downloads as .ns4y — its bytes are unchanged, only the filename ext.
const KIND_EXT: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'ns4o', 'piano-preset': 'ns4n', 'synth-preset': 'ns4y',
};

/** Thin, decode-free detail for a recognized preset: metadata + download. */
export function PresetInspector({ entry, session }: { entry: PresetEntry; session: NordSession | null }) {
  const { busy, error, run } = useAsyncAction();

  async function download() {
    if (busy) return;
    await run(async () => {
      const bytes = entry.bytes
        ?? (entry.device && entry.partition != null && session
          ? await pullPreset(session, entry.device, entry.partition)
          : null);
      if (!bytes) throw new Error('Connect your Nord to download this preset.');
      downloadBytes(bytes, `${entry.name}.${KIND_EXT[entry.kind]}`);
    }, (e) => `Couldn't download ${entry.name}: ${getErrorMessage(e)}`);
  }

  return (
    <div className="ps" style={{ maxWidth: 460 }}>
      <div className="ps-nm">{entry.name}</div>
      <p className="ps-sub" style={{ marginTop: 6 }}>
        {KIND_LABEL[entry.kind]} · {entry.source === 'nord' ? `On Nord${entry.slot ? ` · ${entry.slot}` : ''}` : 'Local file'}
      </p>
      <p className="ps-sub">This preset is recognized but not opened in detail — OpenNord lists and moves presets without decoding them.</p>
      <Button variant="primary" onClick={() => void download()} disabled={busy}>
        {busy ? 'Working…' : 'Download'}
      </Button>
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
