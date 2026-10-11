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
    expect(html).toContain('Ready to test'); // read from the model's own firmware or files
    expect(html).toContain('Likely');        // assumed from a sibling (Stage Classic, C2)
    expect(html).not.toContain('In progress');
  });
  it('shows the parameter count of the firmware-layout readers', () => {
    expect(render()).toMatch(/Nord Grand<\/th><td[^>]*>\d+ params/);
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
