import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from '../../lib/ns4/parse';
import { programNameFromFilename } from '../../lib/ns4/name';
import { Knob, DrawbarLadder, Lcd, Chip, Meter } from './widgets';

describe('widgets', () => {
  it('Knob renders value + caption', () => {
    const html = renderToStaticMarkup(<Knob value="84" caption="cutoff" fill={66} />);
    expect(html).toContain('84');
    expect(html).toContain('cutoff');
    expect(html).toContain('--v:66');
  });

  it('DrawbarLadder renders one bar per value', () => {
    const html = renderToStaticMarkup(<DrawbarLadder values={[8, 0, 4]} />);
    expect(html.split('ps-bar').length - 1).toBe(3);
  });

  it('Lcd renders primary + secondary', () => {
    const html = renderToStaticMarkup(<Lcd primary="Saw" secondary="LP12 · 84" />);
    expect(html).toContain('Saw');
    expect(html).toContain('LP12 · 84');
  });

  it('Chip renders label + detail', () => {
    const html = renderToStaticMarkup(<Chip label="REVERB" detail="Hall" />);
    expect(html).toContain('REVERB');
    expect(html).toContain('Hall');
  });

  it('Meter renders label, value, and a clamped fill width', () => {
    const html = renderToStaticMarkup(<Meter label="vol" value="-4.7 dB" fill={77} />);
    expect(html).toContain('-4.7 dB');
    expect(html).toContain('width:77%');
  });
});

import { ProgramHeader } from './ProgramHeader';

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../../lib/ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);
function fixtureProgram() {
  const p = parseNs4Program(fixtureBytes);
  p.name = programNameFromFilename('regressionTest.ns4p');
  return p;
}

describe('ProgramHeader', () => {
  it('renders name, slot, category, version, and summary', () => {
    const html = renderToStaticMarkup(<ProgramHeader program={fixtureProgram()} />);
    expect(html).toContain('regressionTest');
    expect(html).toContain('H:81');
    expect(html).toContain('None');
    expect(html).toContain('v3.13');
    expect(html).toContain('organ + piano + synth · 6 layers');
  });
});

import { activeLayers } from '../../lib/ns4/view';
import { EngineCard } from './EngineCard';

describe('EngineCard', () => {
  const active = activeLayers(fixtureProgram());

  it('renders an organ card with model + drawbar ladder', () => {
    const html = renderToStaticMarkup(<EngineCard layer={active[0]} />);
    expect(html).toContain('ORGAN · A');
    expect(html).toContain('VOX');
    expect(html).toContain('ps-ladder');
  });

  it('renders a piano card with model name', () => {
    const html = renderToStaticMarkup(<EngineCard layer={active[2]} />);
    expect(html).toContain('PIANO · A');
    expect(html).toContain('Clavinet D6 6.1');
  });

  it('renders a synth card with osc LCD + filter cutoff', () => {
    const html = renderToStaticMarkup(<EngineCard layer={active[4]} />);
    expect(html).toContain('SYNTH · B');
    expect(html).toContain('ps-lcd');
    expect(html).toContain('3.7 kHz');
  });
});

import { FxRow } from './FxRow';

describe('FxRow', () => {
  it('renders FX chips for the fixture (incl. Reverb and Delay)', () => {
    const html = renderToStaticMarkup(<FxRow program={fixtureProgram()} />);
    expect(html).toContain('ps-chip');
    expect(html).toContain('Reverb');
    expect(html).toContain('Delay');
  });

  it('renders nothing when there are no active effects', () => {
    const empty = { parsed: true, kind: 'program', bytes: new Uint8Array(), warnings: [], layers: [] } as const;
    const html = renderToStaticMarkup(<FxRow program={empty as unknown as import('../../lib/ns4/types').NS4Program} />);
    expect(html).toBe('');
  });
});

import { SampleRefs } from './SampleRefs';

describe('SampleRefs', () => {
  it('lists referenced samples with sample-library deep-links', () => {
    const html = renderToStaticMarkup(<SampleRefs program={fixtureProgram()} />);
    expect(html).toContain('Flute Multi_ST 4.1');
    expect(html).toContain('https://www.nordkeyboards.com/sounds/sample-library/');
  });

  it('renders nothing when there are no sample refs', () => {
    const empty = { parsed: true, kind: 'program', bytes: new Uint8Array(), warnings: [], layers: [] } as const;
    const html = renderToStaticMarkup(<SampleRefs program={empty as unknown as import('../../lib/ns4/types').NS4Program} />);
    expect(html).toBe('');
  });
});

import { AllParamsDrawer } from './AllParamsDrawer';

describe('AllParamsDrawer', () => {
  it('renders the full decoded-parameter table for the loaded program', () => {
    const html = renderToStaticMarkup(<AllParamsDrawer program={fixtureProgram()} />);
    expect(html).toContain('Show all parameters');
    expect(html).toContain('layer on/off');
  });
});

import { ProgramView } from './ProgramView';

describe('ProgramView (integration)', () => {
  it('renders header, active engines, FX, sample refs, and the params drawer', () => {
    const html = renderToStaticMarkup(<ProgramView program={fixtureProgram()} />);
    expect(html).toContain('regressionTest');
    expect(html).toContain('H:81');
    expect(html).toContain('ORGAN · A');
    expect(html).toContain('PIANO · A');
    expect(html).toContain('SYNTH · B');
    expect(html).not.toContain('SYNTH · A');
    expect(html).toContain('VOX');
    expect(html).toContain('Clavinet D6 6.1');
    expect(html).toContain('3.7 kHz');
    expect(html).toContain('Reverb');
    expect(html).toContain('Flute Multi_ST 4.1');
    expect(html).toContain('Show all parameters');
  });

  it('shows warnings instead of a view when the program is not parsed', () => {
    const unparsed = parseNs4Program(new Uint8Array([1, 2, 3]));
    const html = renderToStaticMarkup(<ProgramView program={unparsed} />);
    expect(html).toContain('Not a recognized Stage 4 program');
  });
});
