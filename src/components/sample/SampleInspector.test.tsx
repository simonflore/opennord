import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import type { SampleHeaderView, ZoneRow } from '../../lib/ns4/sample-view';

describe('SampleHeader', () => {
  it('renders name, codec, stroke count, and a factory badge when suspected', () => {
    const view: SampleHeaderView = {
      name: 'VLV Strings', codecLabel: '.nsmp3', version: '3.00',
      checksumOk: true, strokeCount: 8, sizeBytes: 2048, isFactory: true,
    };
    const html = renderToStaticMarkup(<SampleHeader view={view} />);
    expect(html).toContain('VLV Strings');
    expect(html).toContain('.nsmp3');
    expect(html).toContain('8 strokes');
    expect(html).toContain('factory');
  });
});

describe('ZoneMap', () => {
  it('renders a row per zone with note names', () => {
    const rows: ZoneRow[] = [
      { strokeIndex: 0, rootNote: 'C4', topNote: 'B4', velTop: 127 },
      { strokeIndex: 1, rootNote: 'C5', topNote: 'B5', velTop: 127 },
    ];
    const html = renderToStaticMarkup(<ZoneMap rows={rows} />);
    expect(html).toContain('C4');
    expect(html).toContain('B5');
    expect(html.split('<tr').length - 1).toBeGreaterThanOrEqual(3); // header + 2 rows
  });

  it('renders nothing when there are no zones', () => {
    expect(renderToStaticMarkup(<ZoneMap rows={[]} />)).toBe('');
  });
});
