import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GigmeisterLink, GigmeisterSlotNote, GIGMEISTER_URL } from './Gigmeister';
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

describe('AboutView', () => {
  const html = renderToStaticMarkup(<AboutView />);

  it('discloses the shared authorship without gating anything on it', () => {
    expect(html).toContain('Also from the same workbench');
    expect(html).toContain(GIGMEISTER_URL);
    expect(html).toContain('nothing here is gated behind it');
  });
});
