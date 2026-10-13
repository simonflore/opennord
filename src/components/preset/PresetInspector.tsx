import type { PresetEntry } from '@/lib/library/preset-entries';
import { pullPreset } from '@/lib/device/presets';
import { downloadBytes } from '@/lib/download';
import type { NordSession } from '@/lib/device/session';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { ItemActions } from '../library/ItemActions';
import { IdentityLcd } from '@/components/program/widgets';
import { PresetPanel } from './PresetPanel';
import { useNavigate } from '@tanstack/react-router';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import { COMMUNITY_SHARE_TO } from '@/components/shell/nav';

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
  // Sharing is a build-injected route: offered where the community is there, for
  // a preset that's a file of yours (one still on the Nord has no bytes here).
  const canShare = useCapabilities().community.available && !!entry.bytes && entry.source !== 'nord';
  const navigate = useNavigate();

  async function download() {
    if (busy) return;
    await run(async () => {
      const bytes = entry.bytes
        ?? (entry.device && entry.partition != null && session
          ? await pullPreset(session, entry.device, entry.partition)
          : null);
      if (!bytes) throw new Error('Connect your Nord to save this preset.');
      downloadBytes(bytes, `${entry.name}.${KIND_EXT[entry.kind]}`);
    }, (e) => `Couldn't save ${entry.name}: ${getErrorMessage(e)}`);
  }

  const where = entry.source === 'nord' ? `On Nord${entry.slot ? ` · ${entry.slot}` : ''}` : 'Local file';

  return (
    // The Library page now uses the window's width (ui.css); a preset is one
    // or two cards and a parameter table, which read best at the old width.
    <div className="ps max-w-[960px]">
      <div className="ps-hd">
        <div className="ps-hd-id">
          <IdentityLcd name={entry.name} lines={[`${KIND_LABEL[entry.kind]} · ${where}`]} />
        </div>
        <ItemActions
          save={{ onSave: () => void download(), busy }}
          more={canShare ? [{ label: 'Share to community', onSelect: () => void navigate({ to: COMMUNITY_SHARE_TO, search: { item: entry.id } as never }) }] : []}
        />
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}

      <PresetPanel bytes={entry.bytes} />
    </div>
  );
}
