import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StrokeList, type InspectorStroke } from './StrokeList';

function stroke(index: number, ok = true): InspectorStroke {
  return {
    summary: { index, sampleCount: ok ? 4 : 0, channels: 1, peak: 1, ok },
    channels: [new Int32Array([0, 1, -1, 0])],
  };
}

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe('StrokeList export controls', () => {
  it('shows a WAV button per stroke and an "Export all" button for 2+ decodable strokes', () => {
    const html = renderToStaticMarkup(<StrokeList strokes={[stroke(0), stroke(1)]} playable name="Pad" />);
    expect(count(html, '>WAV<')).toBe(2);
    expect(html).toContain('Export all');
  });

  it('omits "Export all" for a single stroke (but keeps its WAV button)', () => {
    const html = renderToStaticMarkup(<StrokeList strokes={[stroke(0)]} playable name="Pad" />);
    expect(count(html, '>WAV<')).toBe(1);
    expect(html).not.toContain('Export all');
  });

  it('disables export when the file is not decodable (not playable)', () => {
    const html = renderToStaticMarkup(<StrokeList strokes={[stroke(0), stroke(1)]} playable={false} name="Pad" />);
    expect(html).not.toContain('Export all'); // bulk export hidden when nothing can be decoded
    expect(html).toContain('disabled'); // per-stroke WAV buttons disabled
  });
});
