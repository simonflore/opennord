import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from '../../lib/ns4/parse';
import type { NS4Program } from '../../lib/ns4/types';
import { ZoneStrip } from './ZoneStrip';

const fixture = parseNs4Program(new Uint8Array(
  readFileSync(fileURLToPath(new URL('../../lib/ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
));

describe('ZoneStrip', () => {
  it('draws engine rows × four zones for a split program, lit where each engine plays', () => {
    const html = renderToStaticMarkup(<ZoneStrip program={fixture} />);
    // The fixture's organ A plays zones 1–2 only, so the organ row has dark cells.
    expect(html).toContain('role="img"');
    expect(html).toContain('organ: zones 1,2,3,4');
    expect(html).toContain('bg-engine-organ');
    expect(html).toContain('bg-engine-synth');
  });

  it('renders nothing when every layer covers the whole keyboard', () => {
    const unsplit = { ...fixture, layers: [{ id: 'A', kind: 'piano', enabled: true, kbZones: '1111' }] } as unknown as NS4Program;
    expect(renderToStaticMarkup(<ZoneStrip program={unsplit} />)).toBe('');
  });

  it('renders nothing without a parsed program (e.g. a Nord entry not pulled yet)', () => {
    expect(renderToStaticMarkup(<ZoneStrip />)).toBe('');
  });
});
