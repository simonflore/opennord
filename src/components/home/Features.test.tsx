// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { CapabilitiesProvider } from '@/lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '@/lib/capabilities/types';
import { Features } from './Features';

async function render(value?: Partial<Capabilities>): Promise<string> {
  const router = createRouter({
    routeTree: createRootRoute({ component: Features }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await router.load();
  return renderToStaticMarkup(<CapabilitiesProvider value={value}><RouterProvider router={router} /></CapabilitiesProvider>);
}

describe('home Features', () => {
  it('lists sharing where the build has the community library, and stops calling it unshipped', async () => {
    const html = await render({ community: { available: true } as Capabilities['community'] });
    expect(html).toContain('Share your programs');
    expect(html).not.toContain('Community patch sharing');
    expect(html).toContain('AI-assisted search');
  });

  it('keeps sharing on the roadmap in a build without it', async () => {
    const html = await render();
    expect(html).not.toContain('Share your programs');
    expect(html).toContain('Community patch sharing');
  });

  it('does not claim a feature it calls experimental as proven', async () => {
    const html = await render();
    expect(html).toContain('not yet tried on a Nord');
  });
});
