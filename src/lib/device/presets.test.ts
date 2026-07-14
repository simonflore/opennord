import { describe, it, expect, vi } from 'vitest';
import { enumeratePresets, pullPreset } from './presets';
import type { ProgramEntry } from './transfer';

vi.mock('./transfer', async (orig) => ({
  ...(await orig<typeof import('./transfer')>()),
  enumerateFiles: vi.fn(),
  pullFile: vi.fn(),
}));
import { enumerateFiles, pullFile } from './transfer';

const entry = (n: string): ProgramEntry => ({ bank: 0, slot: 0, name: n, categoryId: 0, version: 100, sizeBytes: 10, fourcc: 'ns4y' });
// withSession(partition, fn) → just runs fn (records the partition it was opened on)
const opened: number[] = [];
const session = { withSession: (p: number, fn: () => unknown) => { opened.push(p); return Promise.resolve(fn()); } } as never;

const model = { id: 'stage-4', partitions: [
  { kind: 'program', label: 'Programs', index: 6 },
  { kind: 'organ-preset', label: 'Organ Presets', ext: 'ns4o', index: 7 },
  { kind: 'piano-preset', label: 'Piano Presets', ext: 'ns4n', index: 8 },
  { kind: 'synth-preset', label: 'Synth Presets', ext: 'ns4y', index: 9 },
] } as never;

describe('device/presets', () => {
  it('enumerates each preset partition the model has, tagging kind+partition', async () => {
    opened.length = 0;
    vi.mocked(enumerateFiles).mockResolvedValueOnce([entry('Organ1')])
      .mockResolvedValueOnce([entry('Piano1')]).mockResolvedValueOnce([entry('Synth1')]);
    const groups = await enumeratePresets(session, model);
    expect(opened).toEqual([7, 8, 9]);                       // program partition (6) skipped
    expect(groups.map((g) => [g.kind, g.partition, g.entries[0].name]))
      .toEqual([['organ-preset', 7, 'Organ1'], ['piano-preset', 8, 'Piano1'], ['synth-preset', 9, 'Synth1']]);
  });

  it('skips a partition that fails to enumerate (best-effort)', async () => {
    opened.length = 0;
    vi.mocked(enumerateFiles).mockRejectedValueOnce(new Error('no organ'))
      .mockResolvedValueOnce([entry('Piano1')]).mockResolvedValueOnce([entry('Synth1')]);
    const groups = await enumeratePresets(session, model);
    expect(groups.map((g) => g.kind)).toEqual(['piano-preset', 'synth-preset']); // organ dropped, not thrown
  });

  it('pullPreset opens the given partition and returns bytes', async () => {
    opened.length = 0;
    vi.mocked(pullFile).mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    const bytes = await pullPreset(session, entry('Pad'), 9);
    expect(opened).toEqual([9]);
    expect([...bytes]).toEqual([1, 2, 3]);
  });
});
