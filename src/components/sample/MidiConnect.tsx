import { useMidi } from '../../lib/midi/MidiContext';
import { Button } from '../ui/Button';

/** Connect-a-MIDI-keyboard affordance for the sample inspector. Works with Web
 *  MIDI on desktop and CoreMIDI in the iPad app (USB or Bluetooth keyboards);
 *  shows a clear note where neither exists instead of a dead button. */
export function MidiConnect() {
  const midi = useMidi();

  if (!midi.supported) {
    return (
      <p className="ps-sub mt-2 mb-0">
        To play this sample from a MIDI keyboard, open OpenNord in Chrome or Firefox on a computer,
        or in the iPad app.
      </p>
    );
  }

  const pairButton = midi.bluetoothPairing && (
    <Button variant="ghost" onClick={() => void midi.pairBluetooth()}>
      Pair a Bluetooth keyboard
    </Button>
  );

  if (midi.status === 'connected') {
    return (
      <div className="ps-sub mt-2 mb-0 flex flex-wrap items-center gap-2">
        <span>Playing from: {midi.deviceNames.join(', ') || 'your MIDI keyboard'}</span>
        <Button variant="ghost" onClick={midi.disconnect}>Disconnect</Button>
        {pairButton}
      </div>
    );
  }

  const label =
    midi.status === 'connecting' ? 'Connecting…'
    : midi.status === 'denied' ? 'MIDI blocked — click to retry'
    : midi.status === 'no-device' ? 'No MIDI keyboard found — plug one in & retry'
    : midi.status === 'failed' ? 'MIDI didn’t start — tap to retry'
    : 'Connect MIDI keyboard';

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button disabled={midi.status === 'connecting'} onClick={() => void midi.connect()}>
        {label}
      </Button>
      {pairButton}
    </div>
  );
}
