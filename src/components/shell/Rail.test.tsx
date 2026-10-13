import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { buttonFor } from '../../test-utils/markup';
import { Rail, type SourceItem } from './Rail';
import { TopBar } from './TopBar';
import { PhoneTabs } from './PhoneTabs';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { CapabilitiesProvider } from '../../lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '../../lib/capabilities/types';
import { localAuth } from '../../lib/capabilities/defaults';

/** The website: the community is there and people can sign in. */
const website: Partial<Capabilities> = { community: { available: true }, auth: { ...localAuth, available: true } };
/** The desktop app: the community has a switch, and there is no way to sign in. */
const desktop = (on: boolean): Partial<Capabilities> => ({ community: { available: on, optIn: { on, set: () => {} } } });

function render(path: string, opts: { caps?: Partial<Capabilities>; sources?: SourceItem[]; activeSource?: 'all' | 'nord'; hasFolder?: boolean } = {}) {
  return renderToStaticMarkup(
    <CapabilitiesProvider value={opts.caps}>
      <Rail
        path={path}
        onNavigate={() => {}}
        counts={{ programs: 384, presets: 12, samples: 41, pianos: 18 }}
        sources={opts.sources ?? []}
        activeSource={opts.activeSource ?? 'all'}
        onPickSource={() => {}}
        hasFolder={opts.hasFolder}
      />
    </CapabilitiesProvider>,
  );
}


describe('Rail', () => {
  it('lists the library with counts, then the tools', () => {
    const html = render('/library/programs');
    for (const label of ['Programs', 'Presets', 'User Samples', 'Piano Samples', 'Device', 'Compatibility', 'Contribute']) {
      expect(html).toContain(`>${label}<`);
    }
    expect(html).toContain('>384<');
  });

  it('marks the open list, including below it', () => {
    expect(buttonFor(render('/library/samples'), 'User Samples')).toContain('aria-current="page"');
    expect(buttonFor(render('/library/programs/local:abc'), 'Programs')).toContain('aria-current="page"');
  });

  it('shows sources only when there are some, and lights the picked one beside Programs', () => {
    expect(render('/library/programs')).not.toContain('Sources');
    const html = render('/library/programs', { sources: [{ source: 'nord', label: 'On Nord', count: 512, live: true }], activeSource: 'nord' });
    expect(html).toContain('Sources');
    expect(buttonFor(html, 'On Nord')).toContain('aria-pressed="true"');
    // Programs is still the open page; the source shows what it's filtered to.
    expect(buttonFor(html, 'Programs')).toContain('aria-current="page"');
  });

  it('shows Sources for a connected folder even with no programs from it', () => {
    expect(render('/library/programs')).not.toContain('>Sources<');
    expect(render('/library/programs', { hasFolder: true })).toContain('>Sources<');
  });

  it('exposes the developer tools entry', () => {
    expect(render('/library')).toContain('Developer');
  });

  it('hides Community when the community capability is unavailable (open build)', () => {
    expect(render('/library')).not.toContain('Community');
  });

  it('shows Community with its sub-items when the capability is available and active', () => {
    const html = render('/community', { caps: website });
    for (const label of ['Community', 'Browse', 'Share a patch', 'My shares']) expect(html).toContain(`>${label}<`);
  });

  it('shows Community where it can be turned on, before it is', () => {
    expect(render('/library', { caps: desktop(false) })).toContain('>Community<');
  });

  it('lists no account-only pages where there is no way to sign in', () => {
    for (const on of [false, true]) {
      const html = render('/community', { caps: desktop(on) });
      expect(html).toContain('>Community<');
      // With sharing gone, "Browse" would be the only sub-item, naming the page it sits under.
      for (const label of ['Browse', 'Share a patch', 'My shares']) expect(html).not.toContain(`>${label}<`);
    }
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
    const tabs = (path: string) => renderToStaticMarkup(<PhoneTabs path={path} onNavigate={() => {}} onMore={() => {}} />);
    expect(buttonFor(tabs('/library/presets'), 'Presets')).toContain('aria-current="page"');
    expect(tabs('/device')).not.toContain('aria-current');
  });
});
