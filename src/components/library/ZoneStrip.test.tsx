import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { zonedProgram as program } from '../../test-utils/ns4';
import { ZoneStrip } from './ZoneStrip';

describe('ZoneStrip', () => {
  it('names which zones each engine plays (organ low, piano high)', () => {
    const html = renderToStaticMarkup(<ZoneStrip program={program([
      { kind: 'organ', kbZones: '11oo' },
      { kind: 'piano', kbZones: 'oo11' },
    ])} />);
    expect(html).toContain('Keyboard split — piano: zones 3,4; organ: zones 1,2');
  });

  it('renders nothing when every engine covers the whole keyboard', () => {
    // Organ A alone is split, but organ B covers the rest: per engine, nothing to show.
    expect(renderToStaticMarkup(<ZoneStrip program={program([
      { kind: 'organ', kbZones: '11oo' },
      { kind: 'organ', kbZones: '1111' },
      { kind: 'piano', kbZones: '1111' },
    ])} />)).toBe('');
  });

  it('renders nothing with the Split switch off (the layers then play the whole keyboard)', () => {
    expect(renderToStaticMarkup(<ZoneStrip program={program([
      { kind: 'organ', kbZones: '11oo' },
      { kind: 'piano', kbZones: 'oo11' },
    ], false)} />)).toBe('');
  });

  it('renders nothing without a parsed program (e.g. a Nord entry not pulled yet)', () => {
    expect(renderToStaticMarkup(<ZoneStrip />)).toBe('');
  });
});
