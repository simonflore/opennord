import { LEFT_OUT_REASON, type LibraryLeftOutWhy, type RestoreImpact as Impact } from '../../lib/device/restore-diff';
import { plural } from '../../lib/plural';

/** "3 samples and 1 piano"; empty when both are 0. */
const samplesAndPianos = (samples: number, pianos: number): string =>
  [samples && plural(samples, 'sample'), pianos && plural(pianos, 'piano')].filter(Boolean).join(' and ');

/** Renders the device-vs-backup restore impact — leads with the slot-change count
 *  (the MIDI Program Change targets), then a breakdown + content counts, then what
 *  happens to the samples and pianos. */
export function RestoreImpact({ impact }: { impact: Impact }) {
  const { changed, added, unchanged, untouched, pianos, samples, presets } = impact;
  const others = [
    impact.writesPianos && pianos && plural(pianos, 'piano'),
    impact.writesSamples && samples && plural(samples, 'sample'),
    presets && plural(presets, 'preset'),
  ].filter(Boolean).join(', ');
  const removes = samplesAndPianos(impact.removesSamples, impact.removesPianos);
  const leftOut = (['not-yet-tried', 'stage4-only', 'read-only'] as LibraryLeftOutWhy[]).flatMap((why) => {
    const what = samplesAndPianos(impact.leftOutWhy.sample === why ? samples : 0, impact.leftOutWhy.piano === why ? pianos : 0);
    return what ? [`${what} in this backup won’t be restored: ${LEFT_OUT_REASON[why]}.`] : [];
  });
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      {changed > 0 ? (
        <p className="ps-sub" style={{ margin: 0, color: 'var(--ink)' }}>
          <strong>{changed} of your program {changed === 1 ? 'slot' : 'slots'} will change</strong> — MIDI Program
          Change and set-list automations pointed at {changed === 1 ? 'it' : 'those slots'} will recall different sounds.
        </p>
      ) : (
        <p className="ps-sub" style={{ margin: 0 }}>
          No existing program slots change — your MIDI Program Change targets stay put.
        </p>
      )}
      <p className="ps-sub" style={{ margin: '6px 0 0' }}>
        {changed} replaced · {added} added to empty slots · {unchanged} unchanged · {untouched} left untouched
      </p>
      {others && <p className="ps-sub" style={{ margin: '6px 0 0' }}>Also writes {others}.</p>}
      {removes && (
        <p className="ps-sub mx-0 mb-0 mt-1.5 text-ink">
          Removes or replaces {removes} on your Nord, to match this backup by name. Make a fresh backup first.
        </p>
      )}
      {leftOut.map((line) => <p key={line} className="ps-sub mx-0 mb-0 mt-1.5">{line}</p>)}
      <p className="ps-sub" style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Estimated by program name.</p>
    </div>
  );
}
