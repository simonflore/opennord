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
  it('shows each capability as an icon whose accessible name says the status', () => {
    const html = render();
    expect(html).toContain('aria-label="Copy from Nord: Works"');          // Stage 4 (validated)
    expect(html).toContain('aria-label="Copy from Nord: Ready to test"');  // read from the model's own firmware
    expect(html).toContain('aria-label="Samples: Likely"');                // Electro 7's sample generation
    expect(html).toContain('aria-label="Samples: Not available"');         // no sample engine
    expect(html).not.toContain('In progress');
  });
  it('explains every icon in a labelled legend', () => {
    const legend = render().match(/<ul[^>]*aria-label="What each status means"[^>]*>(.*?)<\/ul>/)?.[1] ?? '';
    for (const label of ['Works', 'Ready to test', 'Likely', 'Not available', 'Full map']) {
      expect(legend).toContain(`${label}</span>`);
    }
  });
  const row = (html: string, name: string) =>
    html.slice(html.indexOf(`${name}</th>`), html.indexOf('</tr>', html.indexOf(`${name}</th>`)));
  it('has a reader for every model with program files; the C1 has none', () => {
    const html = render();
    expect(html).not.toContain('Program parameters: Needs a tester');
    expect(row(html, 'Nord C1')).toContain('aria-label="Program parameters: Not available"');
  });
  it('marks the readers that cover every stored parameter as a full map', () => {
    const html = render();
    expect(row(html, 'Nord Electro 6')).toContain(', full map');
    expect(row(html, 'Nord Lead 4')).toContain(', full map');
    expect(row(html, 'Nord Wave 2')).not.toContain(', full map'); // morph amounts not read yet
    expect(row(html, 'Nord Stage 3')).toContain(', full map');    // firmware layout
    expect(row(html, 'Nord Stage 2')).toContain(', full map');    // firmware descriptor layout
    expect(row(html, 'Nord Stage 2 EX')).toContain(', full map'); // same ns2p format
    expect(row(html, 'Nord Stage 4')).not.toContain(', full map'); // already validated
  });
  it('shows the parameter count as a bare number', () => {
    const html = render();
    expect(row(html, 'Nord Stage 4')).toContain('406 parameters');
    expect(row(html, 'Nord Grand')).toMatch(/\d+ parameters/);
    expect(row(html, 'Nord Electro 3')).toContain('82 parameters');
    expect(row(html, 'Nord Electro 5')).toContain('129 parameters');
    expect(row(html, 'Nord C2')).toContain('86 parameters');
  });
  it('reads Stage Classic / EX files: their record follows the CBIN framing rule', () => {
    const html = render();
    expect(html).not.toContain('Header only');
    expect(row(html, 'Nord Stage Classic')).toContain('199 parameters, full map');
    expect(row(html, 'Nord Stage EX')).toContain('199 parameters, full map');
  });
  it('prompts to connect a Nord when none is connected', () => {
    expect(render()).toContain('the check is read-only');
  });
  it('links to the Contribute tool for undecoded models', () => {
    expect(render()).toContain('href="#/contribute"');
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
