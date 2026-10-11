import { useMemo, useState } from 'react';
import type { PresetEntry } from '@/lib/library/preset-entries';
import { pullPreset } from '@/lib/device/presets';
import { downloadBytes } from '@/lib/download';
import type { NordSession } from '@/lib/device/session';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { parseNs4Preset, type Ns4Preset } from '@/lib/ns4/preset';
import { presetVoices, presetParamSections } from '@/lib/ns4/preset-view';
import { filterRows } from '@/lib/ns4/params-view';
import { Button } from '@/components/ui';
import { EngineCard } from '@/components/program/EngineCard';
import { FxRow } from '@/components/program/FxRow';
import { IdentityLcd } from '@/components/program/widgets';

const KIND_LABEL: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'Organ preset', 'piano-preset': 'Piano preset', 'synth-preset': 'Synth preset',
};
// Download filename extension by kind. Device presets are Stage-4-only (ns4o/n/y); a folder-sourced ns3y/ns2s synth preset downloads as .ns4y — its bytes are unchanged, only the filename ext.
const KIND_EXT: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'ns4o', 'piano-preset': 'ns4n', 'synth-preset': 'ns4y',
};

/** Preset detail: for Stage 4 organ/piano/synth presets we have the bytes for,
 *  the sound drawn as its engine panel (the Program view's cards) with the full
 *  parameter list behind a drawer; otherwise metadata + download. */
export function PresetInspector({ entry, session }: { entry: PresetEntry; session: NordSession | null }) {
  const { busy, error, run } = useAsyncAction();
  // Decode when we already hold the bytes (folder/local files); device presets
  // stay metadata-only until pulled. parseNs4Preset returns null for ns3y/ns2s.
  const decoded = useMemo(() => (entry.bytes ? parseNs4Preset(entry.bytes) : null), [entry.bytes]);
  const voices = useMemo(() => (decoded ? presetVoices(decoded) : []), [decoded]);

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
  const stacked = voices.length > 1;

  return (
    <div className="ps">
      <div className="ps-hd">
        <div className="ps-hd-id">
          <IdentityLcd name={entry.name} lines={[`${KIND_LABEL[entry.kind]} · ${where}`]} />
        </div>
        <Button variant="primary" onClick={() => void download()} disabled={busy}>
          {busy ? 'Working…' : 'Download'}
        </Button>
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}

      {decoded ? (
        <>
          {voices.map((v) => (
            <section className="ps-panel" key={v.letter}>
              {stacked && <div className="ps-panel-lbl">Layer {v.letter}</div>}
              <div className="ps-preset-grid">
                <EngineCard card={v.card} />
                <FxRow chips={v.fxChips} title="FX" />
              </div>
            </section>
          ))}
          <PresetParams preset={decoded} />
        </>
      ) : (
        <p className="ps-sub">This preset is recognized but not opened in detail — OpenNord lists and moves presets without decoding them.</p>
      )}
    </div>
  );
}

/** Every parameter of the preset, for reference: collapsed by default, split
 *  into panel sections, searchable (the Program view's "all parameters" drawer). */
function PresetParams({ preset }: { preset: Ns4Preset }) {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const stacked = preset.layers.length > 1;
  const layers = preset.layers.map((l) => ({ letter: l.letter, sections: presetParamSections(filterRows(l.rows, query)) }));
  const total = preset.layers.reduce((n, l) => n + l.rows.length, 0);
  const none = searching && layers.every((l) => l.sections.length === 0);

  return (
    <details className="ps-drawer">
      <summary>Show all parameters ({total})</summary>
      <input
        className="ps-param-search"
        placeholder="Search parameters…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search parameters"
      />
      {none && <p className="ps-sub">No parameters match “{query}”.</p>}
      {layers.flatMap((l) => l.sections.map((g) => (
        <details className="ps-pgroup" key={`${l.letter}-${g.key}`} open={searching}>
          <summary>
            {g.label}
            {stacked && <span className="ps-player">{l.letter}</span>}
            <span className="ps-pgroup-n">{g.rows.length}</span>
          </summary>
          <table className="ps-params">
            <tbody>
              {g.rows.map((r, i) => (
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
        </details>
      )))}
    </details>
  );
}
