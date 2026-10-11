import type { DrawbarView } from '../../lib/clavia/engine-view';
import type { ProgramZonesView } from '../../lib/ns4/view';
import { DrawbarStack, IdentityLcd } from '../program/widgets';
import { ZonesPanel } from '../program/ProgramZones';
import '../../styles/nord.css';

// An example program, drawn with the same widgets the program screen uses: organ
// on the left hand, piano with a synth pad on the right, split at C4.
const ZONES: ProgramZonesView = {
  hasSplit: true,
  zones: [
    { layers: [{ kind: 'organ', id: 'A' }] },
    { layers: [{ kind: 'organ', id: 'A' }] },
    { layers: [{ kind: 'piano', id: 'A' }, { kind: 'synth', id: 'A' }] },
    { layers: [{ kind: 'piano', id: 'A' }, { kind: 'synth', id: 'A' }] },
  ],
  boundaries: [null, 'C4', null],
  xfade: [null, '+/- 6 semitones', null],
  transpose: null,
  performance: { sustain: true, kbHold: false },
};

// The classic 88 8000 000 registration.
const FOOT = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];
const CAP: DrawbarView['color'][] = ['brown', 'brown', 'white', 'white', 'black', 'white', 'black', 'black', 'white'];
const DRAWBARS: DrawbarView[] = [8, 8, 8, 0, 0, 0, 0, 0, 0].map((level, i) => ({
  level, label: String(level), footage: FOOT[i], color: CAP[i],
}));

const FX: { label: string; on: boolean }[] = [
  { label: 'Rotary · slow', on: true },
  { label: 'Reverb · hall', on: true },
  { label: 'Delay', on: false },
];

/**
 * The hero's picture of the product: a program as OpenNord draws it, built from
 * the real instrument widgets rather than a mock-up, so the landing page shows
 * exactly what opening a file looks like.
 */
export function HeroInstrument() {
  return (
    <figure className="m-0 min-w-0">
      <div className="flex flex-col gap-4 rounded-lg border border-line fill-surface elev-3 p-4" aria-hidden="true">
        <IdentityLcd name="A:11 Sunday Service" lines={['Organ · v3.13']} />
        <ZonesPanel view={ZONES} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-[264px] max-w-full flex-none">
            <div className="ps-zones-t mb-2">ORGAN A · B3</div>
            <DrawbarStack drawbars={DRAWBARS} />
          </div>
          <div className="flex flex-col items-start gap-1.5">
            {FX.map((f) => <span key={f.label} className={f.on ? 'ps-key on' : 'ps-key'}>{f.label}</span>)}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 font-mono text-[11px] text-muted">
        An example program, drawn the way OpenNord shows yours.
      </figcaption>
    </figure>
  );
}
