import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { Rail, type SourceItem } from './Rail';
import { TopBar } from './TopBar';
import { PhoneTabs } from './PhoneTabs';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { CapabilitiesProvider } from '../../lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '../../lib/capabilities/types';

function render(active: string, opts: { caps?: Partial<Capabilities>; sources?: SourceItem[]; activeSource?: 'all' | 'nord' } = {}) {
  return renderToStaticMarkup(
    <CapabilitiesProvider value={opts.caps}>
      <Rail
        active={active}
        onNavigate={() => {}}
        counts={{ programs: 384, presets: 12, samples: 41, pianos: 18 }}
        sources={opts.sources}
        activeSource={opts.activeSource}
      />
    </CapabilitiesProvider>,
  );
}

/** The `<button …>` tag that holds `label`. */
function buttonFor(html: string, label: string): string {
  const idx = html.indexOf(`>${label}<`);
  return html.slice(html.lastIndexOf('<button', idx), idx);
}

describe('Rail', () => {
  it('lists the library with counts, then the tools', () => {
    const html = render('library/programs');
    for (const label of ['Programs', 'Presets', 'User Samples', 'Piano Samples', 'Device', 'Compatibility', 'Contribute']) {
      expect(html).toContain(`>${label}<`);
    }
    expect(html).toContain('>384<');
    // Every category is ready: no disabled entries (the literal attribute, not
    // the `disabled:*` variant in the class list).
    for (const label of ['Programs', 'Presets', 'User Samples', 'Piano Samples']) {
      expect(buttonFor(html, label)).not.toContain('disabled=""');
    }
  });

  it('marks the open list, including below it', () => {
    expect(buttonFor(render('library/samples'), 'User Samples')).toContain('aria-current="page"');
    expect(buttonFor(render('library/programs/local:abc'), 'Programs')).toContain('aria-current="page"');
  });

  it('shows sources only when there are some, and moves the highlight to a picked one', () => {
    expect(render('library/programs')).not.toContain('Sources');
    const html = render('library/programs', { sources: [{ source: 'nord', label: 'On Nord', count: 512, live: true }], activeSource: 'nord' });
    expect(html).toContain('Sources');
    expect(buttonFor(html, 'On Nord')).toContain('aria-current="page"');
    expect(buttonFor(html, 'Programs')).not.toContain('aria-current');
  });

  it('exposes the developer tools entry', () => {
    expect(render('library')).toContain('Developer');
  });

  it('hides Community when the community capability is unavailable (open build)', () => {
    expect(render('library')).not.toContain('Community');
  });

  it('shows Community with its sub-items when the capability is available and active', () => {
    const html = render('community', { caps: { community: { available: true } } });
    for (const label of ['Community', 'Browse', 'Share a patch', 'My shares']) expect(html).toContain(`>${label}<`);
  });
});

describe('TopBar', () => {
  async function renderTopBar(): Promise<string> {
    const router = createRouter({
      routeTree: createRootRoute({ component: () => <TopBar onSearch={() => {}} onManageDevice={() => {}} /> }),
      history: createMemoryHistory({ initialEntries: ['/library'] }),
    });
    await router.load();
    return renderToStaticMarkup(<DeviceProvider><RouterProvider router={router} /></DeviceProvider>);
  }

  it('carries the wordmark, the jump-to field and the disconnected state', async () => {
    const html = await renderTopBar();
    expect(html).toContain('open<span class="text-accent">nord</span>');
    expect(html).toContain('Go to a program, sample or page');
    expect(html).toContain('No Nord connected');
    expect(html).toContain('>Connect<');
  });
});

describe('PhoneTabs', () => {
  it('lights the open list and falls back to More elsewhere', () => {
    const tabs = (active: string) => renderToStaticMarkup(<PhoneTabs active={active} onNavigate={() => {}} onMore={() => {}} />);
    expect(buttonFor(tabs('library/presets'), 'Presets')).toContain('aria-current="page"');
    expect(tabs('device')).not.toContain('aria-current');
  });
});
