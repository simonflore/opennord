import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PianoListen, keyboardZones } from './PianoListen';
import { makeNpno, tone } from '@/lib/ns4/nsp-synth.testing';

const s = (velocityFrom: number) => ({ pcm: [tone(3000, 0.02, 3000, 1)], velocityFrom, before: [[0, 0, 0, 0]] });

describe('PianoListen', () => {
  it('offers a keyboard to play, with one band per sampled note', () => {
    const html = renderToStaticMarkup(<PianoListen bytes={makeNpno([s(0), s(64), s(0)], 1, 0x2c)} />);
    expect(html).toContain('Keyboard zone map');
    expect(html.match(/<title>S\d+<\/title>/g)).toHaveLength(2); // synthetic key map: two zones
    expect(html).toContain('Velocity');
    expect(html).not.toContain('Play ');
  });

  it('falls back to one button per recording when the key map does not match them', () => {
    // Three loudest-layer strokes are three zones, but the synthetic key map names two.
    const html = renderToStaticMarkup(<PianoListen bytes={makeNpno([s(0), s(0), s(0)], 1, 0x2c)} />);
    expect(html.match(/Play Note /g)).toHaveLength(3);
    expect(html).not.toContain('Keyboard zone map');
  });

  it('says so when the file has no playable sounds', () => {
    expect(renderToStaticMarkup(<PianoListen bytes={new Uint8Array(64)} />)).toContain('be played here');
  });
});

describe('keyboardZones', () => {
  it('keeps the zones on the 88 keys and trims them to that range', () => {
    const zones = [
      { rootNote: 8, lowNote: 0, highNote: 12 },    // below A0: not on the keyboard
      { rootNote: 48, lowNote: 13, highNote: 59 },
      { rootNote: 72, lowNote: 60, highNote: 127 },
    ];
    expect(keyboardZones(zones).map((z) => [z.keyLow, z.keyHigh])).toEqual([[21, 59], [60, 108]]);
  });
});
