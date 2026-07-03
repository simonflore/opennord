import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DecodedProgramView } from './DecodedProgramView';
import { ns3Decoded } from '../../lib/ns3/present';
import { ns2Decoded } from '../../lib/ns2/present';
import { ng2Decoded } from '../../lib/ng2/present';
import { np5Decoded } from '../../lib/np5/present';
import { np4Decoded } from '../../lib/np4/present';
import { ne5Decoded } from '../../lib/ne5/present';
import { ne6Decoded } from '../../lib/ne6/present';
import { nw2Decoded } from '../../lib/nw2/present';
import { nlaDecoded } from '../../lib/nla/present';

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

describe('DecodedProgramView', () => {
  it('renders a Stage 3 program (header + panel engines)', () => {
    const html = renderToStaticMarkup(<DecodedProgramView program={ns3Decoded(ns3f())} />);
    expect(html).toContain('Stage 3');
    expect(html).toContain('v3.04');
    expect(html).toContain('PANEL A');
    expect(html).toContain('Piano');
    expect(html).toContain('Grand');
    expect(html).not.toContain('PANEL B'); // flag selects A only
  });

  it('renders a Stage 2 program (header + slot engines)', () => {
    const html = renderToStaticMarkup(<DecodedProgramView program={ns2Decoded(ns2p())} />);
    expect(html).toContain('Stage 2');
    expect(html).toContain('SLOT A');
    expect(html).toContain('Piano');
    expect(html).toContain('Clavinet');
    expect(html).not.toContain('SLOT B'); // flag selects A only
  });

  it('renders decoder warnings so a corrupt file cannot pass as clean', () => {
    const html = renderToStaticMarkup(
      <DecodedProgramView program={{
        title: 'X', header: [], sections: [], note: '',
        warnings: ['File too short: 5 bytes'],
      }} />,
    );
    expect(html).toContain('File too short: 5 bytes');
  });

  it('every registered skeleton presenter carries its decode warnings to the view model', () => {
    // A truncated file makes each decoder record a warning — the presenter must
    // not drop it, or the UI renders a normal-looking card of zeroed fields.
    const truncated = new Uint8Array(5);
    for (const decoded of [np4Decoded, np5Decoded, ne5Decoded, ne6Decoded, ng2Decoded, nw2Decoded, nlaDecoded]) {
      expect(decoded(truncated).warnings?.length, decoded.name).toBeGreaterThan(0);
    }
  });
});
