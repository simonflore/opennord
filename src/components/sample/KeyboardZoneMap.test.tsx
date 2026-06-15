import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KeyboardZoneMap } from './KeyboardZoneMap';
import type { EditZone } from '../../lib/ns4/sample-edit';

const zones: EditZone[] = [
  { rootKey: 40, keyHigh: 40, velTop: 127 },
  { rootKey: 60, keyHigh: 72, velTop: 127 },
  { rootKey: 90, keyHigh: 108, velTop: 127 },
];

describe('KeyboardZoneMap', () => {
  it('renders a keyboard with one labeled band per sample and octave labels', () => {
    const html = renderToStaticMarkup(
      <KeyboardZoneMap zones={zones} selected={1} onSelect={() => {}} onChangeKeyHigh={() => {}} />,
    );
    expect(html).toContain('ps-kbd');
    expect(html).toContain('>S1<');
    expect(html).toContain('>S2<');
    expect(html).toContain('>S3<');
    expect(html).toContain('>C4<'); // middle-C octave label
    // selected band (index 1) gets the bright accent stroke
    expect(html).toContain('var(--red-bright)');
  });
});
