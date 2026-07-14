import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Rail } from './Rail';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { CapabilitiesProvider } from '../../lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '../../lib/capabilities/types';

function render(active: string, caps?: Partial<Capabilities>) {
  return renderToStaticMarkup(
    <CapabilitiesProvider value={caps}>
      <DeviceProvider>
        <Rail active={active} onNavigate={() => {}} onManageDevice={() => {}} />
      </DeviceProvider>
    </CapabilitiesProvider>,
  );
}

describe('Rail', () => {
  it('renders the brand and primary destinations', () => {
    const html = render('library/programs');
    expect(html).toContain('Open');
    expect(html).toContain('Library');
    expect(html).toContain('Contribute');
  });

  it('renders the four category sub-items under Library, none disabled', () => {
    const html = render('library/programs');
    for (const label of ['Programs', 'Presets', 'User Samples', 'Piano Samples']) expect(html).toContain(label);
    // All four categories are now ready — no disabled category sub-items.
    for (const label of ['Programs', 'Presets', 'User Samples', 'Piano Samples']) {
      const idx = html.indexOf(`>${label}<`);
      const btnStart = html.lastIndexOf('<button', idx);
      expect(html.slice(btnStart, idx)).not.toContain('disabled');
    }
  });

  it('keeps Library lit while on a category path', () => {
    const html = render('library/samples');
    expect(html).toContain('on-nav--active');
  });

  it('shows the disconnected device state by default', () => {
    const html = render('library');
    expect(html).toContain('No Nord connected');
  });

  it('exposes the developer tools entry', () => {
    const html = render('library');
    expect(html).toContain('Developer');
  });

  it('hides Community when the community capability is unavailable (open build)', () => {
    expect(render('library')).not.toContain('Community');
  });

  it('shows Community with its sub-items when the capability is available and active', () => {
    const html = render('community', { community: { available: true } });
    expect(html).toContain('Community');
    for (const label of ['Browse', 'Share a patch', 'My shares']) expect(html).toContain(label);
  });
});
