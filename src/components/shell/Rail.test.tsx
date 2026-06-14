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
    const html = render('library');
    expect(html).toContain('Open');
    expect(html).toContain('Library');
    expect(html).toContain('Samples');
  });
  it('marks the active destination', () => {
    const html = render('library');
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
