import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  GigmeisterLink,
  GigmeisterSlotNote,
  GigmeisterFooterNote,
  GIGMEISTER_URL,
} from './Gigmeister';
import { Sibling } from '../home/Sibling';
import { AboutView } from '../about/AboutView';

/**
 * These pin the constraints that keep the Gigmeister mentions from reading as
 * ads. They are not cosmetic: each assertion below corresponds to one of the
 * rules documented in `Gigmeister.tsx`, and every one of them is the kind of
 * thing a well-meaning later edit ("make the link stand out more") would undo
 * silently.
 */

/** Classes that would give a sibling-product link OpenNord's own CTA weight. */
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

describe('Sibling (landing-page section)', () => {
  const html = renderToStaticMarkup(<Sibling />);

  it('leads with OpenNord’s boundary rather than a pitch', () => {
    expect(html).toContain('The instrument is one job. The gig is another.');
    expect(html).toContain('Where OpenNord stops');
  });

  it('discloses the relationship: same author, separate, paid, optional', () => {
    expect(html).toMatch(/built by the same person as OpenNord/i);
    expect(html).toContain('separate paid product');
    expect(html).toContain('free, open and complete without it');
  });

  it('states the concrete overlap instead of asserting relevance', () => {
    expect(html).toContain('MIDI Program Change');
  });

  it('describes the slot consequence the way it actually behaves', () => {
    // A set points at a *slot*, not at a program, so rearranging a bank leaves
    // it recalling whatever now sits there — it does not follow the program.
    // Getting this backwards would invert the very point the section makes.
    expect(html).toContain('points at the slot, not at the program');
    expect(html).not.toMatch(/moves? with (it|the program)/i);
  });

  it('stays quieter than the page’s own CTAs', () => {
    for (const marker of CTA_MARKERS) expect(html).not.toContain(marker);
    // text-display-* is reserved for sections making a claim about OpenNord.
    expect(html).not.toContain('text-display');
  });
});

describe('GigmeisterSlotNote (in-tool)', () => {
  const html = renderToStaticMarkup(<GigmeisterSlotNote />);

  it('leads with the useful fact, not the product', () => {
    expect(html.indexOf('Program Change')).toBeLessThan(html.indexOf('Gigmeister'));
  });

  it('says out loud that it is separate, paid and optional', () => {
    expect(html).toContain('separate paid app');
    expect(html).toContain('optional');
  });
});

describe('GigmeisterFooterNote', () => {
  const html = renderToStaticMarkup(<GigmeisterFooterNote />);

  it('carries the full disclosure on its own', () => {
    // The footer is reachable without seeing any other placement, so rule 3
    // has to hold here in isolation: same author, separate, paid.
    expect(html).toMatch(/OpenNord’s author/);
    expect(html).toContain('separate paid app');
  });
});

describe('every placement', () => {
  // Rule 3 binds per placement, not per site — each surface is reachable
  // without the others, so none may rely on a sibling for its disclosure.
  const placements: [string, string][] = [
    ['footer', renderToStaticMarkup(<GigmeisterFooterNote />)],
    ['landing section', renderToStaticMarkup(<Sibling />)],
    ['organize footnote', renderToStaticMarkup(<GigmeisterSlotNote />)],
    ['about card', renderToStaticMarkup(<AboutView />)],
  ];

  it.each(placements)('discloses "separate" and "paid" on its own (%s)', (_name, html) => {
    expect(html).toMatch(/separate/i);
    expect(html).toMatch(/paid/i);
  });

  it.each(placements)('never takes CTA weight (%s)', (_name, html) => {
    // AboutView legitimately carries other red/CTA chrome (the Nord disclaimer
    // rail, the coffee button), so scope the check to the sibling link itself.
    const start = html.indexOf(`<a class="inline-flex items-baseline`);
    expect(start, 'sibling link not found — assertion would be vacuous').toBeGreaterThan(-1);
    const link = html.slice(start, html.indexOf('</a>', start));
    expect(link).toContain(GIGMEISTER_URL);
    for (const marker of CTA_MARKERS) expect(link).not.toContain(marker);
  });
});

describe('AboutView', () => {
  const html = renderToStaticMarkup(<AboutView />);

  it('discloses the shared authorship without gating anything on it', () => {
    expect(html).toContain('Also from the same workbench');
    expect(html).toContain(GIGMEISTER_URL);
    expect(html).toContain('nothing here is gated behind it');
  });
});
