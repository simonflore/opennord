/**
 * Instrument kit — a developer page (/dev/kit, under the rail's Developer
 * section; RE builds only, like the other /dev tools) that renders the real panel
 * widgets in every state, next to the palette they draw from. It is the visual
 * reference for the B×A direction (tokens.css header): look here first when a
 * screen's knob, LED button, drawbar or LCD looks off, and add a state here when
 * a widget grows one. Not a product screen; the native build stubs it out.
 */

import '../../styles/nord.css';
import type { ReactNode } from 'react';
import { b3DrawbarViews, drawbarViews } from '../../lib/clavia/drawbars';
import { ORGAN_MODELS } from '../../lib/ns4/organ-models';
import { Card } from '../ui';
import { Chip, DrawbarStack, EnvCurve, Knob, Lcd, Meter, ModelSelector, StatGrid, ToggleGroup } from '../program/widgets';

/** The palette, by role. Each swatch is a token, so this list can't drift from tokens.css. */
const SWATCHES: Array<{ token: string; role: string }> = [
  { token: '--bg', role: 'ground' },
  { token: '--surface', role: 'surface' },
  { token: '--surface-2', role: 'module' },
  { token: '--line', role: 'line' },
  { token: '--ink', role: 'ink' },
  { token: '--dim', role: 'dim' },
  { token: '--muted', role: 'muted' },
  { token: '--accent', role: 'active · selected · changed' },
  { token: '--lcd-screen', role: 'LCD · identity only' },
  { token: '--connected', role: 'Nord connected' },
  { token: '--engine-synth', role: 'synth · zones' },
  { token: '--engine-organ', role: 'organ · zones' },
  { token: '--engine-piano', role: 'piano · zones' },
  { token: '--warn', role: 'warning · nearly full' },
  { token: '--danger', role: 'error · unknown' },
];

// Built by the same helpers the real panel uses, so the kit can't drift from it.
// A B3 registration showing every cap colour, a morph target and pushed-in bars;
// then a non-B3 model, which draws every bar in the single default colour.
const B3 = b3DrawbarViews([8, 8, 8, 4, 0, 2, 0, 6, 0]).map((d, i) => (i === 2 ? { ...d, morph: { wheel: '5' } } : d));
const VOX = drawbarViews([8, 6, 4, 0, 2, 0, 5]);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="m-0 text-[11px] font-semibold uppercase tracking-[.09em] text-dim">{title}</h2>
      {children}
    </Card>
  );
}

export function InstrumentKit() {
  return (
    <div className="ps flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-mono text-lg font-semibold">
          open<span className="text-accent">nord</span> <span className="font-normal text-dim">/ kit</span>
        </h1>
        <p className="m-0 max-w-[70ch] font-mono text-xs text-dim">
          Physical only where it is a control on the Nord. Every physical control shows its number. One accent means
          active, selected or changed.
        </p>
      </header>

      <Section title="Palette">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-0">
          {SWATCHES.map((s) => (
            <li key={s.token} className="flex flex-col gap-1.5">
              <span
                className="h-11 rounded-md shadow-[inset_0_0_0_1px_var(--line)]"
                style={{ background: `var(${s.token})` }}
              />
              <code className="font-mono text-[11px] text-ink">{s.token}</code>
              <span className="text-[11px] text-dim">{s.role}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-2xl font-bold">Soul Split <span className="font-mono text-[11px] font-normal text-dim">sans 700 · names</span></p>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[.09em] text-dim">Organ A · Rotary · Timbre <span className="font-mono normal-case tracking-normal">sans 600 caps · labels</span></p>
          <p className="m-0 font-mono text-xs">A:12 · 3.2 kHz · -6.0 dB · 888 000 000 <span className="text-dim">mono · values and slots</span></p>
          <div className="self-start"><Lcd primary="A:12 SOUL SPLIT" secondary="Share Tech Mono · LCD only" /></div>
        </div>
      </Section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        <Section title="LED buttons">
          <ModelSelector models={ORGAN_MODELS} active="B3" />
          <ToggleGroup label="Percussion" items={[
            { label: 'On', on: true }, { label: '2nd', on: false }, { label: '3rd', on: true }, { label: 'Fast', on: false },
          ]} />
          <ToggleGroup label="Not available on this model" groupDim items={[{ label: 'On', on: false }, { label: 'Soft', on: false }]} />
        </Section>

        <Section title="Knobs · ring = where in the range, number = the value">
          <div className="ps-knobs">
            <Knob value="0" caption="min" fill={0} />
            <Knob value="5.0" caption="mid" fill={50} />
            <Knob value="10" caption="max" fill={100} />
            <Knob value="soft" caption="no range" />
            <Knob value="3.2 kHz" caption="morphed" fill={62} morph={{ wheel: '8.1 kHz' }} />
          </div>
        </Section>

        <Section title="Drawbars · B3 and a generic model">
          <DrawbarStack drawbars={B3} />
          <DrawbarStack drawbars={VOX} />
        </Section>

        <Section title="LCD · identity only">
          <Lcd primary="Classic · Saw" secondary="mono · glide 12 · LP24" />
        </Section>

        <Section title="Data · flat">
          <Meter label="Volume" value="-6.0 dB" fill={72} />
          <StatGrid stats={[{ label: 'Attack', value: '0 ms' }, { label: 'Decay', value: '410 ms' }, { label: 'Sustain', value: '8' }, { label: 'Release', value: '120 ms' }]} />
          <EnvCurve a={0.05} d={0.55} s={0.3} r={0.4} caption="Amp envelope" />
          <div className="ps-chips">
            <Chip label="Reverb" detail="Hall · 3.1 s" />
            <Chip label="Rotary" detail="Slow" />
          </div>
        </Section>
      </div>
    </div>
  );
}
