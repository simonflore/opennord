/**
 * Generic presentational widgets for Program Studio. Pure, stateless, styled by
 * src/styles/nord.css. They render plain values from the view-model — no decoding.
 */

/**
 * A knob dial with a value readout and caption. Pass `fill` (0–100) to draw the
 * red arc at that position; omit it for a neutral dial. v1 knobs are mostly
 * textual (the value lives in the readout), so most callers omit `fill` rather
 * than show an arc that doesn't reflect the real parameter value.
 */
export function Knob({ value, caption, fill }: { value: string; caption: string; fill?: number }) {
  const hasFill = typeof fill === 'number';
  const v = hasFill ? Math.max(0, Math.min(100, Math.round(fill))) : 0;
  return (
    <div className="ps-knob">
      <div className={hasFill ? 'ps-dial' : 'ps-dial ps-dial-flat'} style={hasFill ? { ['--v' as string]: v } : undefined}><i /></div>
      <b>{value}</b>
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
export function Meter({ label, value, fill }: { label: string; value: string; fill: number }) {
  const w = Math.max(0, Math.min(100, Math.round(fill)));
  return (
    <div className="ps-meter">
      <div className="ps-meter-label"><span>{label}</span><span>{value}</span></div>
      <div className="ps-meter-track"><div className="ps-meter-fill" style={{ width: `${w}%` }} /></div>
    </div>
  );
}
