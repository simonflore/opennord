import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NordFileCard } from './NordFileCard';

function cbin(tag: string, formatType: number, f: { bank?: number; loc?: number; cat?: number; ver?: number } = {}): Uint8Array {
  const b = new Uint8Array(64);
  b.set([0x43, 0x42, 0x49, 0x4e]);
  b[0x04] = formatType;
  for (let i = 0; i < tag.length; i++) b[0x08 + i] = tag.charCodeAt(i);
  b[0x0c] = f.bank ?? 0; b[0x0e] = f.loc ?? 0; b[0x10] = f.cat ?? 0;
  b[0x14] = (f.ver ?? 0) & 0xff; b[0x15] = ((f.ver ?? 0) >> 8) & 0xff;
  return b;
}

describe('NordFileCard', () => {
  it('shows a Stage 3 file with its decoded slot / version', () => {
    const html = renderToStaticMarkup(<NordFileCard bytes={cbin('ns3f', 1, { bank: 5, loc: 19, cat: 21, ver: 304 })} />);
    expect(html).toContain('Stage 3');
    expect(html).toContain('Performance');
    expect(html).toContain('F:34');
    expect(html).toContain('v3.04');
  });

  it('shows a Stage 2 file with its decoded slot + category, but no version', () => {
    const html = renderToStaticMarkup(<NordFileCard bytes={cbin('ns2p', 0, { bank: 3, loc: 69, cat: 12, ver: 6 })} />);
    expect(html).toContain('Stage 2');
    expect(html).toContain('D:69');   // raw program slot
    expect(html).toContain('Synth');  // shared category enum
    expect(html).not.toContain('v0.06'); // never show the bogus legacy version
    expect(html).not.toContain('VERSION'); // no version row for Stage 2
  });
});
