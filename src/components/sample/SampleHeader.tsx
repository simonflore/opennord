import type { SampleHeaderView } from '../../lib/ns4/sample-view';
import { formatBytes } from '../../lib/format';
import { Pill } from '../ui';

/** Signed gain in dB, e.g. +2.9 dB / −6.0 dB. */
const fmtDb = (db: number): string => `${db >= 0 ? '+' : '−'}${Math.abs(db).toFixed(1)} dB`;
/** Signed detune in cents, e.g. +100 ¢. */
const fmtCents = (c: number): string => `${c >= 0 ? '+' : '−'}${Math.abs(c)} ¢`;

export function SampleHeader({ view }: { view: SampleHeaderView }) {
  return (
    <div className="ps-hd">
      <div>
        <div className="ps-nm">{view.name}</div>
        <div className="ps-meta">
          <Pill>{view.codecLabel}</Pill>
          <Pill>v{view.version}</Pill>
          <Pill>{view.strokeCount} {view.strokeCount === 1 ? 'sample' : 'samples'}</Pill>
          <Pill>{formatBytes(view.sizeBytes)}</Pill>
          {view.checksumKnown && (
            <Pill>{view.checksumOk ? 'checksum ✓' : 'checksum ✗'}</Pill>
          )}
          {view.isFactory && (
            <Pill title="Looks like factory content — you can always re-download it from Nord's library">Factory?</Pill>
          )}
          {view.unison && (
            <Pill title={`Unison ${view.unison} — auditioned as a stacked, panned voice`}>Unison</Pill>
          )}
          {view.roundRobin && (
            <Pill title="Round-robin (RandomStrokeMode) — repeated notes vary in audition">Round-robin</Pill>
          )}
          {view.truVibrato && (
            <Pill title="This sample has Tru-Vibrato engaged">Tru-Vibrato</Pill>
          )}
          {view.gainDetune && !view.gainDetune.isDefault && (
            <Pill title={`global gain ${fmtDb(view.gainDetune.gainDb)}, detune ${fmtCents(view.gainDetune.detuneCents)}`}>
              {[
                view.gainDetune.gainDb !== 0 ? `gain ${fmtDb(view.gainDetune.gainDb)}` : null,
                view.gainDetune.detuneCents !== 0 ? `detune ${fmtCents(view.gainDetune.detuneCents)}` : null,
                view.gainDetune.customNotes > 0 ? `${view.gainDetune.customNotes} custom notes` : null,
              ].filter(Boolean).join(' · ') || 'custom gain'}
            </Pill>
          )}
        </div>
      </div>
      <div className="ps-logo">nord</div>
    </div>
  );
}
