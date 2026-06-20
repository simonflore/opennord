import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Ns2View } from './Ns2View';

/** Minimal CBIN `ns2p` (legacy header) with a slot-A piano-on/Clavinet body. */
function ns2p(): Uint8Array {
  const b = new Uint8Array(547);
  b.set([0x43, 0x42, 0x49, 0x4e]);                 // CBIN
  b[0x04] = 0;                                      // legacy header → versionOffset -20
  for (let i = 0; i < 4; i++) b[0x08 + i] = 'ns2p'.charCodeAt(i);
  b[0x0c] = 0x00; b[0x0e] = 0x03; b[0x10] = 0x1b;   // bank/loc/category (Clavinet)
  b[0x2e - 20] = 0;                                 // slot flag → A only
  b[0x48 - 20] = 0x80;                              // piano on
  b[0xcd - 20] = 0x80;                              // type → Clavinet
  return b;
}

describe('Ns2View', () => {
  it('renders the Stage 2 header + decoded slot engines', () => {
    const html = renderToStaticMarkup(<Ns2View bytes={ns2p()} />);
    expect(html).toContain('Stage 2');
    expect(html).toContain('SLOT A');
    expect(html).toContain('Piano');
    expect(html).toContain('Clavinet');
    expect(html).not.toContain('SLOT B'); // flag selects A only
  });
});
