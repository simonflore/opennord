import { useEffect, useRef, useState } from 'react';
import '../../styles/nord.css';
import { readNsmp, decodeNsmp, readNsmpZones, readSampleUnison, readNoteAlternates, type NsmpFile, type DecodedStrokeResult, type NsmpZone } from '../../lib/ns4/nsmp';
import { sampleHeaderView, gainDetuneView, zoneMapRows, strokeSummary, sampleUnisonView, truVibratoView, voicingView, noteName } from '../../lib/ns4/sample-view';
import { editModel } from '../../lib/ns4/sample-edit';
import { buildPlayableZones, strokeKeyboardOrder, type PlayableZone } from '../../lib/ns4/playable-zones';
import { createSampler, DEFAULT_ENVELOPE, type Sampler, type AmpEnvelope } from './sampleEngine';
import { EnvelopePanel } from './EnvelopePanel';
import { UnisonPanel } from './UnisonPanel';
import { useSampleTransport } from './useSampleTransport';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import { StrokeList, type InspectorStroke } from './StrokeList';
import { DetailColumns } from '../library/DetailColumns';
import { ItemActions } from '../library/ItemActions';
import { downloadBytes } from '../../lib/download';
import { safeFilename } from '../../lib/ns4/bundle';
import { SampleEditPanel } from './SampleEditPanel';
import { SampleKeyboard } from './SampleKeyboard';
import { SampleConvert } from './SampleConvert';
import { MidiConnect } from './MidiConnect';
import { useMidi } from '../../lib/midi/MidiContext';
import { playPcm } from './audioPlayer';
import { readFileBytes } from '../../lib/file';

interface Loaded {
  bytes: Uint8Array;
  file: NsmpFile;
  /** Source filename stem — display fallback when the file carries no name (OG). */
  name: string;
  decoded: DecodedStrokeResult[];
  /** Zone map parsed once at load (consumed by the editor's initial model). */
  zones: NsmpZone[];
  strokes: InspectorStroke[];
  /** Codec we can decode audio for — OG (legacy), 3 or 4. */
  decodable: boolean;
  /** Monotonic load id — keys the editor so it remounts per file (drops stale edits). */
  loadId: number;
  /** Gapless playable zone layout for the sampler + keyboard highlight. */
  playableZones: PlayableZone[];
  /** globalID → keyboard position (0-based) for StrokeList ordering. */
  order: Map<number, number>;
  /** globalID → decoded stroke (sampler needs audio + loop info). */
  strokesByGlobalID: Map<number, DecodedStrokeResult>;
  /** Polyphonic player, null when audio isn't decodable. */
  sampler: Sampler | null;
  /** Loaded from `initial` (the library's sample), not dropped or picked here
   *  (the user's own file, never factory content). */
  fromInitial: boolean;
}

/** What the inspector shows; `id` is the list entry it came from (none for a previewed file). */
export interface InspectorInput { id?: string; bytes: Uint8Array; name: string; }

/**
 * Audition the sample mapped to zone `index`. A zone references its stroke by
 * `globalID` (not position), so we join the parsed zone to the decoded stroke on
 * that id (see nsmp.ts). No-op if the zone has no decoded audio.
 */
function playZone(loaded: Loaded, index: number): void {
  const zone = loaded.zones[index];
  if (!zone) return;
  const stroke = loaded.decoded.find((s) => s.globalID === zone.globalID);
  if (stroke) playPcm(stroke.channels, undefined, stroke.sampleRate);
}

export function SampleInspector({ initial, factory }: {
  initial?: InspectorInput;
  /** Whether `initial` is Nord factory content (never a file dropped or picked here). */
  factory?: boolean;
} = {}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [dragOver, setDragOver] = useState(false);
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

  const { setSink, clearSink } = useMidi();
  // Route MIDI notes into the loaded sampler (same path as the on-screen keyboard,
  // so playing the controller lights the now-playing zones + waveform playhead).
  // Depends on the provider's stable setSink/clearSink, not the whole MIDI context
  // (a new object on every hot-plug, which would re-run this and cut held notes), and
  // clears the sink only if it is still ours, so it never unhooks another instrument.
  useEffect(() => {
    const sampler = loaded?.sampler;
    if (!sampler || !loaded?.decodable) return;
    const sink = {
      noteOn: (n: number, v: number) => { sampler.noteOn(n, v); transport.refresh(); },
      noteOff: (n: number) => sampler.noteOff(n),
    };
    setSink(sink);
    return () => clearSink(sink);
    // Depend on transport.refresh (stable per sampler), NOT the whole transport
    // object — it's a fresh literal each render, and re-running this effect mid-note
    // calls setSink → gate.allNotesOff(), releasing the held MIDI note after ~1 frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded?.sampler, loaded?.decodable, setSink, clearSink, transport.refresh]);

  function loadBytes(bytes: Uint8Array, name: string, fromInitial: boolean) {
    const file = readNsmp(bytes);
    const decodable = file.codec === 3 || file.codec === 4 || file.legacy;
    let decoded: DecodedStrokeResult[] = [];
    if (decodable) {
      try { decoded = decodeNsmp(bytes); } catch { decoded = []; }
    }
    const zones: NsmpZone[] = file.recognized ? readNsmpZones(bytes) : [];
    // A zone references its stroke by globalID; the zone's rootKey is that
    // stroke's recorded pitch. Join here (both in scope) so each stroke row can
    // show its root note. First match wins if a stroke is shared across zones.
    const rootByGlobalID = new Map<number, number>();
    for (const z of zones) if (!rootByGlobalID.has(z.globalID)) rootByGlobalID.set(z.globalID, z.rootKey);
    const strokes: InspectorStroke[] = decoded.map((d) => {
      const root = rootByGlobalID.get(d.globalID);
      const summary = root != null ? { ...strokeSummary(d), rootNote: noteName(root), rootMidi: root } : strokeSummary(d);
      return { summary, channels: d.channels };
    });
    const stem = name.replace(/\.[^./]+$/, '');
    const playableZones = buildPlayableZones(zones);
    const order = strokeKeyboardOrder(zones);
    const strokesByGlobalID = new Map(decoded.map((d) => [d.globalID, d]));
    // Play at the sample's authored pitch: apply its stored global detune (0 for
    // the common default). Gain is deliberately NOT applied — the audio is peak-
    // normalized per stroke, so the stored level would fight that, not reproduce it.
    const detuneCents = gainDetuneView(bytes)?.detuneCents ?? 0;
    // Unison and repeated-note variation play the way the instrument voices them: the
    // sample's own values, and its neighbouring recordings per key (see sampleEngine).
    const sampler = decodable
      ? createSampler(playableZones, strokesByGlobalID, () => envRef.current, {
        detuneCents, unison: readSampleUnison(bytes), unisonLevel: () => unisonRef.current, alternates: readNoteAlternates(bytes),
      })
      : null;
    setLoaded({ bytes, file, name: stem, decoded, zones, strokes, decodable, loadId: ++loadCount.current, playableZones, order, strokesByGlobalID, sampler, fromInitial });
  }

  async function onFile(f: File) {
    // Generation token: reading a big file takes time, and a second pick (or a
    // library selection) must win even if this read resolves later — otherwise
    // the view shows one file's name over another file's bytes.
    const gen = ++loadCount.current;
    const bytes = await readFileBytes(f);
    if (gen !== loadCount.current) return; // superseded while reading
    loadBytes(bytes, f.name, false); // a dropped/picked file is the user's own — not factory
  }

  useEffect(() => {
    if (initial) { ++loadCount.current; loadBytes(initial.bytes, initial.name, true); }
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

  // Open a file for a quick look. Alone above the empty pane; beside a sample
  // it moves into the side column, out of the instrument's way.
  const dropZone = (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      style={{ display: 'block', padding: shown ? 16 : 28, borderRadius: 'var(--r-lg)', marginTop: shown ? 12 : 0, marginBottom: shown ? 0 : 16, cursor: 'pointer',
        background: dragOver ? 'var(--surface)' : 'transparent',
        border: `2px dashed ${dragOver ? 'var(--red)' : 'var(--line)'}`, textAlign: 'center', color: 'var(--dim)' }}
    >
      <div style={{ color: 'var(--ink)', fontWeight: 600 }}>Preview a sample</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Drop or click to open one for a quick look — <code>.nsmp</code>, <code>.nsmp3</code>, <code>.nsmp4</code>. Use <strong>+ Import sample</strong> to save it to your library.</div>
      <input type="file" accept=".nsmp,.nsmp3,.nsmp4" style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );

  return (
    <div>
      {!shown && dropZone}

      {loaded && !loaded.file.recognized && (
        <div className="ps">
          <p>Not a recognized Nord sample.</p>
          <ul>{loaded.file.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {shown && (
        <div className="ps">
          <SampleHeader view={{ ...sampleHeaderView(shown.file, shown.bytes.length, shown.name), gainDetune: gainDetuneView(shown.bytes), truVibrato: truVibratoView(shown.bytes), ...voicingView(shown.bytes) }} />
          {/* The sample as it is; edits are saved from the editor ("Save edited copy"). */}
          <div className="mt-2"><ItemActions save={{ onSave: () => downloadBytes(shown.bytes, sampleFilename(shown.name, shown.file.codec, shown.file.legacy)) }} /></div>

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
                  factory={shown.fromInitial && !!factory}
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
                        Read-only — to edit the splits, convert to .nsmp3 / .nsmp4 below, then edit the result.
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
            side={
              <>
                {shown.decodable && <MidiConnect />}
                {shown.decodable && (
                  <EnvelopePanel enabled={envEnabled} env={env} onToggle={setEnvEnabled} onChange={setEnv} />
                )}
                {shown.decodable && <UnisonPanel level={unisonLevel} onChange={setUnisonLevel} />}
                {shown.decodable && <SampleConvert bytes={shown.bytes} file={shown.file} name={shown.name} />}
                {dropZone}
              </>
            }
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

/** The file name a sample is saved under: its name and its own kind of file (.nsmp / .nsmp3 / .nsmp4). */
export function sampleFilename(name: string, codec: number | undefined, legacy: boolean | undefined): string {
  const ext = legacy || !codec || codec < 3 ? 'nsmp' : `nsmp${codec}`;
  return `${safeFilename(name)}.${ext}`;
}
