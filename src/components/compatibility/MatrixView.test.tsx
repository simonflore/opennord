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
  it('labels unknown cells as needing a tester', () => {
    expect(render()).toContain('Needs a tester');
  });
  it('prompts to connect a Nord when none is connected', () => {
    expect(render()).toContain('the check is read-only');
  });
});
