import type { SampleHeaderView } from '../../lib/ns4/sample-view';
import { formatBytes } from '../../lib/format';
import { Pill } from '../ui';
import { IdentityLcd } from '../program/widgets';

/** Signed gain in dB, e.g. +2.9 dB / −6.0 dB. */
const fmtDb = (db: number): string => `${db >= 0 ? '+' : '−'}${Math.abs(db).toFixed(1)} dB`;
/** Signed detune in cents, e.g. +100 ¢. */
const fmtCents = (c: number): string => `${c >= 0 ? '+' : '−'}${Math.abs(c)} ¢`;

/**
 * The sample's identity on the LCD (name; format, sample count, size), then its
 * playing modes as lit LED keys and the rest as small flat facts. The file's
 * version and checksum are librarian detail, so they sit last, in mono.
 */
export function SampleHeader({ view }: { view: SampleHeaderView }) {
  const count = `${view.strokeCount} ${view.strokeCount === 1 ? 'sample' : 'samples'}`;
  const gd = view.gainDetune;
  return (
    <div className="ps-hd">
      <div className="ps-hd-id">
        <IdentityLcd name={view.name} lines={[`${view.codecLabel} · ${count} · ${formatBytes(view.sizeBytes)}`]} />
        <div className="ps-meta">
          {view.unison && (
            <span className="ps-key on" title={`Unison ${view.unison} — auditioned as a stacked, panned voice`}>Unison</span>
          )}
          {view.roundRobin && (
            <span className="ps-key on" title="Round-robin (RandomStrokeMode) — repeated notes vary in audition">Round-robin</span>
          )}
          {view.truVibrato && (
            <span className="ps-key on" title="This sample has Tru-Vibrato engaged">Tru-Vibrato</span>
          )}
          {view.isFactory && (
            <Pill variant="warning">factory?</Pill>
          )}
          {gd && !gd.isDefault && (
            <Pill title={`global gain ${fmtDb(gd.gainDb)}, detune ${fmtCents(gd.detuneCents)}`}>
              {[
                gd.gainDb !== 0 ? `gain ${fmtDb(gd.gainDb)}` : null,
                gd.detuneCents !== 0 ? `detune ${fmtCents(gd.detuneCents)}` : null,
                gd.customNotes > 0 ? `${gd.customNotes} custom notes` : null,
              ].filter(Boolean).join(' · ') || 'custom gain'}
            </Pill>
          )}
          <span className="ps-fact">
            v{view.version}
            {view.checksumKnown && <> · {view.checksumOk ? 'checksum ✓' : 'checksum ✗'}</>}
          </span>
        </div>
      </div>
    </div>
  );
}
