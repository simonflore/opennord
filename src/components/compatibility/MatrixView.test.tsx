// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatrixView } from './MatrixView';

describe('MatrixView', () => {
  it('renders a row per model and a validated chip for Stage 4', () => {
    const html = renderToStaticMarkup(<MatrixView />);
    expect(html).toContain('Nord Stage 4');
    expect(html).toContain('Nord Stage 3');
    expect(html).toContain('cmp-cell--validated');
  });
  it('labels unknown cells as needing a tester', () => {
    const html = renderToStaticMarkup(<MatrixView />);
    expect(html).toContain('Needs a tester');
  });
});
