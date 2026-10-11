// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { Matrix } from './Matrix';

async function render(): Promise<string> {
  const router = createRouter({
    routeTree: createRootRoute({ component: Matrix }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe('home Matrix', () => {
  it('reads each cell from validation.ts (weakest capability per column)', async () => {
    const html = await render();
    expect(html).toContain('aria-label="Transfer: Validated on hardware"'); // Stage 4
    // Electro 6 transfer comes from its own OS 2.66 firmware: ready to test, no longer "likely".
    const e6 = html.slice(html.indexOf('Nord Electro 6'), html.indexOf('Nord Piano 5'));
    expect(e6).toContain('Transfer: Ready to test');
    expect(e6).not.toContain('Likely');
    // Lead 4 has no sample engine.
    expect(html.slice(html.indexOf('Nord Lead 4'))).toContain('Samples: Not applicable');
  });
});
