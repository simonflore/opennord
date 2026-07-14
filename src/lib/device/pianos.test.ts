import { describe, it, expect, vi } from 'vitest';
import { enumeratePianoLibrary, pullPiano } from './pianos';
import type { ProgramEntry } from './transfer';

vi.mock('./transfer', async (orig) => ({ ...(await orig<typeof import('./transfer')>()), enumerateFiles: vi.fn(), pullFile: vi.fn() }));
import { enumerateFiles, pullFile } from './transfer';

const entry = (n: string): ProgramEntry => ({ bank: 0, slot: 0, name: n, categoryId: 0, version: 100, sizeBytes: 10, fourcc: 'npno' });
const opened: number[] = [];
const session = { withSession: (p: number, fn: () => unknown) => { opened.push(p); return Promise.resolve(fn()); } } as never;

describe('device/pianos', () => {
  it('enumerates the Piano Library partition (1)', async () => {
    opened.length = 0;
    vi.mocked(enumerateFiles).mockResolvedValueOnce([entry('Grand Lady D')]);
    const es = await enumeratePianoLibrary(session);
    expect(opened).toEqual([1]);
    expect(es[0].name).toBe('Grand Lady D');
  });

  it('pullPiano opens partition 1, forwards progress, returns bytes', async () => {
    opened.length = 0;
    vi.mocked(pullFile).mockImplementationOnce((_s, _e, onP) => { onP?.(5, 10); onP?.(10, 10); return Promise.resolve(new Uint8Array([9])); });
    const seen: Array<[number, number]> = [];
    const bytes = await pullPiano(session, entry('Grand Lady D'), (d, t) => seen.push([d, t]));
    expect(opened).toEqual([1]);
    expect(seen).toEqual([[5, 10], [10, 10]]);
    expect([...bytes]).toEqual([9]);
  });
});
