import type { CSSProperties } from 'react';
import type { FxPanelView, FxParamView, FxUnitView } from '../../lib/clavia/fx-view';
import type { KeyItem } from '../../lib/clavia/engine-view';
import { EqCurve, MorphMark } from './widgets';

/** A row of LEDs. Their state is light only, so `label` says it in words for a screen reader. */
function Leds({ items, className, label }: { items: KeyItem[]; className: string; label: string }) {
  return (
    <div className={className} role="group" aria-label={label}>
      {items.map((k) => <span key={k.label} className={k.on ? 'ps-fxled on' : 'ps-fxled'}>{k.label}</span>)}
    </div>
  );
}

/**
 * One setting of a block. A value with a known position is a small knob beside
 * its number; one without (a note value, a tone name) is a plain readout.
 */
function Param({ p }: { p: FxParamView }) {
  const mark = p.morph && <MorphMark morph={p.morph} />;
  if (p.fill === undefined) {
    return <div className="ps-fxparam"><div className="ps-fxval"><span>{p.label}</span><b>{p.value}{mark}</b></div></div>;
  }
  return (
    <div className="ps-fxparam">
      <div className="ps-dial ps-fxdial" style={{ ['--v' as string]: p.fill }}><i /></div>
      <div className="ps-fxval"><b>{p.value}{mark}</b><span>{p.label}</span></div>
    </div>
  );
}

/**
 * One block of an effect section, as on the instrument's panel: LED and name,
 * the selected type, its settings and switches, and the source selector. An off
 * unit keeps its column as an empty slot with only its name, dimmed.
 */
export function FxUnit({ unit }: { unit: FxUnitView }) {
  if (!unit.on) {
    return <li className="ps-fxunit off" aria-label={`${unit.label} off`}><div className="ps-fxname">{unit.label}</div></li>;
  }
  return (
    <li className="ps-fxunit" aria-label={`${unit.label} on`}>
      <div className="ps-fxname">{unit.label}</div>
      {unit.type && <div className="ps-fxtype">{unit.type}</div>}
      {unit.eq && <EqCurve eq={unit.eq} />}
      {unit.params.length > 0 && (
        <div className="ps-fxparams">{unit.params.map((p) => <Param key={p.label} p={p} />)}</div>
      )}
      {unit.switches && unit.switches.length > 0 && (
        <Leds items={unit.switches} className="ps-fxleds"
              label={unit.switches.map((k) => `${k.label} ${k.on ? 'on' : 'off'}`).join(', ')} />
      )}
      {unit.source && unit.source.length > 0 && (
        <Leds items={unit.source} className="ps-fxleds ps-fxsrc"
              label={`Acts on ${unit.source.filter((k) => k.on).map((k) => k.label).join(', ') || 'nothing'}`} />
      )}
    </li>
  );
}

/**
 * A program's effects, laid out like the instrument: one row per group (a
 * layer's chain, or the one rack) on a shared grid, so each effect has its own
 * column down the whole panel. Off units keep their slot, dimmed.
 */
export function FxPanel({ view, title = 'EFFECTS' }: { view: FxPanelView; title?: string }) {
  if (view.groups.length === 0) return null;
  const cols = Math.max(...view.groups.map((g) => g.units.length));
  return (
    <div className="ps-card ps-fx" style={{ '--fx-cols': cols } as CSSProperties}>
      <h4>{title}</h4>
      {view.groups.map((g) => (
        <div className="ps-fxgroup" key={g.key} data-kind={g.kind}>
          {g.label && <p className="ps-fxgroup-lbl">{g.label}</p>}
          <ol className="ps-fxunits" aria-label={g.label ? `${g.label} effects` : title}>
            {g.units.map((u) => <FxUnit key={u.key} unit={u} />)}
          </ol>
        </div>
      ))}
    </div>
  );
}
