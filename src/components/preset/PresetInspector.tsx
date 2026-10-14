import { presetFileExt, type PresetEntry } from '@/lib/library/preset-entries';
import { copyHere, foundOn } from '@/lib/library/found-on';
import { SOURCE_LABEL } from '@/lib/library/types';
import { useCloudRead, type CloudSnapshotState } from '@/lib/library/CloudSnapshotContext';
import { Button } from '@/components/ui';
import { pullPreset } from '@/lib/device/presets';
import { downloadBytes } from '@/lib/download';
import type { NordSession } from '@/lib/device/session';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { ItemActions } from '../library/ItemActions';
import { IdentityLcd } from '@/components/program/widgets';
import { PresetPanel } from './PresetPanel';
import { useCanShareToCommunity, useShareToCommunity } from '@/components/shell/useShareToCommunity';

const KIND_LABEL: Record<PresetEntry['kind'], string> = {
  'organ-preset': 'Organ preset', 'piano-preset': 'Piano preset', 'synth-preset': 'Synth preset',
};

/** Preset detail: for Stage 4 organ/piano/synth presets we have the bytes for,
 *  the sound drawn as its engine panel (the Program view's cards) with the full
 *  parameter list behind a drawer; otherwise metadata + download. */
export function PresetInspector({ entry, session, cloud, onKeepCopy }: {
  entry: PresetEntry;
  session: NordSession | null;
  /** The cloud source, to fetch a preset found only there. */
  cloud?: Pick<CloudSnapshotState, 'read' | 'failed'>;
  /** Keep a copy in OpenNord's own storage; given for a preset with no copy on this computer. */
  onKeepCopy?: () => void;
}) {
  const { busy, error, run } = useAsyncAction();
  // Sharing is a build-injected route: offered where the community is there, for
  // a preset that's a file of yours (one still on the Nord or in the cloud isn't, until it's kept).
  const here = copyHere(entry);
  const shareable = useCanShareToCommunity() && entry.bytes ? here : undefined;
  const share = useShareToCommunity();
  // A cloud-only preset is fetched when it's shown; a fetch that failed waits for Try again.
  const cloudRead = useCloudRead(entry, cloud);

  async function download() {
    if (busy) return;
    await run(async () => {
      const bytes = entry.bytes
        ?? (entry.device && entry.partition != null && session
          ? await pullPreset(session, entry.device, entry.partition)
          : null);
      if (!bytes) throw new Error(entry.source === 'cloud' ? 'it hasn’t arrived from the cloud yet.' : 'Connect your Nord to save this preset.');
      downloadBytes(bytes, `${entry.name}.${presetFileExt(entry.kind, bytes)}`);
    }, (e) => `Couldn't save ${entry.name}: ${getErrorMessage(e)}`);
  }

  // Everywhere it is found, the slot after "On Nord"; a plain local preset still reads as a file.
  const sources = foundOn(entry);
  const where = sources.length === 1 && sources[0] === 'local' ? 'Local file'
    : sources.map((s) => (s === 'nord' && entry.slot ? `${SOURCE_LABEL[s]} · ${entry.slot}` : SOURCE_LABEL[s])).join(' · ');

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
          more={[
            ...(shareable ? [{ label: 'Share to community', onSelect: () => share(shareable.id) }] : []),
            ...(onKeepCopy ? [{ label: 'Keep a copy', onSelect: onKeepCopy }] : []),
          ]}
        />
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}

      {cloudRead.fingerprint ? (
        cloudRead.failed !== undefined ? (
          <div className="ps-sub">
            <p role="alert" className="m-0 mb-2">Couldn’t fetch it from the cloud: {cloudRead.failed}</p>
            <Button variant="secondary" onClick={cloudRead.retry}>Try again</Button>
          </div>
        ) : <p role="status" className="ps-sub">Fetching from the cloud…</p>
      ) : <PresetPanel bytes={entry.bytes} />}
    </div>
  );
}
