import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrowseToolbar, type FacetGroup } from './BrowseToolbar';

const base = {
  query: '', onQuery: () => {}, placeholder: 'Search…',
  sort: 'default', sortOptions: [{ key: 'default', label: 'Default' }], onSort: () => {}, sortAriaLabel: 'Sort',
};

const facet = (options: { key: string; label: string }[], value = 'all'): FacetGroup => ({
  ariaLabel: 'Filter by category', value, options, onChange: () => {},
});

const many = [{ key: 'all', label: 'All' }, ...Array.from({ length: 12 }, (_, i) => ({ key: `c${i}`, label: `Cat ${i}` }))];

describe('BrowseToolbar facet collapse', () => {
  it('renders every chip for a short facet', () => {
    const opts = [{ key: 'all', label: 'All' }, { key: 'nord', label: 'On Nord' }, { key: 'local', label: 'Local' }];
    const html = renderToStaticMarkup(<BrowseToolbar {...base} facets={[facet(opts)]} />);
    expect(html).toContain('On Nord');
    expect(html).toContain('Local');
    expect(html).not.toContain('more'); // no collapse toggle
  });

  it('collapses a long facet to the All chip + a "+N more" toggle', () => {
    const html = renderToStaticMarkup(<BrowseToolbar {...base} facets={[facet(many)]} />);
    expect(html).toContain('All');
    expect(html).toContain('+ 12 more'); // 13 options − 1 shown ("All")
    expect(html).not.toContain('Cat 5');  // hidden until expanded
  });

  it('keeps the active selection visible while collapsed', () => {
    const html = renderToStaticMarkup(<BrowseToolbar {...base} facets={[facet(many, 'c7')]} />);
    expect(html).toContain('Cat 7');      // active chip stays shown
    expect(html).toContain('+ 11 more');  // All + active shown → 11 hidden
    expect(html).not.toContain('Cat 3');
  });
});

describe('BrowseToolbar facet as a dropdown', () => {
  it('renders a select with every option, "All" named by the facet, and no chips', () => {
    const formats = { ...facet([{ key: 'all', label: 'All' }, { key: 'og', label: '.nsmp' }, { key: '4', label: '.nsmp4' }], '4'),
      ariaLabel: 'Filter by format', select: { allLabel: 'All formats' } };
    const html = renderToStaticMarkup(<BrowseToolbar {...base} facets={[formats]} />);
    expect(html).toMatch(/<select[^>]*aria-label="Filter by format"/);
    expect(html).toContain('>All formats</option>');
    expect(html).toContain('<option value="4" selected="">.nsmp4</option>');
    expect(html).not.toContain('role="group"');
  });
});
