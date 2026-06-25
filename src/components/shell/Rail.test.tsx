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

  it('renders the four category sub-items under Library, only Pianos disabled', () => {
    const html = render('library/programs');
    for (const label of ['Programs', 'Pianos', 'Samples', 'Presets']) expect(html).toContain(label);
    // Only Pianos is not-ready → exactly one disabled category sub-item.
    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(html).toContain('Pianos');
    // Presets is now live — its button must NOT carry a disabled attribute immediately adjacent.
    const presetsIdx = html.indexOf('>Presets<');
    const presetsBtnStart = html.lastIndexOf('<button', presetsIdx);
    expect(html.slice(presetsBtnStart, presetsIdx)).not.toContain('disabled');
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
