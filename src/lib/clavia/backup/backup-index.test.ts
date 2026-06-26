import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { classifyBackupEntry, indexBackup } from './backup-index';

const meta = (productId: number) =>
  strToU8(`<?xml version="1.0"?><backup product_id="${productId}"/>`);

describe('classifyBackupEntry (stage-4)', () => {
  it('maps user partitions by extension', () => {
    expect(classifyBackupEntry('Program/Bank A/X.ns4p', 'stage-4')).toEqual({ kind: 'program', native: false });
    expect(classifyBackupEntry('Organ Preset/Bank 1/X.ns4o', 'stage-4')).toEqual({ kind: 'organ-preset', native: false });
    expect(classifyBackupEntry('Synth Preset/Bank 1/X.ns4y', 'stage-4')).toEqual({ kind: 'synth-preset', native: false });
  });
  it('maps factory libraries by folder + extension and tags them native', () => {
    expect(classifyBackupEntry('Piano/Grand/Royal Grand.npno', 'stage-4')).toEqual({ kind: 'piano', native: true });
    expect(classifyBackupEntry('Samp Lib/Factory/Pad.nsmp4', 'stage-4')).toEqual({ kind: 'samplib', native: true });
  });
  it('ignores meta.xml and unknown entries', () => {
    expect(classifyBackupEntry('meta.xml', 'stage-4')).toBeNull();
  });
});

describe('indexBackup', () => {
  it('identifies the model and splits entries into the four buckets', async () => {
    const blob = new Blob([zipSync({
      'meta.xml': meta(46),
      'Program/Bank A/Lead.ns4p': new Uint8Array([1, 2, 3]),
      'Synth Preset/Bank 1/Pad.ns4y': new Uint8Array([4, 5]),
      'Piano/Grand/Royal Grand.npno': new Uint8Array(10),
      'Samp Lib/Factory/Bell.nsmp4': new Uint8Array(8),
    }).buffer as ArrayBuffer]);
    const c = await indexBackup(blob, 'TBM.ns4b');
    expect(c.model).toBe('stage-4');
    expect(c.programs.map((e) => e.path)).toEqual(['Program/Bank A/Lead.ns4p']);
    expect(c.presets.map((e) => e.path)).toEqual(['Synth Preset/Bank 1/Pad.ns4y']);
    expect(c.pianos.map((r) => [r.kind, r.native])).toEqual([['piano', true]]);
    expect(c.samples.map((r) => [r.kind, r.native])).toEqual([['samplib', true]]);
    expect(c.pianos[0].bundlePath).toBe('TBM.ns4b');
  });
});

describe('classifyBackupEntry (model=null — unidentified/missing meta.xml)', () => {
  it('classifies ns4p as program via family fallback', () => {
    expect(classifyBackupEntry('Program/Bank A/X.ns4p', null)).toEqual({ kind: 'program', native: false });
  });
  it('classifies ns4y as synth-preset via family fallback', () => {
    expect(classifyBackupEntry('Synth Preset/Bank 1/Y.ns4y', null)).toEqual({ kind: 'synth-preset', native: false });
  });
  it('library extensions still work when model is null', () => {
    expect(classifyBackupEntry('Piano/Grand/Royal Grand.npno', null)).toEqual({ kind: 'piano', native: true });
    expect(classifyBackupEntry('Samp Lib/Factory/Pad.nsmp4', null)).toEqual({ kind: 'samplib', native: true });
  });
  it('returns null for truly unknown extensions', () => {
    expect(classifyBackupEntry('Settings/settings.dat', null)).toBeNull();
  });
});

describe('indexBackup (no meta.xml — model=null)', () => {
  it('still buckets programs and presets by extension when model is unidentified', async () => {
    const blob = new Blob([zipSync({
      // deliberately NO meta.xml
      'Program/Bank A/Lead.ns4p': new Uint8Array([1, 2, 3]),
      'Synth Preset/Bank 1/Pad.ns4y': new Uint8Array([4, 5]),
      'Piano/Grand/Royal Grand.npno': new Uint8Array(10),
      'Samp Lib/Factory/Bell.nsmp4': new Uint8Array(8),
    }).buffer as ArrayBuffer]);
    const c = await indexBackup(blob, 'unknown.ns4b');
    expect(c.model).toBeNull();
    expect(c.programs.map((e) => e.path)).toEqual(['Program/Bank A/Lead.ns4p']);
    expect(c.presets.map((e) => e.path)).toEqual(['Synth Preset/Bank 1/Pad.ns4y']);
    expect(c.pianos.map((r) => r.kind)).toEqual(['piano']);
    expect(c.samples.map((r) => r.kind)).toEqual(['samplib']);
  });
});

// ---------------------------------------------------------------------------
// Real-backup smoke test — skipped if the file is absent or openAsBlob is
// unavailable (browser / old Node).  Only reads the zip central directory
// (never loads piano/sample data into memory).
// ---------------------------------------------------------------------------
const REAL_BACKUP = '/Users/simonflore/Documents/TBM/Backup 2026-06-13.ns4b';

async function openRealBackup(): Promise<Blob | null> {
  try {
    const { existsSync } = await import('fs');
    if (!existsSync(REAL_BACKUP)) return null;
    // openAsBlob is Node 20+; returns a lazy seekable Blob — only the slices
    // we ask for are actually read from disk.
    const { openAsBlob } = await import('fs');
    if (typeof openAsBlob !== 'function') return null;
    return openAsBlob(REAL_BACKUP);
  } catch {
    return null;
  }
}

describe('indexBackup (real Stage-4 backup)', () => {
  it('identifies stage-4, finds programs, and finds a known factory grand', async () => {
    const blob = await openRealBackup();
    if (!blob) {
      // Skip cleanly — file absent or runtime doesn't support openAsBlob.
      console.log('  ↳ skipped: real backup not available');
      return;
    }

    const c = await indexBackup(blob, REAL_BACKUP);

    expect(c.model).toBe('stage-4');
    expect(c.programs.length).toBeGreaterThan(0);

    // The real backup contains "Royal Grand 3D XL 6.1.npno" under Piano/Grand/
    const royalGrand = c.pianos.find((r) => r.entry.path.includes('Royal Grand 3D XL'));
    expect(royalGrand).toBeDefined();
    expect(royalGrand!.kind).toBe('piano');
    expect(royalGrand!.native).toBe(true);
  });
});
