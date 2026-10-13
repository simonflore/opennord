import { describe, it, expect, vi } from 'vitest';
import { tone } from './nsp-synth.testing';
import { buildNpno } from './nsp-write';

// buildNpno runs the acceptance checks on every file it writes. Its input validation should
// make a failure there unreachable, so force one to see what the caller would be told.
vi.mock('./nsp-check', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./nsp-check')>()),
  checkNpnoAcceptance: () => ({ ok: false, checks: [{ id: 'cnsp-checksum', ok: false, detail: '' }] }),
}));

describe('buildNpno — acceptance checks', () => {
  it("refuses to hand over a file that fails them, and says it's OpenNord's bug", () => {
    expect(() => buildNpno({
      name: 'Checked', channels: 1,
      zones: [{ rootNote: 130, lowNote: 0, highNote: 127, layers: [{ pcm: [Int32Array.from(tone(3000, 0.02, 3000, 1))], floorDb: 0 }] }],
    })).toThrow(/wouldn't load on a Nord \(failed check: cnsp-checksum\)\. This is a bug in OpenNord, not in your recordings/);
  });
});
