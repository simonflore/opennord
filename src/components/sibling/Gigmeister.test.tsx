import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  GigmeisterLink,
  GigmeisterSlotNote,
  GigmeisterFooterNote,
  GIGMEISTER_URL,
} from './Gigmeister';
import { AboutView } from '../about/AboutView';

/** Classes that would give the link OpenNord's own CTA weight. */
const CTA_MARKERS = ['fill-primary', 'glow', 'text-red', 'bg-red', 'border-red'];

describe('GigmeisterLink', () => {
  const html = renderToStaticMarkup(<GigmeisterLink />);

  it('points at Gigmeister and opens safely off-site', () => {
    expect(html).toContain(`href="${GIGMEISTER_URL}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('never carries OpenNord’s primary-CTA or red-accent styling', () => {
    for (const marker of CTA_MARKERS) expect(html).not.toContain(marker);
  });
});

describe('every mention', () => {
  const placements: [string, string][] = [
    ['footer', renderToStaticMarkup(<GigmeisterFooterNote />)],
    ['organize footnote', renderToStaticMarkup(<GigmeisterSlotNote />)],
    ['about card', renderToStaticMarkup(<AboutView />)],
  ];

  // First person, like the coffee button and the rest of the About copy — the
  // third person ("OpenNord's author also built…") reads as a press release,
  // which is most of the way to an ad on its own.
  it.each(placements)('claims the project in the first person (%s)', (_name, html) => {
    expect(html).toMatch(/I also make|My other app/);
  });

  it.each(placements)('never takes CTA weight (%s)', (_name, html) => {
    // AboutView legitimately carries other red/CTA chrome (the Nord disclaimer
    // rail, the coffee button), so scope the check to the sibling link itself.
    const start = html.indexOf('<a class="inline-flex items-baseline');
    expect(start, 'sibling link not found — assertion would be vacuous').toBeGreaterThan(-1);
    const link = html.slice(start, html.indexOf('</a>', start));
    expect(link).toContain(GIGMEISTER_URL);
    for (const marker of CTA_MARKERS) expect(link).not.toContain(marker);
  });
});

describe('GigmeisterSlotNote', () => {
  const html = renderToStaticMarkup(<GigmeisterSlotNote />);

  it('leads with OpenNord’s own advice, not the product', () => {
    // Guard both indices: a missing marker is -1, which would satisfy the
    // ordering check vacuously.
    const advice = html.indexOf('MIDI Program Change');
    const mention = html.indexOf('Gigmeister');
    expect(advice).toBeGreaterThan(-1);
    expect(mention).toBeGreaterThan(-1);
    expect(advice).toBeLessThan(mention);
  });

  it('describes the slot consequence the way it actually behaves', () => {
    // A set points at a *slot*, not at a program, so rearranging a bank leaves
    // it recalling whatever now sits there — it does not follow the program.
    expect(html).toContain('at a slot, not at a program');
    expect(html).not.toMatch(/moves? with (it|the program)/i);
  });
});
