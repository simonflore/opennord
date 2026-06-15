/**
 * Generic presentational widgets for Program Studio. Pure, stateless, styled by
 * src/styles/nord.css. They render plain values from the view-model — no decoding.
 */

interface Morph { wheel?: string; at?: string; pedal?: string }

/** A small ✎ flag on a value that's morph-assigned; the tooltip names the targets. */
export function MorphMark({ morph }: { morph: Morph }) {
  const parts = [
    morph.wheel && `wheel → ${morph.wheel}`,
    morph.at && `A.T. → ${morph.at}`,
    morph.pedal && `pedal → ${morph.pedal}`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <span className="ps-morphmark" title={parts.join('   ·   ')}>✎</span>;
}

/**
 * A knob dial with a value readout and caption. Pass `fill` (0–100) to draw the
 * red arc at that position; omit it for a neutral dial. v1 knobs are mostly
 * textual (the value lives in the readout), so most callers omit `fill` rather
 * than show an arc that doesn't reflect the real parameter value. Pass `morph`
 * to flag a value that moves with wheel / aftertouch / pedal.
 */
export function Knob({ value, caption, fill, morph }: { value: string; caption: string; fill?: number; morph?: Morph }) {
  const hasFill = typeof fill === 'number';
  const v = hasFill ? Math.max(0, Math.min(100, Math.round(fill))) : 0;
  return (
    <div className="ps-knob">
      <div className={hasFill ? 'ps-dial' : 'ps-dial ps-dial-flat'} style={hasFill ? { ['--v' as string]: v } : undefined}><i /></div>
      <b>{value}{morph && <MorphMark morph={morph} />}</b>
      <span>{caption}</span>
    </div>
  );
}

/** Organ drawbar LED ladder. Each value 0–8 lights that many of 8 segments. */
export function DrawbarLadder({ values }: { values: number[] }) {
  return (
    <div className="ps-ladder">
      {values.map((v, i) => (
        <div className="ps-bar" key={i}>
          {Array.from({ length: 8 }, (_, s) => (
            <span key={s} className={s < v ? 'ps-seg on' : 'ps-seg'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Blue synth LCD: a big primary line + a smaller secondary line. */
export function Lcd({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="ps-lcd">
      <div className="big">{primary}</div>
      {secondary}
    </div>
  );
}

/** Compact FX chip: small label over a detail line. */
export function Chip({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="ps-chip">
      <div className="t">{label}</div>
      {detail}
    </div>
  );
}

/** Horizontal level meter with a label and value readout. `fill` is 0–100. */
export function Meter({ label, value, fill, morph }: { label: string; value: string; fill: number; morph?: Morph }) {
  const w = Math.max(0, Math.min(100, Math.round(fill)));
  return (
    <div className="ps-meter">
      <div className="ps-meter-label"><span>{label}</span><span>{value}{morph && <MorphMark morph={morph} />}</span></div>
      <div className="ps-meter-track"><div className="ps-meter-fill" style={{ width: `${w}%` }} /></div>
    </div>
  );
}

/**
 * Compact label/value grid — surfaces the many secondary parameters (env times,
 * LFO, keytrack, glide, …) without a wall of knobs. Renders nothing when empty.
 */
export function StatGrid({ stats }: { stats: { label: string; value: string }[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="ps-stats">
      {stats.map((s, i) => (
        <div className="ps-stat" key={i}>
          <span className="ps-stat-l">{s.label}</span>
          <span className="ps-stat-v">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * A small ADSR envelope glyph. `a`/`d`/`r` are 0–1 segment proportions (sum ≈ 1)
 * derived from the real attack/decay/release times; `s` is the 0–1 sustain level.
 * The shape comes from real data; exact times live in the StatGrid beside it.
 */
export function EnvCurve({ a, d, s, r, caption }: { a: number; d: number; s: number; r: number; caption?: string }) {
  const seg = 96; // px shared by attack+decay+release; the sustain hold is a fixed 20px
  const x1 = 2 + a * seg, x2 = x1 + d * seg, x3 = x2 + 20, x4 = x3 + r * seg;
  const sy = 40 - s * 36;
  const path = `M2,40 L${x1.toFixed(1)},4 L${x2.toFixed(1)},${sy.toFixed(1)} L${x3.toFixed(1)},${sy.toFixed(1)} L${x4.toFixed(1)},40`;
  return (
    <div className="ps-env">
      <svg viewBox="0 0 120 44" className="ps-env-svg" role="img" aria-label={caption ?? 'envelope'}>
        <path d={path} fill="none" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      {caption && <span className="ps-env-cap">{caption}</span>}
    </div>
  );
}
