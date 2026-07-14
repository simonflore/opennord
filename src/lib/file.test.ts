import { describe, it, expect } from 'vitest';
import { readFileBytes } from './file';

describe('readFileBytes', () => {
  it('reads a Blob/File fully into a Uint8Array', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])]);
    expect([...await readFileBytes(blob)]).toEqual([1, 2, 3, 4]);
  });

  it('returns an empty array for an empty file', async () => {
    expect((await readFileBytes(new Blob([]))).length).toBe(0);
  });
});
