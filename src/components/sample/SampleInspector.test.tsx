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
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';

describe('SampleEditPanel', () => {
  it('renders the keyboard map editor: name, the selected sample, and a band per zone', () => {
    const model: EditModel = {
      name: 'My Strings',
      zones: [
        { rootKey: 48, keyHigh: 60, velTop: 127 },
        { rootKey: 72, keyHigh: 96, velTop: 127 },
      ],
    };
    const decoded: DecodedStrokeResult[] = [
      { index: 0, channelCount: 1, endOffset: 0, channels: [new Int32Array([0, 1])] },
      { index: 1, channelCount: 1, endOffset: 0, channels: [new Int32Array([0, 1])] },
    ];
    const html = renderToStaticMarkup(<SampleEditPanel initial={model} decoded={decoded} codec={3} />);
    expect(html).toContain('My Strings');         // editable name
    expect(html).toContain('Download edited .nsmp3');
    expect(html).toContain('ps-kbd');             // the keyboard map
    expect(html).toContain('>S1<');               // one band per zone
    expect(html).toContain('>S2<');
    expect(html).toContain('Sample 1');           // selected-zone fine-tune
  });
});
