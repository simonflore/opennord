import { describe, it, expect } from 'vitest';
import { fileBlocks, planFit } from './fit';

const geometry = { blockBytes: 65536, blockRounding: 65535, eraseSupported: true };
const cap = (o: Partial<{ freeBlocks: number; usedBlocks: number; reservedBlocks: number; freeSlots: number }> = {}) =>
  ({ freeBlocks: 7, usedBlocks: 15711, reservedBlocks: 658, freeSlots: 100, ...o });

describe('fileBlocks', () => {
  it('is ⌊(size + w1) / w0⌋, a ceiling when w1 = w0 − 1', () => {
    expect(fileBlocks(1, geometry)).toBe(1);
    expect(fileBlocks(65536, geometry)).toBe(1);
    expect(fileBlocks(65537, geometry)).toBe(2);
    expect(fileBlocks(0, geometry)).toBe(0);
  });
});

describe('planFit', () => {
  it('fits in free blocks without an erase', () => {
    expect(planFit(cap(), geometry, [100_000], { label: 'sample' })).toEqual({ fits: true, blocks: 2, eraseBlocks: 0 });
  });

  it('erases exactly the shortfall when dirty blocks make up the difference', () => {
    expect(planFit(cap({ freeBlocks: 1, reservedBlocks: 10 }), geometry, [300_000], { label: 'sample' }))
      .toEqual({ fits: true, blocks: 5, eraseBlocks: 4 });
  });

  it('refuses before any erase when the partition cannot erase its dirty blocks', () => {
    const plan = planFit(cap({ freeBlocks: 0, reservedBlocks: 658 }), { ...geometry, eraseSupported: false }, [100_000], { label: 'sample' });
    expect(plan.fits).toBe(false);
    if (!plan.fits) expect(plan.reason).toBe('Your Nord’s sample memory has 0 B free, and this needs 128.0 KB. Remove some samples to make room, then try again.');
  });

  it('says when a file is larger than the whole memory', () => {
    const plan = planFit(cap({ freeBlocks: 0, usedBlocks: 3, reservedBlocks: 0 }), geometry, [1_000_000], { label: 'piano' });
    expect(plan.fits).toBe(false);
    if (!plan.fits) expect(plan.reason).toMatch(/^This is too big for your Nord’s piano memory: it needs 1\.0 MB, and the whole memory holds 192\.0 KB\.$/);
  });

  it('says when there is no free place', () => {
    const plan = planFit(cap({ freeSlots: 0 }), geometry, [10], { label: 'sample' });
    expect(plan.fits).toBe(false);
    if (!plan.fits) expect(plan.reason).toBe('Your Nord’s sample memory has no free place left. Remove a sample to make room, then try again.');
  });

  it('counts the blocks and places of files a restore removes first', () => {
    const plan = planFit(cap({ freeBlocks: 0, reservedBlocks: 0, freeSlots: 0 }), geometry, [100_000], { label: 'sample', releasedBlocks: 2, releasedSlots: 1 });
    expect(plan).toEqual({ fits: true, blocks: 2, eraseBlocks: 2 });
  });

  it('refuses when the partition list gave no block size', () => {
    const plan = planFit(cap(), { ...geometry, blockBytes: 0 }, [10], { label: 'sample' });
    expect(plan.fits).toBe(false);
    if (!plan.fits) expect(plan.reason).toMatch(/couldn’t read how your Nord’s sample memory is laid out/);
  });
});
