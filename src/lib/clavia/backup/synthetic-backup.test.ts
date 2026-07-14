/**
 * End-to-end factory-flag pipeline test using synthetic fixtures.
 * Runs in CI — no real backup file required (docs/LEGAL.md: no real audio).
 *
 * Exercises the real pipeline:
 *   buildSyntheticBackup() → indexBackup() → extractZipEntryHead() → nsmpHeadFactory()
 *   and: extractZipEntry() → readNsmp() → .suspectedFactory
 */
import { describe, it, expect } from 'vitest';
import { indexBackup } from './backup-index';
import { extractZipEntry, extractZipEntryHead } from './zip-directory';
import { nsmpHeadFactory, readNsmp, NSMP_FACTORY_HEAD_BYTES } from '@/lib/ns4/nsmp';
import { buildSyntheticBackup, makeSyntheticSample } from './__fixtures__/synthetic-backup';

describe('buildSyntheticBackup — indexBackup pipeline (CI, no real audio)', () => {
  it('model is stage-4, 1 program, 2 samples', async () => {
    const blob = new Blob([buildSyntheticBackup().buffer as ArrayBuffer]);
    const contents = await indexBackup(blob, 'synthetic.ns4b');

    expect(contents.model).toBe('stage-4');
    expect(contents.programs).toHaveLength(1);
    expect(contents.programs[0].path).toBe('Program/Bank A/Demo.ns4p');
    expect(contents.samples).toHaveLength(2);
  });

  it('factory sample head path → nsmpHeadFactory returns true', async () => {
    const blob = new Blob([buildSyntheticBackup().buffer as ArrayBuffer]);
    const contents = await indexBackup(blob, 'synthetic.ns4b');

    // "Samp Lib/..." top-level folder → native:true by folder classification
    const mello = contents.samples.find((r) =>
      r.entry.path.includes('Mellotron'),
    );
    expect(mello, 'Mellotron entry present').toBeTruthy();
    expect(mello!.native).toBe(true); // folder classification: Samp Lib/ = factory

    const head = await extractZipEntryHead(blob, mello!.entry, NSMP_FACTORY_HEAD_BYTES);
    expect(nsmpHeadFactory(head)).toBe(true); // byte-level hdr flag
  });

  it('user sample head path → nsmpHeadFactory returns false', async () => {
    const blob = new Blob([buildSyntheticBackup().buffer as ArrayBuffer]);
    const contents = await indexBackup(blob, 'synthetic.ns4b');

    // "User Samples/..." top-level folder ≠ "Samp Lib" → native:false by folder classification
    const user = contents.samples.find((r) =>
      r.entry.path.includes('User Samples'),
    );
    expect(user, 'User Samples entry present').toBeTruthy();
    expect(user!.native).toBe(false); // folder classification: not Samp Lib

    const head = await extractZipEntryHead(blob, user!.entry, NSMP_FACTORY_HEAD_BYTES);
    expect(nsmpHeadFactory(head)).toBe(false); // byte-level hdr flag
  });

  it('full-read path (readNsmp) agrees with head path on factory flag', async () => {
    const blob = new Blob([buildSyntheticBackup().buffer as ArrayBuffer]);
    const contents = await indexBackup(blob, 'synthetic.ns4b');

    for (const ref of contents.samples) {
      const head = await extractZipEntryHead(blob, ref.entry, NSMP_FACTORY_HEAD_BYTES);
      const headResult = nsmpHeadFactory(head);

      const full = await extractZipEntry(blob, ref.entry);
      const fullResult = readNsmp(full).suspectedFactory;

      // Both paths must agree
      expect(headResult, `head path for ${ref.entry.path}`).toBe(fullResult);
    }
  });
});

describe('makeSyntheticSample — unit checks', () => {
  it('factory=true head is exactly NSMP_FACTORY_HEAD_BYTES long', () => {
    expect(makeSyntheticSample({ factory: true })).toHaveLength(NSMP_FACTORY_HEAD_BYTES);
  });

  it('factory=false head is exactly NSMP_FACTORY_HEAD_BYTES long', () => {
    expect(makeSyntheticSample({ factory: false })).toHaveLength(NSMP_FACTORY_HEAD_BYTES);
  });

  it('nsmpHeadFactory sees factory=true correctly', () => {
    expect(nsmpHeadFactory(makeSyntheticSample({ factory: true }))).toBe(true);
  });

  it('nsmpHeadFactory sees factory=false correctly', () => {
    expect(nsmpHeadFactory(makeSyntheticSample({ factory: false }))).toBe(false);
  });
});
