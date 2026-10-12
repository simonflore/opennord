import { describe, it, expect, vi } from 'vitest';
import { removeUnused, type RemovalSteps } from './remove-unused';
import type { SampleUsage } from '@/lib/device/dependencies';
import type { ExecResult } from '@/lib/device/execute';
import type { ProgramEntry } from '@/lib/device/transfer';

const file = (slot: number, name: string): ProgramEntry =>
  ({ bank: 0, slot, name, categoryId: 0, version: 0, sizeBytes: 8, fourcc: 'nsmp' });
interface Entry { id: string; name: string; device: ProgramEntry }
const entry = (slot: number, name: string): Entry => ({ id: name, name, device: file(slot, name) });

const pad = entry(0, 'Pad');
const bell = entry(1, 'Bell');
const strings = entry(2, 'Strings');
const usage = (unused: Entry[]): SampleUsage => ({ unused: unused.map((e) => e.device), used: [], missing: [] });
const done: ExecResult = { ok: true, completedOps: 0, rolledBack: false, warnings: [] };

/** Steps over a pretend Nord holding `installed`: `remove` deletes from it unless told otherwise. */
function steps(over: Partial<RemovalSteps<Entry>> & { installed?: Entry[] } = {}) {
  const installed = new Set(over.installed ?? [pad, bell, strings]);
  const s: RemovalSteps<Entry> = {
    targets: [pad, bell, strings],
    keepCopyIds: new Set(),
    saveCopy: null,
    rescan: vi.fn(async () => usage([pad, bell, strings])),
    pull: vi.fn(async () => new Uint8Array(8)),
    filenameOf: (e) => `${e.name}.nsmp4`,
    remove: vi.fn(async (entries: Entry[]) => { entries.forEach((e) => installed.delete(e)); return done; }),
    relist: vi.fn(async () => [...installed].map((e) => e.device)),
    keepUnrestored: vi.fn(),
    onUsage: vi.fn(), onListed: vi.fn(), onProgress: vi.fn(), afterRemoval: vi.fn(),
    ...over,
  };
  return s;
}
const removedNames = (s: RemovalSteps<Entry>) => vi.mocked(s.remove).mock.calls.flatMap(([entries]) => entries.map((e) => e.name));

describe('removeUnused', () => {
  it('removes what a fresh scan still calls unused, and reports the new usage', async () => {
    const s = steps();
    expect(await removeUnused(s)).toEqual({ removed: 3, failed: 0 });
    expect(removedNames(s)).toEqual(['Pad', 'Bell', 'Strings']);
    expect(s.onUsage).toHaveBeenCalledTimes(1);
    expect(s.afterRemoval).toHaveBeenCalledTimes(1);
  });

  it('leaves alone a sound a program has started using since the first scan', async () => {
    const s = steps({ rescan: async () => usage([pad, strings]) });
    expect(await removeUnused(s)).toEqual({ removed: 2, failed: 1 });
    expect(removedNames(s)).toEqual(['Pad', 'Strings']);
  });

  it('leaves alone a slot that now holds another sound', async () => {
    const s = steps({ rescan: async () => usage([entry(0, 'Something Else'), bell, strings]) });
    await removeUnused(s);
    expect(removedNames(s)).toEqual(['Bell', 'Strings']);
  });

  it('deletes nothing when the fresh scan cannot read everything', async () => {
    const s = steps({ rescan: async () => { throw new Error('incomplete'); } });
    await expect(removeUnused(s)).rejects.toThrow('incomplete');
    expect(s.remove).not.toHaveBeenCalled();
  });

  it('keeps on the Nord a sound whose copy could not be saved, and copies before it deletes', async () => {
    const order: string[] = [];
    const s = steps({
      keepCopyIds: new Set(['Pad', 'Bell']),
      saveCopy: async (_bytes, filename) => {
        order.push(`save ${filename}`);
        if (filename === 'Bell.nsmp4') throw new Error('disk full');
      },
    });
    const remove = s.remove;
    s.remove = vi.fn(async (entries, onProgress) => { order.push('remove'); return remove(entries, onProgress); });
    expect(await removeUnused(s)).toEqual({ removed: 2, failed: 1 });
    expect(removedNames(s)).toEqual(['Pad', 'Strings']); // Strings wanted no copy
    expect(order).toEqual(['save Pad.nsmp4', 'save Bell.nsmp4', 'remove']);
  });

  it('does not copy a sound it is not going to remove', async () => {
    const s = steps({ keepCopyIds: new Set(['Bell']), saveCopy: vi.fn(async () => {}), rescan: async () => usage([pad]) });
    await removeUnused(s);
    expect(s.pull).not.toHaveBeenCalled();
  });

  it('stops without deleting when nothing is left to remove', async () => {
    const s = steps({ rescan: async () => usage([]) });
    expect(await removeUnused(s)).toEqual({ removed: 0, failed: 3 });
    expect(s.remove).not.toHaveBeenCalled();
    expect(s.afterRemoval).not.toHaveBeenCalled();
  });

  it('counts none as removed when a failed removal was rolled back in full', async () => {
    const s = steps({ remove: async () => ({ ...done, ok: false, rolledBack: true, deviceUnchanged: true, warnings: ['x'] }) });
    expect(await removeUnused(s)).toEqual({ removed: 0, failed: 3, recovered: undefined });
    expect(s.keepUnrestored).not.toHaveBeenCalled();
  });

  it('when the undo fails too: keeps what could not be put back, and counts from what the Nord still lists', async () => {
    const lost = [{ addr: { bank: 0, slot: 0 }, name: 'Pad', ext: 'nsmp', file: new Uint8Array(8) }];
    const s = steps({
      installed: [bell, strings], // Pad was deleted before the failure and could not be restored
      remove: async () => ({ ...done, ok: false, warnings: ['x', 'y'], unrestored: lost }),
    });
    expect(await removeUnused(s)).toEqual({ removed: 1, failed: 2, recovered: 1 });
    expect(s.keepUnrestored).toHaveBeenCalledWith(lost);
  });

  it('reports the scan as the first half of the progress and the deletes as the second', async () => {
    const s = steps({
      rescan: async (onProgress) => { onProgress(1, 2); onProgress(2, 2); return usage([pad]); },
      remove: async (_e, onProgress) => { onProgress(1, 2); return done; },
    });
    await removeUnused(s);
    expect(vi.mocked(s.onProgress).mock.calls.map(([pct]) => pct)).toEqual([25, 50, 75]);
  });
});
