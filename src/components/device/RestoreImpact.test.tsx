import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RestoreImpact } from './RestoreImpact';
import type { RestoreImpact as Impact } from '../../lib/device/restore-diff';

const base: Impact = { changed: 0, added: 0, unchanged: 0, untouched: 0, pianos: 0, samples: 0, presets: 0, estimated: true };

describe('RestoreImpact', () => {
  it('leads with the slot-change headline + MIDI line when programs change', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, changed: 23, added: 9, unchanged: 312, untouched: 18 }} />);
    expect(html).toMatch(/23 of your program slots will change/i);
    expect(html).toMatch(/MIDI Program Change/);
    expect(html).toMatch(/23 replaced/);
  });

  it('shows the calm variant when no existing slots change', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, added: 5 }} />);
    expect(html).toMatch(/No existing program slots change/i);
    expect(html).not.toMatch(/will change —/);
  });

  it('lists piano/sample/preset counts', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, changed: 1, pianos: 4, samples: 120, presets: 8 }} />);
    expect(html).toMatch(/4 pianos/);
    expect(html).toMatch(/120 samples/);
    expect(html).toMatch(/8 presets/);
  });
});
