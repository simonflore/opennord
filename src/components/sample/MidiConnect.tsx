import { useMidi } from '../../lib/midi/MidiContext';

/** Connect-a-MIDI-keyboard affordance for the sample inspector. Desktop-only;
 *  shows a clear note where Web MIDI is unavailable instead of a dead button. */
export function MidiConnect() {
  const midi = useMidi();

  if (!midi.supported) {
    return (
      <p className="ps-sub" style={{ margin: '8px 0 0' }}>
        Connect a MIDI keyboard on desktop Chrome or Firefox to play this sample.
      </p>
    );
  }

  if (midi.status === 'connected') {
    return (
      <p className="ps-sub" style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        MIDI: {midi.deviceNames.join(', ') || 'connected'}
        <button className="on-btn on-btn--ghost" style={{ fontSize: 11 }} onClick={midi.disconnect}>Disconnect</button>
      </p>
    );
  }

  const label =
    midi.status === 'connecting' ? 'Connecting…'
    : midi.status === 'denied' ? 'MIDI blocked — click to retry'
    : midi.status === 'no-device' ? 'No MIDI input — plug one in & retry'
    : 'Connect MIDI keyboard';

  return (
    <button className="on-btn" style={{ marginTop: 8 }} disabled={midi.status === 'connecting'}
      onClick={() => void midi.connect()}>
      {label}
    </button>
  );
}
