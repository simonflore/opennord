import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { streamUnzip, type UnzippedEntry } from './unzip-stream';

/** A ReadableStream that emits `bytes` in small chunks, exercising the streaming path. */
function streamOf(bytes: Uint8Array, chunkSize = 8): ReadableStream<Uint8Array> {
  let pos = 0;
  return new ReadableStream({
    pull(controller) {
      if (pos >= bytes.length) return controller.close();
      controller.enqueue(bytes.slice(pos, pos + chunkSize));
      pos += chunkSize;
    },
  });
}

async function collect(zip: Uint8Array, accept?: (p: string) => boolean): Promise<UnzippedEntry[]> {
  const out: UnzippedEntry[] = [];
  await streamUnzip(streamOf(zip), (e) => { out.push(e); }, accept);
  return out;
}

describe('streamUnzip', () => {
  it('yields every entry of a stored (uncompressed) zip with exact bytes', async () => {
    // Our real case: .ns4b is ZIP-store (level 0).
    const zip = zipSync(
      { 'Bank 1/Lead.ns4p': new Uint8Array([1, 2, 3]), 'meta.xml': new Uint8Array([9]) },
      { level: 0 },
    );
    const entries = await collect(zip);
    const byPath = Object.fromEntries(entries.map((e) => [e.path, Array.from(e.bytes)]));
    expect(Object.keys(byPath).sort()).toEqual(['Bank 1/Lead.ns4p', 'meta.xml']);
    expect(byPath['Bank 1/Lead.ns4p']).toEqual([1, 2, 3]);
    expect(byPath['meta.xml']).toEqual([9]);
  });

  it('reassembles an entry whose bytes span many stream chunks', async () => {
    const big = new Uint8Array(5000).map((_, i) => i % 251);
    const zip = zipSync({ 'big.bin': big }, { level: 0 });
    const [entry] = await collect(zip); // 8-byte chunks → entry split across hundreds of pushes
    expect(entry.path).toBe('big.bin');
    expect(entry.bytes).toEqual(big);
  });

  it('decompresses DEFLATE entries too', async () => {
    const payload = new Uint8Array(2000).fill(7); // compresses well
    const zip = zipSync({ 'z.bin': payload }, { level: 6 });
    const [entry] = await collect(zip);
    expect(entry.bytes).toEqual(payload);
  });

  it('skips entries the accept predicate rejects', async () => {
    const zip = zipSync({ 'keep.ns4p': new Uint8Array([1]), 'drop.txt': new Uint8Array([2]) });
    const entries = await collect(zip, (p) => p.endsWith('.ns4p'));
    expect(entries.map((e) => e.path)).toEqual(['keep.ns4p']);
  });
});
