// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { listCorpus, getCorpusFile } from './fixtures-client';

afterEach(() => vi.restoreAllMocks());

describe('fixtures-client', () => {
  it('listCorpus parses the manifest', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      { ok: true, json: async () => ({ models: [{ id: 'stage-3', files: ['a.ns3f'] }] }) }));
    expect(await listCorpus()).toEqual([{ id: 'stage-3', files: ['a.ns3f'] }]);
  });
  it('listCorpus returns [] on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await listCorpus()).toEqual([]);
  });
  it('getCorpusFile returns bytes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }));
    expect(await getCorpusFile('stage-3', 'a.ns3f')).toEqual(new Uint8Array([1, 2, 3]));
  });
  it('getCorpusFile throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getCorpusFile('stage-3', 'a.ns3f')).rejects.toThrow();
  });
});
