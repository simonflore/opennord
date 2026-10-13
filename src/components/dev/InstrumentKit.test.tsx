import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InstrumentKit } from './InstrumentKit';

describe('InstrumentKit', () => {
  const html = renderToStaticMarkup(<InstrumentKit />);

  it('renders every widget family the panel uses', () => {
    expect(html).toContain('ps-models');
    expect(html).toContain('ps-tg-btn on');
    expect(html).toContain('ps-tgroup dim');
    expect(html).toContain('ps-dial-flat');
    expect(html).toContain('ps-dbstack');
    expect(html).toContain('ps-lcd');
    expect(html).toContain('ps-meter');
    expect(html).toContain('ps-stats');
    expect(html).toContain('ps-env');
    expect(html).toContain('ps-fxunit');
  });

  it('shows a pushed-in drawbar with its cap (level 0 still renders a tab)', () => {
    expect(html).toContain('--lvl:0');
    expect(html).toContain('ps-db-tab black');
  });

  it('draws its swatches from tokens, never raw colours', () => {
    expect(html).toContain('var(--accent)');
    expect(html).toContain('var(--lcd-screen)');
    expect(html).not.toMatch(/background:#[0-9a-f]{3,8}/i);
  });
});
