import { Button } from '../ui';
import type { NordMidiState } from './useNordMidi';

const STATUS_TEXT: Record<NordMidiState['status'], string> = {
  idle: 'Turn on MIDI and OpenNord will auto-label what you change — just move a control.',
  listening: '',
  unsupported: 'Live MIDI needs Chrome or Edge on a computer.',
  denied: 'MIDI permission was blocked — allow it in the browser to auto-label.',
  'no-port': "No Nord MIDI input found. Is it plugged in, and is 'Send MIDI / CC' on in the Nord's settings?",
  error: "Couldn't start MIDI — you can still label changes by hand.",
};

/** Live MIDI status + recent control moves. Validates the Nord transmits panel changes. */
export function MidiProbe({ state, enabled, onToggle }: {
  state: NordMidiState;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Button variant={enabled ? 'secondary' : 'ghost'} onClick={onToggle}>
        {enabled ? 'Turn off MIDI auto-label' : 'Turn on MIDI auto-label'}
      </Button>
      {enabled && state.status === 'listening' && (
        <p className="ps-sub">
          Listening on <strong>{state.portName || 'MIDI'}</strong>
          {state.last
            ? <> — last move: <strong>{state.last.label} → {state.last.value}</strong></>
            : <> — move a control on your Nord.</>}
        </p>
      )}
      {enabled && state.status !== 'listening' && (
        <p className="ps-sub">{STATUS_TEXT[state.status]}</p>
      )}
      {enabled && state.events.length > 1 && (
        <p className="ps-sub">
          Recent: {state.events.slice(0, 6).map((e) => `${e.label}→${e.value}`).join(', ')}
        </p>
      )}
    </div>
  );
}
