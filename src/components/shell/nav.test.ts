import { describe, it, expect } from 'vitest';
import { PUBLIC_DOCS_URL, docsUrl } from './nav';

describe('docsUrl', () => {
  it('opens the docs next to the app on the website', () => {
    expect(docsUrl({ protocol: 'https:' }, false)).toBe('/docs/');
  });

  it('opens the published docs from the desktop and iPad apps, and the dev server', () => {
    expect(docsUrl({ protocol: 'file:' }, false)).toBe(PUBLIC_DOCS_URL);
    expect(docsUrl({ protocol: 'capacitor:' }, false)).toBe(PUBLIC_DOCS_URL);
    expect(docsUrl({ protocol: 'http:' }, true)).toBe(PUBLIC_DOCS_URL);
  });
});
