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

  it('Knob renders a neutral dial (no arc) when fill is omitted', () => {
    const html = renderToStaticMarkup(<Knob value="MID" caption="timbre" />);
    expect(html).toContain('MID');
    expect(html).toContain('ps-dial-flat');
    expect(html).not.toContain('--v:');
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

// The fixture's synths are all analog, so it has no played samples. This variant
// flips synth C (Flute) to enabled samples-mode to exercise the sample-refs path.
function programWithSampleLayer() {
  const p = fixtureProgram();
  const layers = (p.layers ?? []).map((l) =>
    l.kind === 'synth' && l.id === 'C' ? { ...l, enabled: true, source: 'samples' as const } : l,
  );
  return { ...p, layers };
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

import { activeLayers, synthStats, organStats, pianoStats, ampEnvCurve, programZones, fxChips } from '../../lib/ns4/view';
import { EngineCard } from './EngineCard';
import { ProgramZones } from './ProgramZones';

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

  it('surfaces secondary synth params as a stat grid + amp-env curve', () => {
    const html = renderToStaticMarkup(<EngineCard layer={active[4]} />);
    expect(html).toContain('ps-stats'); // the new StatGrid
    expect(html).toContain('ps-env');   // the amp envelope glyph
  });
});

describe('synth view-model enrichment (against the fixture)', () => {
  const synth = activeLayers(fixtureProgram()).find((l) => l.kind === 'synth')!;

  it('finds an active synth layer in the fixture', () => {
    expect(synth).toBeTruthy();
  });

  it('synthStats returns non-empty, well-formed label/value pairs', () => {
    const stats = synthStats(synth);
    expect(stats.length).toBeGreaterThan(0);
    expect(stats.every((s) => s.label.length > 0 && s.value.length > 0)).toBe(true);
  });

  it('ampEnvCurve proportions sum to ~1 with a 0–1 sustain (when env data present)', () => {
    const env = ampEnvCurve(synth);
    if (env) {
      expect(env.a + env.d + env.r).toBeCloseTo(1, 5);
      expect(env.s).toBeGreaterThan(0);
      expect(env.s).toBeLessThanOrEqual(1);
    }
  });
});

describe('organ + piano card enrichment', () => {
  const active = activeLayers(fixtureProgram());

  it('organStats / pianoStats return well-formed present-only pairs', () => {
    for (const l of active.filter((x) => x.kind === 'organ')) {
      expect(organStats(l).every((s) => s.label.length > 0 && s.value.length > 0)).toBe(true);
    }
    for (const l of active.filter((x) => x.kind === 'piano')) {
      expect(pianoStats(l).every((s) => s.label.length > 0 && s.value.length > 0)).toBe(true);
    }
  });

  it('the fixture organ with percussion surfaces a perc stat', () => {
    const withPerc = active.find((l) => l.kind === 'organ' && l.percussion?.on);
    if (withPerc) {
      expect(organStats(withPerc).some((s) => s.label === 'perc')).toBe(true);
      const html = renderToStaticMarkup(<EngineCard layer={withPerc} />);
      expect(html).toContain('ps-stats');
    }
  });
});

describe('layer scenes', () => {
  it('parses the saved active scene (the fixture is Scene I)', () => {
    expect(fixtureProgram().activeScene).toBe('I');
  });

  it('activeLayers honors the active scene (enabled vs enabledSceneII)', () => {
    const synthetic = {
      ...fixtureProgram(),
      activeScene: 'II' as const,
      layers: [
        { id: 'A', kind: 'synth', enabled: true, enabledSceneII: false },
        { id: 'B', kind: 'synth', enabled: false, enabledSceneII: true },
      ],
    } as unknown as import('../../lib/ns4/types').NS4Program;
    expect(activeLayers(synthetic).map((l) => l.id)).toEqual(['B']);        // Scene II active
    expect(activeLayers(synthetic, 'I').map((l) => l.id)).toEqual(['A']);   // explicit override
  });
});

describe('fx chips carry effect params', () => {
  it('every enabled chip has a non-empty detail', () => {
    const chips = fxChips(fixtureProgram());
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.every((c) => c.detail.length > 0)).toBe(true);
  });
});

describe('program zones (split map)', () => {
  it('returns four zones and three boundaries with valid layer kinds', () => {
    const z = programZones(fixtureProgram());
    expect(z.zones).toHaveLength(4);
    expect(z.boundaries).toHaveLength(3);
    for (const zone of z.zones) {
      for (const l of zone.layers) {
        expect(['organ', 'piano', 'synth']).toContain(l.kind);
        expect(['A', 'B', 'C']).toContain(l.id);
      }
    }
  });

  it('renders a zone bar when the program is split', () => {
    const z = programZones(fixtureProgram());
    const html = renderToStaticMarkup(<ProgramZones program={fixtureProgram()} />);
    expect(typeof html).toBe('string');
    if (z.hasSplit) expect(html).toContain('ps-zonebar');
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
  it('lists played samples with deep-links (official download when resolved, library otherwise)', () => {
    const html = renderToStaticMarkup(<SampleRefs program={programWithSampleLayer()} />);
    expect(html).toContain('Flute Multi_ST 4.1');
    // Flute Multi_ST 4.1 is in the factory catalog — resolves to the official download URL.
    // If the fixture sample name ever stops resolving, the fallback sample-library URL is used.
    expect(html).toMatch(/href="https:\/\/www\.nordkeyboards\.com\//);
  });

  it('renders nothing for an all-analog patch (no played samples)', () => {
    const html = renderToStaticMarkup(<SampleRefs program={fixtureProgram()} />);
    expect(html).toBe('');
  });

  it('renders nothing when there are no sample refs', () => {
    const empty = { parsed: true, kind: 'program', bytes: new Uint8Array(), warnings: [], layers: [] } as const;
    const html = renderToStaticMarkup(<SampleRefs program={empty as unknown as import('../../lib/ns4/types').NS4Program} />);
    expect(html).toBe('');
  });
});

import { AllParamsDrawer } from './AllParamsDrawer';
import { decodeAllParams } from '../../lib/ns4/coverage';
import { buildParamMap } from '../../lib/ns4/maps';
import { collapseMorphs } from '../../lib/ns4/params-view';

describe('AllParamsDrawer', () => {
  it('renders the reorganized parameter reference for the loaded program', () => {
    const html = renderToStaticMarkup(<AllParamsDrawer program={fixtureProgram()} />);
    expect(html).toContain('Show all parameters');
    expect(html).toContain('layer on/off');
  });

  it('groups params into collapsible sections with a search field', () => {
    const html = renderToStaticMarkup(<AllParamsDrawer program={fixtureProgram()} />);
    expect(html).toContain('ps-param-search');      // the search box
    expect(html).toContain('ps-pgroup');            // collapsible group panels
    expect(html).toContain('Synth');                // a section label
  });

  it('shows fewer rows than the raw dump (morphs collapsed)', () => {
    const all = decodeAllParams(fixtureProgram().bytes, buildParamMap());
    const collapsed = collapseMorphs(all);
    expect(collapsed.length).toBeLessThan(all.length);
  });
});

import { ProgramView } from './ProgramView';

describe('ProgramView (integration)', () => {
  it('renders header, active engines, FX, sample refs, and the params drawer', () => {
    // Use the sample-bearing variant so the full view (incl. sample refs) renders.
    const html = renderToStaticMarkup(<ProgramView program={programWithSampleLayer()} />);
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
