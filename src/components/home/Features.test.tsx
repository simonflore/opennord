import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CapabilitiesProvider } from '@/lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '@/lib/capabilities/types';
import { Features } from './Features';

const render = (value?: Partial<Capabilities>) =>
  renderToStaticMarkup(<CapabilitiesProvider value={value}><Features /></CapabilitiesProvider>);

describe('home Features', () => {
  it('lists sharing only where the build has the community library', () => {
    expect(render({ community: { available: true } as Capabilities['community'] })).toContain('Share your programs');
    expect(render()).not.toContain('Share your programs');
  });

  it('sends each feature, and the instrument list, to its page in the docs', () => {
    const html = render();
    for (const page of ['guide/programs/', 'guide/library/', 'guide/samples/', 'guide/convert/', 'guide/connect/', 'guide/backup/', 'reference/instruments/']) {
      expect(html).toContain(`docs/${page}"`);
    }
  });
});
