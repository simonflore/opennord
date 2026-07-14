import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ContributionSession } from './session';
import { stripCbinHeader } from './body';
import { identifyNordFile } from '../clavia/nord-file';
import type { Capture } from './types';

// Use the real fixture regressionTest.ns4p
const fixturePath = fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url));

function capFromFile(file: Uint8Array): Capture {
  return { model: identifyNordFile(file), body: stripCbinHeader(file) };
}

describe('differential capture self-test (Stage 4)', () => {
  it('a single body-byte change surfaces as exactly one range at that byte', () => {
    const file = new Uint8Array(readFileSync(fixturePath));
    const baseline = capFromFile(file);

    // synthesize a one-control change: flip one body byte
    const changed = new Uint8Array(file);
    const bodyByteIndex = 100; // within the body, after the 44-byte header
    changed[44 + bodyByteIndex] ^= 0xff;
    const after = capFromFile(changed);

    const s = new ContributionSession();
    s.setBaseline(baseline);
    const entry = s.addEntry(after, 'synthetic', 'flip');

    expect(entry.ranges).toEqual([{ start: bodyByteIndex, end: bodyByteIndex }]);
    expect(entry.multiRegion).toBe(false);
  });
});
