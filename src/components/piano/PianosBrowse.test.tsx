// src/components/piano/PianosBrowse.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PianosBrowse } from './PianosBrowse';
import type { PianoEntry } from '@/lib/library/piano-entries';

const noop = () => {};
const base = { source: 'all' as const, setSource: noop, query: '', setQuery: noop, showSourceFacet: false, sort: 'default' as const, setSort: noop, isFavorite: () => false, toggleFavorite: noop, onSelect: noop };
const e = (over: Partial<PianoEntry>): PianoEntry => ({ id: '1', name: 'Grand', source: 'local', size: 1900000, factory: null, ...over });

describe('PianosBrowse', () => {
  it('renders a card with a humanized size', () => {
    const html = renderToStaticMarkup(<PianosBrowse {...base} entries={[e({ name: 'Grand Lady D', size: 1900000 })]} />);
    expect(html).toContain('Grand Lady D');
    expect(html).toMatch(/1\.\d+ MB|1,8 MB|2 MB/); // formatBytes output, not raw bytes
    expect(html).not.toContain('1900000');
  });
  it('shows a Factory tag only for factory pianos', () => {
    const factory = { url: 'https://nord/x', sizeKb: 1, sizeDescription: '1 GB', type: 'piano' as const };
    const withTag = renderToStaticMarkup(<PianosBrowse {...base} entries={[e({ factory })]} />);
    const without = renderToStaticMarkup(<PianosBrowse {...base} entries={[e({ factory: null })]} />);
    expect(withTag).toContain('Factory');
    expect(without).not.toContain('Factory');
  });
});
