import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Rail } from './Rail';
import { DeviceProvider } from '../../lib/device/DeviceContext';

function render(active: string) {
  return renderToStaticMarkup(
    <DeviceProvider>
      <Rail active={active} onNavigate={() => {}} onManageDevice={() => {}} />
    </DeviceProvider>,
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
    for (const label of ['Programs', 'Pianos', 'Samples', 'Presets']) expect(html).toContain(label);
    // All four categories are now ready — no disabled category sub-items.
    for (const label of ['Programs', 'Pianos', 'Samples', 'Presets']) {
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
});
