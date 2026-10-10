import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PianoListen } from './PianoListen';
import { makeNpno, tone } from '@/lib/ns4/nsp-synth.testing';

describe('PianoListen', () => {
  it('offers one play button per sampled note, named by its key range', () => {
    const s = (velocityFrom: number) => ({ pcm: [tone(3000, 0.02, 3000, 1)], velocityFrom, before: [[0, 0, 0, 0]] });
    const html = renderToStaticMarkup(<PianoListen bytes={makeNpno([s(0), s(64), s(0)], 1, 0x2c)} />);
    expect(html).toContain('C-1–B3'); // synthetic key map: root 48 over notes 0–59
    expect(html).toContain('C4–G9');
    expect(html.match(/Play /g)).toHaveLength(2);
    expect(html).toContain('Velocity');
  });

  it('says so when the file has no playable sounds', () => {
    expect(renderToStaticMarkup(<PianoListen bytes={new Uint8Array(64)} />)).toContain('be played here');
  });
});
