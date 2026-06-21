import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import type { SampleHeaderView, ZoneRow } from '../../lib/ns4/sample-view';

describe('SampleHeader', () => {
  it('renders name, codec, stroke count, and a factory badge when suspected', () => {
    const view: SampleHeaderView = {
      name: 'VLV Strings', codecLabel: '.nsmp3', version: '3.00',
      checksumOk: true, checksumKnown: true, strokeCount: 8, sizeBytes: 2048, isFactory: true,
    };
    const html = renderToStaticMarkup(<SampleHeader view={view} />);
    expect(html).toContain('VLV Strings');
    expect(html).toContain('.nsmp3');
    expect(html).toContain('8 samples');
    expect(html).toContain('factory');
  });
});

describe('ZoneMap', () => {
  it('renders a row per zone with note names', () => {
    const rows: ZoneRow[] = [
      { globalID: 1, rootNote: 'C4', btmNote: 'C4', topNote: 'B4', velTop: 127, velLow: 0 },
      { globalID: 2, rootNote: 'C5', btmNote: 'C5', topNote: 'B5', velTop: 127, velLow: 0 },
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

import { SampleInspector } from './SampleInspector';

describe('SampleInspector', () => {
  it('renders the drop zone before a file is loaded', () => {
    const html = renderToStaticMarkup(<SampleInspector />);
    expect(html).toContain('.nsmp');
    expect(html.toLowerCase()).toContain('drop');
  });
});

import { SampleEditPanel } from './SampleEditPanel';
import type { EditModel } from '../../lib/ns4/sample-edit';

describe('SampleEditPanel', () => {
  it('renders the keyboard map editor: name, the selected sample, and a band per zone', () => {
    const model: EditModel = {
      name: 'My Strings',
      zones: [
        { rootKey: 48, keyLow: 48, keyHigh: 60, velTop: 127, velLow: 0, recordOffset: 100 },
        { rootKey: 72, keyLow: 72, keyHigh: 96, velTop: 127, velLow: 0, recordOffset: 116 },
      ],
    };
    const html = renderToStaticMarkup(<SampleEditPanel initial={model} bytes={new Uint8Array(0)} codec={3} />);
    expect(html).toContain('My Strings');               // editable name
    expect(html).toContain('Download edited .nsmp3');
    expect(html).toContain('ps-kbd');                   // the keyboard map
    expect(html).toContain('>S1<');                     // a labeled band per sample
    expect(html).toContain('>S2<');
    expect(html).toContain('up to (split)');            // the synced all-zones table
    expect(html.split('<tr').length - 1).toBeGreaterThanOrEqual(3); // header + a row per zone
  });
});
