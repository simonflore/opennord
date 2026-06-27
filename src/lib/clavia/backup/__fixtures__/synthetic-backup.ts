/**
 * SYNTHETIC — constructed bytes, no real audio (docs/LEGAL.md).
 *
 * Committed fixture builders for the backup factory-flag pipeline.
 * All bytes are zero-filled except the minimal structural fields required
 * to pass the CBIN identifier, NSMP section tree, and the factory flag.
 *
 * Used by:
 *   - src/lib/clavia/backup/synthetic-backup.test.ts (CI end-to-end pipeline test)
 *   - src/lib/library/useBackupOrigins.test.ts (hook unit tests)
 */

import { zipSync, strToU8 } from 'fflate';
import { buildCbinHeader } from '../../cbin';
import { patchNs4Checksum } from '../../checksum';
import { buildMetaXml } from '@/lib/device/ns4b';
import { NSMP_FACTORY_HEAD_BYTES } from '@/lib/ns4/nsmp';

// ---------------------------------------------------------------------------
// Sample fixture
// ---------------------------------------------------------------------------

/**
 * Build a minimal codec-4 `.nsmp4` of exactly {@link NSMP_FACTORY_HEAD_BYTES}
 * bytes with the hdr factory flag at payload+8.
 *
 * Structure mirrors the real format (RE-validated; see docs/FORMAT.md):
 *   CBIN header (0x2c)  → identifies the file as a Nord Sample
 *   NSMP root section   → codec version 400 (=codec 4)
 *   hdr section         → name/flag payload; flag at payload+8
 *
 * All audio-bearing payload bytes are zero (synthetic — no real audio).
 */
export function makeSyntheticSample(opts: { factory: boolean }): Uint8Array {
  const buf = new Uint8Array(NSMP_FACTORY_HEAD_BYTES);

  const ascii = (s: string, at: number) => {
    for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i);
  };
  const u32be = (v: number, at: number) => {
    buf[at]     = (v >>> 24) & 0xff;
    buf[at + 1] = (v >>> 16) & 0xff;
    buf[at + 2] = (v >>>  8) & 0xff;
    buf[at + 3] =  v         & 0xff;
  };

  // CBIN header: magic, formatType=1, tag='nsmp', version=400 (LE u16 @0x14)
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('nsmp', 0x08);
  buf[0x14] = 400 & 0xff;
  buf[0x15] = (400 >> 8) & 0xff; // codec 4 (floor(400/100)=4)

  // NSMP root section @0x2c: tag NSMP (0x4e534d50), version=40, size=4
  u32be(0x4e534d50, 0x2c); u32be(40, 0x30); u32be(4, 0x34);

  // hdr section @0x3c: tag \0hdr (0x00686472), version=11, size=16
  // payload starts at 0x48; factory flag at payload+8 (bytes 0x50, 0x51)
  u32be(0x00686472, 0x3c); u32be(11, 0x40); u32be(16, 0x44);

  if (opts.factory) {
    buf[0x48 + 8] = 0x0a;
    buf[0x48 + 9] = 0x01;
  }
  // Non-factory: flag bytes stay zero (user-imported)

  return buf;
}

// ---------------------------------------------------------------------------
// Program fixture
// ---------------------------------------------------------------------------

/**
 * Build a minimal CBIN `.ns4p` file (44-byte header + 4-byte body).
 * Contains a valid CBIN envelope and a patched checksum so it passes
 * `verifyNs4Checksum`. Body bytes are all zero (no real audio or patch data).
 */
export function makeSyntheticProgram(): Uint8Array {
  const header = buildCbinHeader({
    formatType: 1,
    tag: 'ns4p',
    bank: 0,
    location: 0,
    category: 0,
    versionRaw: 313,
  });
  const file = new Uint8Array(header.length + 4);
  file.set(header, 0);
  return patchNs4Checksum(file);
}

// ---------------------------------------------------------------------------
// Full backup fixture
// ---------------------------------------------------------------------------

/**
 * Build a stored (level:0) `.ns4b` zip containing:
 *   meta.xml                               — product_id=46 → stage-4
 *   Program/Bank A/Demo.ns4p               — one synthetic program
 *   Samp Lib/Mellotron/Demo Factory.nsmp4  — synthetic factory sample (hdr flag set;
 *                                            top-level folder "Samp Lib" → native:true)
 *   User Samples/Demo Mine.nsmp4           — synthetic user sample (hdr flag clear;
 *                                            top-level folder ≠ "Samp Lib" → native:false)
 *
 * The distinction between the two samples is tested at two levels:
 *   1. backup-index native flag (folder-level, structural)
 *   2. nsmpHeadFactory / readNsmp.suspectedFactory (byte-level hdr flag)
 *
 * All bytes are synthetic — no real audio (docs/LEGAL.md).
 */
export function buildSyntheticBackup(): Uint8Array {
  return zipSync(
    {
      'meta.xml':                                strToU8(buildMetaXml(0)),
      'Program/Bank A/Demo.ns4p':                makeSyntheticProgram(),
      'Samp Lib/Mellotron/Demo Factory.nsmp4':   makeSyntheticSample({ factory: true }),
      // User-imported samples live outside "Samp Lib/" → classified native:false by folder
      'User Samples/Demo Mine.nsmp4':            makeSyntheticSample({ factory: false }),
    },
    { level: 0 },
  );
}
