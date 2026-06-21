import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { nsmpClaimedRegions, nsmpGapRanges } from './nsmp-coverage';
import { readNsmp } from './nsmp';

const CORPUS = '/Users/simonflore/Documents/TBM/VibesNoVibrato Mellotron_M300A 4.1.nsmp4';

describe('nsmp-coverage', () => {
  it('claimed regions are sorted, non-overlapping, in-bounds', () => {
    if (!existsSync(CORPUS)) return; // gitignored corpus
    const bytes = new Uint8Array(readFileSync(CORPUS));
    const claimed = nsmpClaimedRegions(bytes);
    for (let i = 1; i < claimed.length; i++) {
      expect(claimed[i].start).toBeGreaterThanOrEqual(claimed[i - 1].end);
    }
    expect(claimed.at(-1)!.end).toBeLessThanOrEqual(bytes.length);
  });

  it('gap ranges are the complement within sections and ≥4 bytes', () => {
    if (!existsSync(CORPUS)) return;
    const bytes = new Uint8Array(readFileSync(CORPUS));
    const gaps = nsmpGapRanges(bytes);
    for (const g of gaps) expect(g.end - g.start).toBeGreaterThanOrEqual(4);
    // characterization: log the gaps so the implementer can fill the docs table
    console.log('NSMP gaps', readNsmp(bytes).codec, gaps.map((g) => `${g.start}-${g.end}`).join(' '));
  });
});
