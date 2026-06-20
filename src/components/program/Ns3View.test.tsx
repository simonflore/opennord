import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Ns3View } from './Ns3View';

/** Minimal CBIN `ns3f` (NSM-era) with a panel-A piano-on/Grand body. */
function ns3f(): Uint8Array {
  const b = new Uint8Array(600);
  b.set([0x43, 0x42, 0x49, 0x4e]);                 // CBIN
  b[0x04] = 1;                                      // format-type 1 (NSM-era)
  for (let i = 0; i < 4; i++) b[0x08 + i] = 'ns3f'.charCodeAt(i);
  b[0x0c] = 5; b[0x0e] = 19; b[0x10] = 21;          // bank/loc/category
  b[0x14] = 0x30; b[0x15] = 0x01;                   // version v3.04
  b[0x31] = 0;                                      // panel A only
  b[0x43] = 0x80;                                   // piano on
  b[0x48] = 0x00;                                   // Grand
  return b;
}

describe('Ns3View', () => {
  it('renders the Stage 3 header + decoded panel engines', () => {
    const html = renderToStaticMarkup(<Ns3View bytes={ns3f()} />);
    expect(html).toContain('Stage 3');
    expect(html).toContain('v3.04');
    expect(html).toContain('PANEL A');
    expect(html).toContain('Piano');
    expect(html).toContain('Grand');
    expect(html).not.toContain('PANEL B'); // flag selects A only
  });
});
