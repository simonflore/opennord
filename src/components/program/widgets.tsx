/**
 * Generic presentational widgets for Program Studio. Pure, stateless, styled by
 * src/styles/nord.css (the instrument panel: LED buttons, knobs, drawbars, LCD).
 * They render plain values from the view-model — no decoding.
 */

import type { ReactNode } from 'react';
import type { ArpView, DrawbarView, FilterCurveView, FxSlotModel, KeyItem, LfoView } from '../../lib/clavia/engine-view';
import {
  eqResponse, filterResponse, freqX, wavePoints, FILTER_ZERO_Y,
  type CurvePoint, type EqShape, type WaveShape,
} from '../../lib/clavia/curves';

interface Morph { wheel?: string; at?: string; pedal?: string }

function morphTooltip(m: Morph): string {
  return [m.wheel && `wheel → ${m.wheel}`, m.at && `A.T. → ${m.at}`, m.pedal && `pedal → ${m.pedal}`]
    .filter(Boolean).join('   ·   ');
}

/** A 0–100 position, rounded and clamped. */
const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** A small ✎ flag on a value that's morph-assigned; the tooltip names the targets. */
export function MorphMark({ morph }: { morph: Morph }) {
  const tip = morphTooltip(morph);
  if (!tip) return null;
  return <span className="ps-morphmark" title={tip}>✎</span>;
}

/**
 * A knob dial with a value readout and caption. Pass `fill` (0–100) to light the
 * value ring and point the knob at that position; omit it for a neutral dial.
 * v1 knobs are mostly textual (the value lives in the readout), so most callers
 * omit `fill` rather than show an arc that doesn't reflect the real parameter
 * value. Pass `morph`
 * to flag a value that moves with wheel / aftertouch / pedal.
 */
export function Knob({ value, caption, fill, morph, morphFill }: {
  value: string; caption: string; fill?: number; morph?: Morph;
  /** Positions (0–100) the morph sources sweep the knob to; drawn as a second arc from the value. */
  morphFill?: number[];
}) {
  let cls = 'ps-dial ps-dial-flat';
  const style: Record<string, number> = {};
  if (typeof fill === 'number') {
    cls = 'ps-dial';
    style['--v'] = pct(fill);
    if (morphFill?.length) {
      const swept = [style['--v'], ...morphFill.map(pct)];
      cls = 'ps-dial ps-dial-morph';
      style['--m0'] = Math.min(...swept);
      style['--m1'] = Math.max(...swept);
    }
  }
  return (
    <div className="ps-knob">
      <div className={cls} style={style}><i /></div>
      <b>{value}{morph && <MorphMark morph={morph} />}</b>
      <span>{caption}</span>
    </div>
  );
}

/** The drawbar positions a morph pulls to; undefined for one that isn't a plain 0–8 (a VOX combo). */
function morphLevels(m: Morph): (number | undefined)[] {
  return [m.wheel, m.at, m.pedal].filter((t): t is string => !!t).map((t) => {
    const n = Number(t);
    return Number.isInteger(n) && n >= 0 && n <= 8 ? n : undefined;
  });
}

/**
 * Faithful vertical drawbars: readout, a chrome rod pulled out to `level` (0–8)
 * ending in its coloured cap, footage, morph. The cap renders even at 0 (pushed
 * fully in), as on the instrument; nord.css sizes the rod from `--lvl`.
 */
export function DrawbarStack({ drawbars }: { drawbars: DrawbarView[] }) {
  return (
    <div className="ps-dbstack">
      {drawbars.map((d, i) => (
        <div className="ps-db" key={i}>
          <div className="ps-db-track" style={{ ['--lvl' as string]: Math.max(0, Math.min(8, d.level)) }}>
            {/* The level is printed on the cap, so it travels with the drawbar as it's pulled. */}
            <div className={`ps-db-tab ${d.color}`}><span className="ps-db-num">{d.label}</span></div>
            {d.morph && morphLevels(d.morph).map((lvl, k) => (
              <div className="ps-db-morph" key={k} title={morphTooltip(d.morph!)}
                   style={lvl === undefined ? undefined : { ['--mlvl' as string]: lvl }} />
            ))}
          </div>
          {d.footage && <div className="ps-db-foot">{d.footage}</div>}
        </div>
      ))}
    </div>
  );
}

/** Read-only segmented organ-model selector; the active model is highlighted. */
export function ModelSelector({ models, active }: { models: readonly string[]; active: string }) {
  return (
    <div className="ps-models">
      {models.map((m) => (
        <span key={m} className={m.toUpperCase() === active.toUpperCase() ? 'ps-key ps-model on' : 'ps-key ps-model'}>{m}</span>
      ))}
    </div>
  );
}

export type ToggleItem = KeyItem;

/**
 * A labeled panel section with a row of read-only LED buttons. `on` items light
 * their LED; off items stay dark (parity, not hidden). `groupDim` dims the whole
 * group (used for percussion on non-B3 models).
 */
export function ToggleGroup({ label, items, groupDim }: { label: ReactNode; items: ToggleItem[]; groupDim?: boolean }) {
  return (
    <div className={groupDim ? 'ps-tgroup dim' : 'ps-tgroup'}>
      <p className="ps-tgroup-lbl">{label}</p>
      <div className="ps-tgrow">
        {items.map((it, i) => <span key={i} className={it.on ? 'ps-key ps-tg-btn on' : 'ps-key ps-tg-btn off'}>{it.label}</span>)}
      </div>
    </div>
  );
}

/** The LCD (identity only): a big primary line + a smaller secondary line. */
export function Lcd({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="ps-lcd">
      <div className="big">{primary}</div>
      {secondary}
    </div>
  );
}

/**
 * The LCD as a screen's identity header: the name of what you're looking at
 * (program, sample, piano, the connected Nord) as the heading, with one or more
 * short lines under it. One component so every header reads the same.
 */
export function IdentityLcd({ name, lines }: { name: string; lines: ReactNode[] }) {
  return (
    <div className="ps-lcd ps-lcd-id">
      <h2 className="big">{name}</h2>
      {lines.map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
}

export interface SwitchOption<T extends string> { value: T; label: ReactNode; note?: ReactNode }

/**
 * A switch made of LED keys (Layer Scene I/II, Swap/Insert): one lit at a time,
 * each a real `aria-pressed` button. `note` adds a small aside inside a key
 * (e.g. "saved" on the stored scene).
 */
export function LedSwitch<T extends string>({ label, options, value, onChange, className }: {
  label: string;
  options: SwitchOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={className ? `ps-switch ${className}` : 'ps-switch'} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          className={o.value === value ? 'ps-key on' : 'ps-key'}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.note && <span className="ps-key-note">{o.note}</span>}
        </button>
      ))}
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

/** A reader's warnings about the file (a layout mismatch, out-of-range values, …); nothing when there are none. */
export function ReadoutWarnings({ warnings }: { warnings?: readonly string[] }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>Readout warnings</h4>
      <ul className="ps-sub" style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--warn)' }}>
        {warnings.map((w) => <li key={w}>{w}</li>)}
      </ul>
    </div>
  );
}

/** Horizontal level meter with a label and value readout. `fill` is 0–100. */
export function Meter({ label, value, fill, morph }: { label: string; value: string; fill: number; morph?: Morph }) {
  const w = pct(fill);
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
      <svg viewBox="0 0 120 44" preserveAspectRatio="xMinYMid meet" className="ps-env-svg" role="img" aria-label={caption ?? 'envelope'}>
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      {caption && <span className="ps-env-cap">{caption}</span>}
    </div>
  );
}

/** Points in a unit box → an SVG path inside a w×h viewBox, inset by `pad`. */
function curvePath(pts: CurvePoint[], w: number, h: number, pad = 2): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${(pad + p.x * (w - 2 * pad)).toFixed(1)},${(pad + p.y * (h - 2 * pad)).toFixed(1)}`).join(' ');
}

/**
 * The filter as a response curve (20 Hz → 20 kHz): where it cuts, how steeply,
 * and the resonance peak. Dashed ticks mark the cutoffs a morph sweeps to. A
 * schematic of the setting — the knobs beside it print the values.
 */
export function FilterCurve({ filter }: { filter: FilterCurveView }) {
  const w = 120, h = 44, pad = 2;
  const x = (hz: number) => pad + freqX(hz) * (w - 2 * pad);
  const zero = pad + FILTER_ZERO_Y * (h - 2 * pad);
  return (
    <div className="ps-curve">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="ps-curve-svg" role="img"
           aria-label={`${filter.type} filter response`}>
        <line x1={pad} x2={w - pad} y1={zero} y2={zero} className="ps-curve-axis" />
        {filter.morphHz?.map((hz, i) => (
          <line key={i} x1={x(hz)} x2={x(hz)} y1={pad} y2={h - pad} className="ps-curve-morph" />
        ))}
        <path d={curvePath(filterResponse(filter), w, h, pad)} className="ps-curve-line" />
      </svg>
      <span className="ps-env-cap">{filter.type} filter</span>
    </div>
  );
}

/** A small wave-shape glyph (an oscillator's or LFO's waveform). */
export function WaveGlyph({ shape, width, label }: { shape: WaveShape; width?: number; label?: string }) {
  return (
    <svg viewBox="0 0 60 24" className="ps-wave" role="img" aria-label={label ?? `${shape} wave`}>
      <path d={curvePath(wavePoints(shape, 2, width), 60, 24, 3)} className="ps-curve-line" />
    </svg>
  );
}

/** The LFO: its waveform, then speed, depth and what it moves. */
export function LfoRow({ lfo }: { lfo: LfoView }) {
  return (
    <div className="ps-mod">
      <WaveGlyph shape={lfo.shape} label={`LFO ${lfo.shape}`} />
      <div className="ps-mod-txt">
        <span className="ps-env-cap">LFO → {lfo.target}</span>
        <b>{lfo.rate}{lfo.amount && ` · amt ${lfo.amount}`}{lfo.morph && <MorphMark morph={lfo.morph} />}</b>
      </div>
    </div>
  );
}

/** The arpeggiator: mode, direction, speed and range; then its step pattern (accents taller, pan as L/R). */
export function ArpRow({ arp }: { arp: ArpView }) {
  const settings = [arp.mode, arp.direction, arp.rate, arp.range && `range ${arp.range}`].filter(Boolean).join(' · ');
  return (
    <div className="ps-mod">
      <div className="ps-mod-txt">
        <span className="ps-env-cap">Arpeggiator</span>
        <b>{settings || 'on'}</b>
      </div>
      {arp.steps && (
        <ol className="ps-steps" aria-label={`Pattern, ${arp.steps.length} steps`}>
          {arp.steps.map((st, i) => (
            <li key={i} className={st.accent ? 'ps-step accent' : 'ps-step'}
                title={`Step ${i + 1}${st.accent ? ' · accent' : ''}${st.pan !== 'C' ? ` · pan ${st.pan}` : ''}`}>
              {st.pan !== 'C' && <span>{st.pan}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** A three-band EQ curve (bass shelf, swept mid, treble shelf) around a 0 dB line. */
export function EqCurve({ eq }: { eq: EqShape }) {
  return (
    <svg viewBox="0 0 80 24" preserveAspectRatio="none" className="ps-eq" role="img"
         aria-label={`EQ: bass ${eq.bassDb} dB, mid ${eq.midDb} dB, treble ${eq.trebDb} dB`}>
      <line x1="2" x2="78" y1="12" y2="12" className="ps-curve-axis" />
      <path d={curvePath(eqResponse(eq), 80, 24, 2)} className="ps-curve-line" />
    </svg>
  );
}

/**
 * A layer's effect chain in signal order: every slot is drawn, lit when on and
 * dimmed when off, so the chain reads at a glance. Amp/EQ draws its EQ curve.
 */
export function FxChain({ slots }: { slots: FxSlotModel[] }) {
  if (slots.length === 0) return null;
  return (
    <div className="ps-card ps-fx">
      <h4>FX</h4>
      <ol className="ps-chain">
        {slots.map((fx) => (
          <li key={fx.key} className={fx.on ? 'ps-chip' : 'ps-chip off'} aria-label={`${fx.label} ${fx.on ? 'on' : 'off'}`}>
            <div className="t">{fx.label}</div>
            {fx.on ? fx.detail : 'off'}
            {fx.on && fx.eq && <EqCurve eq={fx.eq} />}
          </li>
        ))}
      </ol>
    </div>
  );
}
