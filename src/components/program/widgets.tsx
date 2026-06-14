/**
 * Generic presentational widgets for Program Studio. Pure, stateless, styled by
 * src/styles/nord.css. They render plain values from the view-model — no decoding.
 */

/** A knob dial with a value readout and caption. `fill` is 0–100 for the arc. */
export function Knob({ value, caption, fill = 50 }: { value: string; caption: string; fill?: number }) {
  const v = Math.max(0, Math.min(100, Math.round(fill)));
  return (
    <div className="ps-knob">
      <div className="ps-dial" style={{ ['--v' as string]: v }}><i /></div>
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
