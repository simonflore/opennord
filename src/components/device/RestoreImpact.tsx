import type { RestoreImpact as Impact } from '../../lib/device/restore-diff';

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Renders the device-vs-backup restore impact — leads with the slot-change count
 *  (the MIDI Program Change targets), then a breakdown + content counts. */
export function RestoreImpact({ impact }: { impact: Impact }) {
  const { changed, added, unchanged, untouched, pianos, samples, presets } = impact;
  const others = [
    pianos && plural(pianos, 'piano'),
    samples && plural(samples, 'sample'),
    presets && plural(presets, 'preset'),
  ].filter(Boolean).join(', ');
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
      <p className="ps-sub" style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Estimated by program name.</p>
    </div>
  );
}
