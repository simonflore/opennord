import type { AmpEnvelope } from './sampleEngine';
import { MidiConnect } from './MidiConnect';
import { UnisonPanel } from './UnisonPanel';
import { EnvelopePanel } from './EnvelopePanel';

/**
 * How the sample plays here, in one card: a MIDI keyboard to play it from, the
 * program's Unison setting and a synth envelope to audition it with. None of it
 * is part of the sample, so the card says that once.
 */
export function PlayPanel({ unison, onUnison, envEnabled, env, onEnvToggle, onEnv }: {
  unison: number;
  onUnison: (level: number) => void;
  envEnabled: boolean;
  env: AmpEnvelope;
  onEnvToggle: (on: boolean) => void;
  onEnv: (env: AmpEnvelope) => void;
}) {
  return (
    <div className="ps-card">
      <h4>PLAY</h4>
      <MidiConnect />
      <div className="mt-3 grid gap-3 border-t border-line pt-3">
        <UnisonPanel level={unison} onChange={onUnison} />
        <EnvelopePanel enabled={envEnabled} env={env} onToggle={onEnvToggle} onChange={onEnv} />
      </div>
      <p className="ps-sub mt-3 mb-0">For listening here only: Unison and the envelope are not saved in the sample.</p>
    </div>
  );
}
