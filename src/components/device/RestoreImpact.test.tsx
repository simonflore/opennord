import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RestoreImpact } from './RestoreImpact';
import type { RestoreImpact as Impact } from '../../lib/device/restore-diff';

const base: Impact = {
  changed: 0, added: 0, unchanged: 0, untouched: 0, pianos: 0, samples: 0, presets: 0,
  writesSamples: true, writesPianos: true, removesSamples: 0, removesPianos: 0,
  leftOutWhy: { sample: null, piano: null }, estimated: true,
};
const gatedOff = { writesSamples: false, writesPianos: false, leftOutWhy: { sample: 'not-yet-tried', piano: 'not-yet-tried' } } as const;

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

  it('warns before samples and pianos are removed, asking for a fresh backup first', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, samples: 3, removesSamples: 2, removesPianos: 1 }} />);
    expect(html).toMatch(/Removes or replaces 2 samples and 1 piano on your Nord/);
    expect(html).toMatch(/Make a fresh backup first/);
  });

  it('says which samples and pianos stay out while their writes are off, and doesn’t count them as written', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, samples: 120, pianos: 4, presets: 8, ...gatedOff }} />);
    expect(html).toMatch(/120 samples and 4 pianos in this backup won’t be restored: not yet tried on a Nord/);
    expect(html).toMatch(/Also writes 8 presets\./);
    expect(html).not.toMatch(/Also writes[^<]*sample/);
    expect(html).not.toMatch(/factory/i);
  });

  it('says when samples stay out because OpenNord couldn’t confirm where this keyboard keeps them', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, samples: 2, writesSamples: false, leftOutWhy: { sample: 'read-only', piano: null } }} />);
    expect(html).toMatch(/2 samples in this backup won’t be restored: OpenNord couldn’t confirm where this keyboard keeps them/);
    expect(html).not.toMatch(/not yet tried/);
  });

  it('uses no inline styles for the sample and piano lines', () => {
    const html = renderToStaticMarkup(<RestoreImpact impact={{ ...base, samples: 3, removesSamples: 2, pianos: 1, ...gatedOff, writesSamples: true, leftOutWhy: { sample: null, piano: 'not-yet-tried' } }} />);
    const lines = html.split('<p').filter((p) => /Removes or replaces|won’t be restored/.test(p));
    expect(lines).toHaveLength(2);
    for (const line of lines) expect(line).not.toMatch(/style=/);
  });
});
