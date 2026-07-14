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
    expect(html).toContain('cmp-cell--validated');
  });
  it('shows graded statuses across the line (works / in progress / likely)', () => {
    const html = render();
    expect(html).toContain('Works');        // Stage 4 (validated)
    expect(html).toContain('In progress');  // Stage 2/3 (reverse-engineered)
    expect(html).toContain('Likely');       // inferred from shared transport
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
