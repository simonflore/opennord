import { useEffect, useRef, useState } from 'react';
import '../../styles/nord.css';
import { zoneMapRows, sampleUnisonView } from '../../lib/ns4/sample-view';
import { editModel } from '../../lib/ns4/sample-edit';
import { DEFAULT_ENVELOPE, type AmpEnvelope } from './sampleEngine';
import { fullHeaderView, loadSample, playZone, type LoadedSample } from './loadSample';
import { useSamplerMidiSink } from './useSamplerMidiSink';
import { PlayPanel } from './PlayPanel';
import { useSampleTransport } from './useSampleTransport';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import { StrokeList } from './StrokeList';
import { DetailColumns } from '../library/DetailColumns';
import { ItemActions } from '../library/ItemActions';
import { downloadBytes } from '../../lib/download';
import { sampleFilename } from '../../lib/library/sample-entries';
import { SampleEditPanel } from './SampleEditPanel';
import { SampleKeyboard } from './SampleKeyboard';
import { SampleConvert } from './SampleConvert';

/** A loaded sample plus the inspector's own bookkeeping. */
type Loaded = LoadedSample & {
  /** Monotonic load id — keys the editor so it remounts per file (drops stale edits). */
  loadId: number;
};

/** What the inspector shows; `id` is the list entry it came from. */
export interface InspectorInput { id?: string; bytes: Uint8Array; name: string; }

/**
 * One sample, top to bottom: its header, then every action in one row (Save to
 * computer · Convert ▾ · More ▾), then the keyboard map to edit beside a Play
 * card (MIDI, Unison, envelope), then its recordings.
 */
export function SampleInspector({ initial, factory, onShare, onKeepCopy }: {
  initial: InspectorInput;
  /** Open the share form on this one; absent where it can't be shared. */
  onShare?: () => void;
  /** Keep a copy in OpenNord's own storage; given for a sample with no copy on this computer. */
  onKeepCopy?: () => void;
  /** Whether `initial` is Nord factory content (never a file dropped or picked here). */
  factory?: boolean;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const loadCount = useRef(0);

  // Synth-playground envelope (optional, off by default — not part of the sample).
  // A ref mirrors it so the sampler's getter reads current values without rebuilding.
  const [envEnabled, setEnvEnabled] = useState(false);
  const [env, setEnv] = useState<AmpEnvelope>(DEFAULT_ENVELOPE);
  const envRef = useRef<AmpEnvelope | null>(null);
  useEffect(() => { envRef.current = envEnabled ? env : null; }, [envEnabled, env]);
  // The Unison setting to audition (the program's switch, 0–3), read at each note-on.
  const [unisonLevel, setUnisonLevel] = useState(0);
  const unisonRef = useRef(0);
  useEffect(() => { unisonRef.current = unisonLevel; }, [unisonLevel]);

  const transport = useSampleTransport(loaded?.sampler ?? null);
  // sounding is a state value (Map), not a function
  const soundingMidis = new Set(transport.sounding.keys());
  const soundingGlobalIDs = new Set(transport.sounding.values());

  // Stop any held voices when the file changes or the component unmounts.
  useEffect(() => () => { loaded?.sampler?.stopAll(); }, [loaded?.sampler]);

  useSamplerMidiSink(loaded?.sampler, loaded?.decodable, transport.refresh);

  useEffect(() => {
    setLoaded({
      ...loadSample(initial.bytes, initial.name, { env: () => envRef.current, unisonLevel: () => unisonRef.current }),
      loadId: ++loadCount.current,
    });
  }, [initial]);

  // Legacy (NWS-container, OG) files edit in place too, but only when the map is
  // a version patchLegacyNsmp knows how to rewrite (v9/v10) and zones decoded.
  const mapVersion = loaded?.file.sections.find((s) => s.tag.endsWith('map'))?.version;
  const legacyEditable = !!loaded?.file.legacy && (mapVersion === 9 || mapVersion === 10) && (loaded?.zones.length ?? 0) > 0;
  // Codec-3 `map` v12 `.nsmp3` uses stroke-reference records (root + split only, no
  // per-zone velocity) — like the legacy path, but with an editable in-file name. It
  // patches in place via patchV12Nsmp; the editor must not offer velocity edits it
  // can't honour, so drive the table with rootSplitOnly.
  const v12 = loaded?.file.codec === 3 && mapVersion === 12;
  const rootSplitOnly = !!loaded?.file.legacy || v12;

  const editable = ((loaded?.file.codec === 3 || loaded?.file.codec === 4) && (loaded?.zones.length ?? 0) > 0) || legacyEditable;
  const shown = loaded && loaded.file.recognized ? loaded : null;
  const unisonSummary = shown ? sampleUnisonView(shown.bytes)?.summary ?? null : null;

  return (
    <div>
      {loaded && !loaded.file.recognized && (
        <div className="ps">
          <p>Not a recognized Nord sample.</p>
          <ul>{loaded.file.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {shown && (
        <div className="ps">
          <SampleHeader view={fullHeaderView(shown)} />
          {/* Every action on the sample as it is, in one row; edits are saved from the editor ("Save edited copy"). */}
          <div className="mt-2 mb-3"><ItemActions save={{ onSave: () => downloadBytes(shown.bytes, sampleFilename(shown.name, shown.file.codec, shown.file.legacy)) }} more={[
            ...(onShare ? [{ label: 'Share to community', onSelect: onShare }] : []),
            ...(onKeepCopy ? [{ label: 'Keep a copy', onSelect: onKeepCopy }] : []),
          ]}>
            {shown.decodable && <SampleConvert bytes={shown.bytes} file={shown.file} name={shown.name} />}
          </ItemActions></div>

          <DetailColumns
            /* Keyboard-map editor leads once we've decoded the key map; edits patch
               back into the file in place (audio preserved). Legacy (NWS-container,
               OG) files edit in place too when legacyEditable (v9/v10 map with
               zones) — see patchLegacyNsmp. Otherwise a friendly note + the
               read-only key map. */
            top={editable
              ? <SampleEditPanel
                  key={shown.loadId}
                  initial={editModel(shown.file, shown.zones)}
                  bytes={shown.bytes}
                  codec={shown.file.codec === 4 ? 4 : shown.file.legacy ? 'og' : 3}
                  legacy={shown.file.legacy}
                  rootSplitOnly={rootSplitOnly}
                  // Factory content drives the editor's "edit it for your own use" disclaimer.
                  factory={!!factory}
                  unison={unisonSummary}
                  onPlayZone={shown.decodable ? (i) => playZone(shown, i) : undefined}
                  onNoteOn={(midi) => { shown.sampler?.noteOn(midi, 100); transport.refresh(); }}
                  onNoteOff={(midi) => shown.sampler?.noteOff(midi)}
                  soundingMidis={soundingMidis}
                  playableZones={shown.playableZones}
                />
              : shown.file.legacy && shown.zones.length > 0
                ? (
                  // Legacy .nsmp we can't patch (unrecognized map version): decoded
                  // but not editable in place — show the map read-only (click a
                  // band to audition), and point to conversion.
                  <>
                    <SampleKeyboard
                      zones={editModel(shown.file, shown.zones).zones}
                      onPlayZone={shown.decodable ? (i) => playZone(shown, i) : undefined}
                      onNoteOn={(midi) => { shown.sampler?.noteOn(midi, 100); transport.refresh(); }}
                      onNoteOff={(midi) => shown.sampler?.noteOff(midi)}
                      soundingMidis={soundingMidis}
                      playableZones={shown.playableZones}
                    />
                    <div className="ps-card" style={{ marginTop: 12 }}>
                      <p className="ps-sub" style={{ margin: 0 }}>
                        Read-only — to edit the splits, use Convert above to make a .nsmp3 or .nsmp4, then edit that.
                      </p>
                    </div>
                  </>
                )
                : (
                  <div className="ps-card" style={{ marginTop: 12 }}>
                    <p className="ps-sub" style={{ margin: 0 }}>
                      Editing isn't available yet — we couldn't read this sample's key map.
                    </p>
                  </div>
                )}
            side={shown.decodable && (
              <PlayPanel
                unison={unisonLevel} onUnison={setUnisonLevel}
                envEnabled={envEnabled} env={env} onEnvToggle={setEnvEnabled} onEnv={setEnv}
              />
            )}
            rest={
              <>
                <StrokeList
                  strokes={shown.strokes}
                  playable={shown.decodable}
                  name={shown.file.name?.trim() || shown.name}
                  order={shown.order}
                  globalIDOf={(i) => shown.decoded[i]?.globalID}
                  soundingGlobalIDs={soundingGlobalIDs}
                  playheadOf={(i) => {
                    const st = shown.decoded[i];
                    return st ? transport.playheadFor(st.globalID, st) : null;
                  }}
                />
                {/* Raw key/velocity table — only when we couldn't build the editor. */}
                {!editable && <ZoneMap rows={zoneMapRows(shown.bytes)} unison={unisonSummary} />}
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
