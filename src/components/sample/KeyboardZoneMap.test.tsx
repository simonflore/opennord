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

  it('advertises "click to audition" per zone when onPlayZone is provided', () => {
    const html = renderToStaticMarkup(
      <KeyboardZoneMap zones={zones} selected={0} onSelect={() => {}} onChangeKeyHigh={() => {}} onPlayZone={() => {}} />,
    );
    expect(html.split('click to audition').length - 1).toBe(zones.length);
  });

  it('omits the audition hint when onPlayZone is absent (read-only / non-decodable)', () => {
    const html = renderToStaticMarkup(
      <KeyboardZoneMap zones={zones} selected={0} onSelect={() => {}} onChangeKeyHigh={() => {}} />,
    );
    expect(html).not.toContain('click to audition');
  });

  it('numbers zones by keyboard position (S1 leftmost) regardless of stroke order', () => {
    // Zones supplied high→low (as real .nsmp store them) must still label S1 at
    // the far left and S3 at the far right.
    const reversed: EditZone[] = [
      { rootKey: 96, keyHigh: 108, velTop: 127 },
      { rootKey: 60, keyHigh: 72, velTop: 127 },
      { rootKey: 30, keyHigh: 40, velTop: 127 },
    ];
    const html = renderToStaticMarkup(
      <KeyboardZoneMap zones={reversed} selected={-1} onSelect={() => {}} />,
    );
    // bands render left→right, so S1 must appear before S2 before S3 in the markup
    expect(html.indexOf('>S1<')).toBeLessThan(html.indexOf('>S2<'));
    expect(html.indexOf('>S2<')).toBeLessThan(html.indexOf('>S3<'));
  });

  it('renders drag handles only when editable (onChangeKeyHigh provided)', () => {
    const editable = renderToStaticMarkup(
      <KeyboardZoneMap zones={zones} selected={0} onSelect={() => {}} onChangeKeyHigh={() => {}} />,
    );
    const readOnly = renderToStaticMarkup(
      <KeyboardZoneMap zones={zones} selected={-1} onSelect={() => {}} />,
    );
    expect(editable).toContain('ew-resize');     // split handles present
    expect(readOnly).not.toContain('ew-resize'); // read-only: bands only, no handles
    expect(readOnly).toContain('>S1<');          // zones still drawn
  });
});
