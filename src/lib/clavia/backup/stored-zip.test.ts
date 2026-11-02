import { describe, it, expect } from 'vitest';
import { unzipSync } from 'fflate';
import { StoredZipWriter, storedZipEntryOverhead, STORED_ZIP_END_BYTES } from './stored-zip';
import { streamUnzip } from '../../folder/unzip-stream';
import { crc32 } from '../checksum';

function build(files: Record<string, Uint8Array>): Uint8Array {
  const w = new StoredZipWriter();
  const chunks = [...Object.entries(files).flatMap(([p, b]) => w.add(p, b)), ...w.end()];
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

describe('StoredZipWriter', () => {
  const files = {
    'meta.xml': new TextEncoder().encode('<backup/>'),
    'Samp Lib/Bänk 1/Pad.nsmp4': new Uint8Array([0x50, 0x4b, 0x07, 0x08, 9, 0x50, 0x4b, 0x03, 0x04, 8, 0x50, 0x4b, 0x01, 0x02, 7]),
    'empty.bin': new Uint8Array(0),
  };

  it('reads back the same through the central directory and a forward stream', async () => {
    const zip = build(files);
    expect(unzipSync(zip)).toEqual(files);
    const streamed: Record<string, Uint8Array> = {};
    await streamUnzip(new Blob([zip as unknown as BlobPart]).stream(), (e) => { streamed[e.path] = e.bytes; });
    expect(streamed).toEqual(files);
  });

  it('takes an entry whose CRC and size are already known, with its data written by the caller', async () => {
    const data = files['Samp Lib/Bänk 1/Pad.nsmp4'];
    const w = new StoredZipWriter();
    const meta = w.add('meta.xml', files['meta.xml']);
    const head = w.addKnown('Samp Lib/Bänk 1/Pad.nsmp4', data.length, crc32(data));
    const chunks = [...meta, head, data, ...w.end()];
    const zip = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let off = 0;
    for (const c of chunks) { zip.set(c, off); off += c.length; }
    expect(unzipSync(zip)).toEqual({ 'meta.xml': files['meta.xml'], 'Samp Lib/Bänk 1/Pad.nsmp4': data });
    expect(zip).toEqual(build({ 'meta.xml': files['meta.xml'], 'Samp Lib/Bänk 1/Pad.nsmp4': data }));
  });

  it('writes sizes in the local header and no data descriptor', () => {
    const zip = build({ 'a.bin': new Uint8Array([1, 2, 3]) });
    const v = new DataView(zip.buffer);
    expect(v.getUint16(6, true) & 0x0008).toBe(0);
    expect(v.getUint32(18, true)).toBe(3);
    expect(v.getUint32(22, true)).toBe(3);
    expect(zip.length).toBe(3 + storedZipEntryOverhead('a.bin') + STORED_ZIP_END_BYTES);
  });
});
