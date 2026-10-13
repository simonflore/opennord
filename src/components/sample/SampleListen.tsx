import { useEffect, useMemo } from 'react';
import '../../styles/nord.css';
import { editModel } from '../../lib/ns4/sample-edit';
import { fullHeaderView, loadSample, playZone } from './loadSample';
import { useSamplerMidiSink } from './useSamplerMidiSink';
import { useSampleTransport } from './useSampleTransport';
import { SampleHeader } from './SampleHeader';
import { SampleKeyboard } from './SampleKeyboard';
import { StrokeList } from './StrokeList';
import { MidiConnect } from './MidiConnect';

const NO_ENVELOPE = () => null;
const NO_UNISON = () => 0;

/**
 * A sample to listen to: its header, the keyboard, and its recordings. The
 * play-only part of the Sample Inspector (no editing, converting or saving),
 * for a sample that isn't the viewer's own file, such as a community share.
 */
export function SampleListen({ bytes, name }: { bytes: Uint8Array; name: string }) {
  const loaded = useMemo(() => loadSample(bytes, name, { env: NO_ENVELOPE, unisonLevel: NO_UNISON }), [bytes, name]);
  const transport = useSampleTransport(loaded.sampler);
  useEffect(() => () => { loaded.sampler?.stopAll(); }, [loaded.sampler]);

  useSamplerMidiSink(loaded.sampler, loaded.decodable, transport.refresh);
  // Derived once per file: the transport re-renders this on every frame while a note sounds.
  const header = useMemo(() => fullHeaderView(loaded), [loaded]);
  const keyboardZones = useMemo(() => editModel(loaded.file, loaded.zones).zones, [loaded]);

  if (!loaded.file.recognized) return <div className="ps"><p>Not a recognized Nord sample.</p></div>;
  const soundingMidis = new Set(transport.sounding.keys());
  const soundingGlobalIDs = new Set(transport.sounding.values());
  return (
    <div className="ps">
      <SampleHeader view={header} />
      {loaded.zones.length > 0 && (
        <SampleKeyboard
          zones={keyboardZones}
          onPlayZone={loaded.decodable ? (i) => playZone(loaded, i) : undefined}
          onNoteOn={(midi) => { loaded.sampler?.noteOn(midi, 100); transport.refresh(); }}
          onNoteOff={(midi) => loaded.sampler?.noteOff(midi)}
          soundingMidis={soundingMidis}
          playableZones={loaded.playableZones}
        />
      )}
      {loaded.decodable && <MidiConnect />}
      <StrokeList
        strokes={loaded.strokes}
        playable={loaded.decodable}
        name={loaded.file.name?.trim() || loaded.name}
        order={loaded.order}
        globalIDOf={(i) => loaded.decoded[i]?.globalID}
        soundingGlobalIDs={soundingGlobalIDs}
        playheadOf={(i) => { const st = loaded.decoded[i]; return st ? transport.playheadFor(st.globalID, st) : null; }}
        saveable={false}
      />
    </div>
  );
}
