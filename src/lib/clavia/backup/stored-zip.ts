import { crc32 } from '../checksum';

/** Bytes a stored zip spends on one entry besides its data: local header + central record, each with the name. */
export function storedZipEntryOverhead(path: string): number {
  return 30 + 46 + 2 * new TextEncoder().encode(path).length;
}

/** Bytes of the end-of-central-directory record. */
export const STORED_ZIP_END_BYTES = 22;

/** The largest stored zip without ZIP64: every size and offset is a u32. */
export const STORED_ZIP_MAX_BYTES = 0xffffffff;

const DOS_DATE_1980_01_01 = 0x0021;

/**
 * A stored (uncompressed) zip written one whole file at a time, as `zipSync` and NSM
 * write it: each local header carries the CRC-32 and both sizes, and there are no data
 * descriptors. A forward-streaming reader (fflate's `Unzip`, {@link ../../folder/unzip-stream})
 * then reads each entry by its size; with fflate's streaming `Zip`, whose headers leave
 * the sizes zero, it ends an entry at the first `PK\x07\x08` in its data and silently
 * truncates it. No ZIP64: the caller keeps the archive under {@link STORED_ZIP_MAX_BYTES}.
 */
export class StoredZipWriter {
  private central: Uint8Array[] = [];
  private offset = 0;
  private count = 0;

  /** The local header and data for `path`, to write in order. */
  add(path: string, data: Uint8Array): Uint8Array[] {
    return [this.addKnown(path, data.length, crc32(data)), data];
  }

  /**
   * The local header for `path` whose `size` bytes of data, with CRC-32 `crc`, the
   * caller writes right after it: an entry copied from another stored zip, without
   * reading its data again.
   */
  addKnown(path: string, size: number, crc: number): Uint8Array {
    const name = new TextEncoder().encode(path);
    const utf8 = name.some((b) => b > 0x7f);
    if (this.offset + 30 + name.length + size > STORED_ZIP_MAX_BYTES) {
      throw new RangeError('stored zip would exceed 4 GiB (no ZIP64)');
    }
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, utf8 ? 0x0800 : 0, true); // flags: UTF-8 names only; no data descriptor
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, 0, true); // time
    lv.setUint16(12, DOS_DATE_1980_01_01, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, utf8 ? 0x0800 : 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, DOS_DATE_1980_01_01, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    // extra, comment, disk, internal and external attributes stay 0
    cv.setUint32(42, this.offset, true);
    cd.set(name, 46);

    this.central.push(cd);
    this.offset += local.length + size;
    this.count++;
    return local;
  }

  /** The central directory and end record, written after the last entry. */
  end(): Uint8Array[] {
    const size = this.central.reduce((n, c) => n + c.length, 0);
    if (this.count > 0xffff || this.offset + size + STORED_ZIP_END_BYTES > STORED_ZIP_MAX_BYTES) {
      throw new RangeError('stored zip would exceed the format’s limits (no ZIP64)');
    }
    const eocd = new Uint8Array(STORED_ZIP_END_BYTES);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, this.count, true);
    ev.setUint16(10, this.count, true);
    ev.setUint32(12, size, true);
    ev.setUint32(16, this.offset, true);
    return [...this.central, eocd];
  }
}
