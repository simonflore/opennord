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
  it('shows a Sounds-decoded column with Stage 4 parameter count', () => {
    const html = render();
    expect(html).toContain('Sounds');
    expect(html).toContain('params'); // Stage 4 → "406 params"
  });
});
