// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { MatrixView } from './MatrixView';

// MatrixView embeds ProbePanel (uses DeviceContext), so render inside the provider.
const render = () => renderToStaticMarkup(<DeviceProvider><MatrixView /></DeviceProvider>);

describe('MatrixView', () => {
  it('renders a row per model and a validated chip for Stage 4', () => {
    const html = render();
    expect(html).toContain('Nord Stage 4');
    expect(html).toContain('Nord Stage 3');
    expect(html).toContain('text-connected'); // validated status color
  });
  it('shows graded statuses across the line (works / ready to test / likely)', () => {
    const html = render();
    expect(html).toContain('Works');         // Stage 4 (validated)
    expect(html).toContain('>Ready to test</td>'); // a cell, not just the intro: read from the model's own firmware or files
    expect(html).toContain('Likely');        // assumed from a sibling (Stage Classic, C2)
    expect(html).not.toContain('In progress');
  });
  it('explains each chip in a labelled legend', () => {
    const legend = render().match(/<ul[^>]*aria-label="What each status means"[^>]*>(.*?)<\/ul>/)?.[1] ?? '';
    for (const chip of ['Works', 'Ready to test', 'Likely', '—']) expect(legend).toContain(`${chip}</span>`);
  });
  it('says "Not yet" for undecoded models and "—" for the C1, which has no program files', () => {
    const html = render();
    expect(html).toMatch(/Nord C2<\/th><td[^>]*>Not yet</);
    expect(html).toMatch(/Nord C1<\/th><td[^>]*>—</);
  });
  it('marks the readers that cover every stored parameter as "full map"', () => {
    const html = render();
    const row = (name: string) => html.slice(html.indexOf(`${name}</th>`), html.indexOf('</tr>', html.indexOf(`${name}</th>`)));
    expect(row('Nord Electro 6')).toContain('full map');
    expect(row('Nord Lead 4')).toContain('full map');
    expect(row('Nord Wave 2')).not.toContain('full map'); // morph amounts not read yet
    expect(row('Nord Stage 3')).toContain('full map'); // firmware layout (#54)
    expect(row('Nord Stage 2')).not.toContain('full map'); // hand-built reader
    expect(row('Nord Stage 4')).not.toContain('full map'); // already validated
    expect(html).toContain('reads every parameter a program stores');
  });
  it('shows the parameter count of the firmware-layout readers', () => {
    expect(render()).toMatch(/Nord Grand<\/th><td[^>]*>\d+ params/);
    expect(render()).toMatch(/Nord Electro 3<\/th><td[^>]*>82 params/);
  });
  it('prompts to connect a Nord when none is connected', () => {
    expect(render()).toContain('the check is read-only');
  });
  it('links to the Contribute tool for undecoded models', () => {
    expect(render()).toContain('href="#/contribute"');
  });
  it('shows a Program Parameters column with Stage 4 parameter count', () => {
    const html = render();
    expect(html).toContain('Program Parameters');
    expect(html).toContain('params'); // Stage 4 → "406 params"
  });
  it('renders Fred’s six columns and drops Open files / List patches', () => {
    const html = render();
    for (const label of ['Program Parameters', 'Samples', 'Copy from Nord', 'Copy to Nord', 'Delete on Nord', 'Back up']) {
      expect(html).toContain(label);
    }
    expect(html).not.toContain('Open files');
    expect(html).not.toContain('List patches');
  });
});
