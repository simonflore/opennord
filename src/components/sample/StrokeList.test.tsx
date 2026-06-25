import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StrokeList, type InspectorStroke } from './StrokeList';

function stroke(index: number, ok = true, loops?: boolean): InspectorStroke {
  return {
    summary: { index, sampleCount: ok ? 4 : 0, channels: 1, peak: 1, ok, loops },
    channels: [new Int32Array([0, 1, -1, 0])],
  };
}

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe('StrokeList loop indicator', () => {
  it('shows ↻ loops / one-shot when known, nothing when undecodable', () => {
    const looped = renderToStaticMarkup(<StrokeList strokes={[stroke(0, true, true)]} playable name="P" />);
    expect(looped).toContain('loops');
    const oneShot = renderToStaticMarkup(<StrokeList strokes={[stroke(0, true, false)]} playable name="P" />);
    expect(oneShot).toContain('one-shot');
    const unknown = renderToStaticMarkup(<StrokeList strokes={[stroke(0, true, undefined)]} playable name="P" />);
    expect(unknown).not.toContain('one-shot');
    expect(unknown).not.toContain('↻');
  });
});

describe('StrokeList root note', () => {
  it('shows the root note in the description line when known, omits it otherwise', () => {
    const withRoot: InspectorStroke = {
      summary: { index: 0, sampleCount: 4, channels: 2, peak: 1, ok: true, rootNote: 'E3' },
      channels: [new Int32Array([0, 1, -1, 0])],
    };
    const html = renderToStaticMarkup(<StrokeList strokes={[withRoot]} playable name="P" />);
    expect(html).toContain('E3');
    // No root → the line still renders, just without a note token.
    const noRoot = renderToStaticMarkup(<StrokeList strokes={[stroke(0)]} playable name="P" />);
    expect(noRoot).toContain('Sample 1');
  });
});

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
