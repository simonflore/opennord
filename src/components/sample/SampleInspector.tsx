import { useEffect, useRef, useState } from 'react';
import '../../styles/nord.css';
import { readNsmp, decodeNsmp, readNsmpZones, type NsmpFile, type DecodedStrokeResult, type NsmpZone } from '../../lib/ns4/nsmp';
import { sampleHeaderView, gainDetuneView, zoneMapRows, strokeSummary, sampleUnisonView, noteName } from '../../lib/ns4/sample-view';
import { editModel } from '../../lib/ns4/sample-edit';
import { buildPlayableZones, strokeKeyboardOrder, type PlayableZone } from '../../lib/ns4/playable-zones';
import { createSampler, DEFAULT_ENVELOPE, type Sampler, type AmpEnvelope } from './sampleEngine';
import { EnvelopePanel } from './EnvelopePanel';
import { useSampleTransport } from './useSampleTransport';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import { StrokeList, type InspectorStroke } from './StrokeList';
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
  /** Nord factory content — drives the editor's "edit it for your own use" disclaimer. */
  factory: boolean;
}

export interface InspectorInput { bytes: Uint8Array; name: string; factory?: boolean; }

/**
 * Audition the sample mapped to zone `index`. A zone references its stroke by
 * `globalID` (not position), so we join the parsed zone to the decoded stroke on
 * that id (see nsmp.ts). No-op if the zone has no decoded audio.
 */
function playZone(loaded: Loaded, index: number): void {
  const zone = loaded.zones[index];
  if (!zone) return;
  const stroke = loaded.decoded.find((s) => s.globalID === zone.globalID);
  if (stroke) playPcm(stroke.channels);
}

export function SampleInspector({ initial }: { initial?: InspectorInput } = {}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const loadCount = useRef(0);

  // Synth-playground envelope (optional, off by default — not part of the sample).
  // A ref mirrors it so the sampler's getter reads current values without rebuilding.
  const [envEnabled, setEnvEnabled] = useState(false);
  const [env, setEnv] = useState<AmpEnvelope>(DEFAULT_ENVELOPE);
  const envRef = useRef<AmpEnvelope | null>(null);
  useEffect(() => { envRef.current = envEnabled ? env : null; }, [envEnabled, env]);

  const transport = useSampleTransport(loaded?.sampler ?? null);
  // sounding is a state value (Map), not a function
  const soundingMidis = new Set(transport.sounding.keys());
  const soundingGlobalIDs = new Set(transport.sounding.values());

  // Stop any held voices when the file changes or the component unmounts.
  useEffect(() => () => { loaded?.sampler?.stopAll(); }, [loaded?.sampler]);

  const midi = useMidi();
  // Route MIDI notes into the loaded sampler (same path as the on-screen keyboard,
  // so playing the controller lights the now-playing zones + waveform playhead).
  useEffect(() => {
    const sampler = loaded?.sampler;
    if (!sampler || !loaded?.decodable) { midi.setSink(null); return; }
    midi.setSink({
      noteOn: (n, v) => { sampler.noteOn(n, v); transport.refresh(); },
      noteOff: (n) => sampler.noteOff(n),
    });
    return () => midi.setSink(null);
    // Depend on transport.refresh (stable per sampler), NOT the whole transport
    // object — it's a fresh literal each render, and re-running this effect mid-note
    // calls setSink → gate.allNotesOff(), releasing the held MIDI note after ~1 frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded?.sampler, loaded?.decodable, midi, transport.refresh]);

  function loadBytes(bytes: Uint8Array, name: string, factory = false) {
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
      const summary = root != null ? { ...strokeSummary(d), rootNote: noteName(root) } : strokeSummary(d);
      return { summary, channels: d.channels };
    });
    const stem = name.replace(/\.[^./]+$/, '');
    const playableZones = buildPlayableZones(zones);
    const order = strokeKeyboardOrder(zones);
    const strokesByGlobalID = new Map(decoded.map((d) => [d.globalID, d]));
    const sampler = decodable ? createSampler(playableZones, strokesByGlobalID, () => envRef.current) : null;
    setLoaded({ bytes, file, name: stem, decoded, zones, strokes, decodable, loadId: ++loadCount.current, playableZones, order, strokesByGlobalID, sampler, factory });
  }

  async function onFile(f: File) {
    // Generation token: reading a big file takes time, and a second pick (or a
    // library selection) must win even if this read resolves later — otherwise
    // the view shows one file's name over another file's bytes.
    const gen = ++loadCount.current;
    const bytes = await readFileBytes(f);
    if (gen !== loadCount.current) return; // superseded while reading
    loadBytes(bytes, f.name); // a dropped/picked file is the user's own — not factory
  }

  useEffect(() => {
    if (initial) { ++loadCount.current; loadBytes(initial.bytes, initial.name, !!initial.factory); }
  }, [initial]);

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ display: 'block', padding: 28, borderRadius: 'var(--r-lg)', marginBottom: 16, cursor: 'pointer',
          background: dragOver ? 'var(--surface)' : 'transparent',
          border: `2px dashed ${dragOver ? 'var(--red)' : 'var(--line)'}`, textAlign: 'center', color: 'var(--dim)' }}
      >
        <div style={{ color: 'var(--ink)', fontWeight: 600 }}>Preview a sample</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Drop or click to open one for a quick look — <code>.nsmp</code>, <code>.nsmp3</code>, <code>.nsmp4</code>. Use <strong>+ Import sample</strong> to save it to your library.</div>
        <input type="file" accept=".nsmp,.nsmp3,.nsmp4" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>

      {loaded && !loaded.file.recognized && (
        <div className="ps">
          <p>Not a recognized Nord sample.</p>
          <ul>{loaded.file.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {loaded && loaded.file.recognized && (
        <div className="ps">
          <SampleHeader view={{ ...sampleHeaderView(loaded.file, loaded.bytes.length, loaded.name), gainDetune: gainDetuneView(loaded.bytes) }} />

          {/* Keyboard-map editor leads once we've decoded the key map; edits patch
              back into the file in place (audio preserved). Otherwise a friendly
              note + the read-only key map. */}
          {(loaded.file.codec === 3 || loaded.file.codec === 4) && loaded.zones.length > 0
            ? <SampleEditPanel
                key={loaded.loadId}
                initial={editModel(loaded.file, loaded.zones)}
                bytes={loaded.bytes}
                codec={loaded.file.codec === 4 ? 4 : 3}
                factory={loaded.factory}
                unison={sampleUnisonView(loaded.bytes)?.summary ?? null}
                onPlayZone={loaded.decodable ? (i) => playZone(loaded, i) : undefined}
                onNoteOn={(midi) => { loaded.sampler?.noteOn(midi, 100); transport.refresh(); }}
                onNoteOff={(midi) => loaded.sampler?.noteOff(midi)}
                soundingMidis={soundingMidis}
                playableZones={loaded.playableZones}
              />
            : loaded.file.legacy && loaded.zones.length > 0
              ? (
                // Legacy .nsmp: decoded but not editable in place — show the map
                // read-only (click a band to audition), and point to conversion.
                <>
                  <SampleKeyboard
                    zones={editModel(loaded.file, loaded.zones).zones}
                    onPlayZone={loaded.decodable ? (i) => playZone(loaded, i) : undefined}
                    onNoteOn={(midi) => { loaded.sampler?.noteOn(midi, 100); transport.refresh(); }}
                    onNoteOff={(midi) => loaded.sampler?.noteOff(midi)}
                    soundingMidis={soundingMidis}
                    playableZones={loaded.playableZones}
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

          {loaded.decodable && <MidiConnect />}
          {loaded.decodable && (
            <EnvelopePanel enabled={envEnabled} env={env} onToggle={setEnvEnabled} onChange={setEnv} />
          )}
          {loaded.decodable && <SampleConvert bytes={loaded.bytes} file={loaded.file} name={loaded.name} />}
          <StrokeList
            strokes={loaded.strokes}
            playable={loaded.decodable}
            name={loaded.file.name?.trim() || loaded.name}
            order={loaded.order}
            globalIDOf={(i) => loaded.decoded[i]?.globalID}
            soundingGlobalIDs={soundingGlobalIDs}
            playheadOf={(i) => {
              const st = loaded.decoded[i];
              return st ? transport.playheadFor(st.globalID, st) : null;
            }}
          />

          {/* Raw key/velocity table — only when we couldn't build the editor. */}
          {!((loaded.file.codec === 3 || loaded.file.codec === 4) && loaded.zones.length > 0)
            && <ZoneMap rows={zoneMapRows(loaded.bytes)} unison={sampleUnisonView(loaded.bytes)?.summary ?? null} />}
        </div>
      )}
    </div>
  );
}
