import type { SampleHeaderView } from '../../lib/ns4/sample-view';
import { formatBytes } from '../../lib/format';

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
          <span className="ps-pill">{view.codecLabel}</span>
          <span className="ps-pill">v{view.version}</span>
          <span className="ps-pill">{view.strokeCount} {view.strokeCount === 1 ? 'sample' : 'samples'}</span>
          <span className="ps-pill">{formatBytes(view.sizeBytes)}</span>
          {view.checksumKnown && (
            <span className="ps-pill">{view.checksumOk ? 'checksum ✓' : 'checksum ✗'}</span>
          )}
          {view.isFactory && (
            <span className="ps-pill" style={{ color: 'var(--warn)', borderColor: 'var(--deps-border)' }}>factory?</span>
          )}
          {view.gainDetune && !view.gainDetune.isDefault && (
            <span
              className="ps-pill"
              title={`global gain ${fmtDb(view.gainDetune.gainDb)}, detune ${fmtCents(view.gainDetune.detuneCents)}`}
            >
              {[
                view.gainDetune.gainDb !== 0 ? `gain ${fmtDb(view.gainDetune.gainDb)}` : null,
                view.gainDetune.detuneCents !== 0 ? `detune ${fmtCents(view.gainDetune.detuneCents)}` : null,
                view.gainDetune.customNotes > 0 ? `${view.gainDetune.customNotes} custom notes` : null,
              ].filter(Boolean).join(' · ') || 'custom gain'}
            </span>
          )}
        </div>
      </div>
      <div className="ps-logo">nord</div>
    </div>
  );
}
