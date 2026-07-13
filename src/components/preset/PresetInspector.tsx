import { useMemo } from 'react';
import type { PresetEntry } from '@/lib/library/preset-entries';
import { pullPreset } from '@/lib/device/presets';
import { downloadBytes } from '@/lib/download';
import type { NordSession } from '@/lib/device/session';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { parseNs4Preset } from '@/lib/ns4/preset';
import { Button } from '@/components/ui';

const KIND_LABEL: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'Organ preset', 'piano-preset': 'Piano preset', 'synth-preset': 'Synth preset',
};
// Download filename extension by kind. Device presets are Stage-4-only (ns4o/n/y); a folder-sourced ns3y/ns2y synth preset downloads as .ns4y — its bytes are unchanged, only the filename ext.
const KIND_EXT: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'ns4o', 'piano-preset': 'ns4n', 'synth-preset': 'ns4y',
};

/** Preset detail: for Stage 4 organ/piano/synth presets we have the bytes for,
 *  the decoded engine parameters; otherwise metadata + download. */
export function PresetInspector({ entry, session }: { entry: PresetEntry; session: NordSession | null }) {
  const { busy, error, run } = useAsyncAction();
  // Decode when we already hold the bytes (folder/local files); device presets
  // stay metadata-only until pulled. parseNs4Preset returns null for ns3y/ns2y.
  const decoded = useMemo(() => (entry.bytes ? parseNs4Preset(entry.bytes) : null), [entry.bytes]);

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

  const where = entry.source === 'nord' ? `On Nord${entry.slot ? ` · ${entry.slot}` : ''}` : 'Local file';

  return (
    <div className="ps" style={{ maxWidth: 560 }}>
      <div className="ps-nm">{entry.name}</div>
      <p className="ps-sub" style={{ marginTop: 6 }}>
        {KIND_LABEL[entry.kind]}{decoded?.headline ? ` · ${decoded.headline}` : ''} · {where}
      </p>

      {decoded ? (
        decoded.layers.map((layer) => (
          <div key={layer.letter}>
            {decoded.layers.length > 1 && (
              <p className="ps-sub" style={{ fontWeight: 700, marginTop: 12 }}>
                Layer {layer.letter}{layer.headline ? ` · ${layer.headline}` : ''}
              </p>
            )}
            <table className="ps-params">
              <tbody>
                {layer.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>
                      {r.display}
                      {r.morphs.wheel && <span className="ps-morph" title={`wheel → ${r.morphs.wheel}`}>✎W</span>}
                      {r.morphs.at && <span className="ps-morph" title={`aftertouch → ${r.morphs.at}`}>✎A</span>}
                      {r.morphs.pedal && <span className="ps-morph" title={`pedal → ${r.morphs.pedal}`}>✎P</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p className="ps-sub">This preset is recognized but not opened in detail — OpenNord lists and moves presets without decoding them.</p>
      )}

      <Button variant="primary" onClick={() => void download()} disabled={busy}>
        {busy ? 'Working…' : 'Download'}
      </Button>
      {error && <p className="ps-sub on-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
