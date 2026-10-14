import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DesktopApp, RELEASED } from './DesktopApp';

describe('DesktopApp', () => {
  it('links a download only while a build is published', () => {
    const html = renderToStaticMarkup(<DesktopApp />);
    expect(html.includes('releases/latest/download/')).toBe(RELEASED);
    expect(html.includes('Coming soon')).toBe(!RELEASED);
  });
});
