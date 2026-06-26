// Runs under the default node env: Node's File implements .stream() (jsdom's does not).
import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mainThreadScanner, type ScanBatch, type BundleDescriptor } from './pipeline';
import { MAX_READ_BYTES } from './scan';
import { buildCbinHeader } from '../clavia/cbin';

// Real program bytes so scanFiles actually parses something.
const solo = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/BreakFreeSolo.ns4p', import.meta.url))),
);

function file(relPath: string, bytes: Uint8Array, size?: number): File {
  const f = new File([bytes.buffer as ArrayBuffer], relPath.split('/').pop() ?? relPath);
  Object.defineProperty(f, 'webkitRelativePath', { value: relPath });
  if (size !== undefined) Object.defineProperty(f, 'size', { value: size });
  return f;
}
function drain(batches: ScanBatch[]) {
  return {
    programs: batches.flatMap((b) => b.programs),
    samples: batches.flatMap((b) => b.samples),
    errors: batches.flatMap((b) => b.errors),
  };
}

describe('mainThreadScanner', () => {
  it('Pass A parses loose programs and returns bundle descriptors without expanding', async () => {
    const zip = zipSync({ 'Bank 1/Lead.ns4p': solo });
    const scanner = mainThreadScanner();
    const batches: ScanBatch[] = [];
    const bundles = await scanner.scanLoose(
      [file('F/loose.ns4p', solo), file('F/Backup.ns4b', zip)],
      (b) => batches.push(b),
    );
    const r = drain(batches);
    expect(r.programs.map((p) => p.id)).toEqual(['folder:loose.ns4p']); // bundle NOT expanded
    expect(bundles).toEqual<BundleDescriptor[]>([{ path: 'Backup.ns4b', size: zip.length }]);
  });

  it('Pass B expands only the chosen bundles, keyed <bundle>!<inner>', async () => {
    const metaXml = strToU8('<?xml version="1.0"?><backup product_id="46"/>');
    const zip = zipSync({ 'meta.xml': metaXml, 'Program/Bank A/Lead.ns4p': solo });
    const scanner = mainThreadScanner();
    await scanner.scanLoose([file('F/Backup.ns4b', zip)], () => {});
    const batches: ScanBatch[] = [];
    await scanner.expandBundles(['Backup.ns4b'], (b) => batches.push(b));
    const r = drain(batches);
    expect(r.programs.map((p) => p.id)).toEqual(['folder:Backup.ns4b!Program/Bank A/Lead.ns4p']);
  });

  it('records an oversized loose file as an error instead of reading it', async () => {
    const scanner = mainThreadScanner();
    const batches: ScanBatch[] = [];
    await scanner.scanLoose([file('F/Huge.ns4p', new Uint8Array([0]), MAX_READ_BYTES + 1)], (b) => batches.push(b));
    const r = drain(batches);
    expect(r.programs).toHaveLength(0);
    expect(r.errors.map((e) => e.path)).toEqual(['Huge.ns4p']);
    expect(r.errors[0].reason).toMatch(/too large/i);
  });

  it('records one error for a bundle that is not a valid zip, then continues', async () => {
    const scanner = mainThreadScanner();
    const broken = file('F/Broken.ns4b', new Uint8Array([0]));
    await scanner.scanLoose([broken], () => {});
    const batches: ScanBatch[] = [];
    await scanner.expandBundles(['Broken.ns4b'], (b) => batches.push(b));
    const r = drain(batches);
    expect(r.errors.map((e) => e.path)).toEqual(['Broken.ns4b']);
  });

  it('Pass B surfaces both programs AND presets from a backup, programs byte-identical', async () => {
    // Build a minimal CBIN preset (ns4y = synth preset).
    const presetBytes = buildCbinHeader({ tag: 'ns4y', formatType: 1, bank: 0, location: 0, category: 0, versionRaw: 304 });

    // meta.xml identifies the backup as Stage 4 (product_id=46).
    const metaXml = strToU8('<?xml version="1.0"?><backup product_id="46"/>');

    const zip = zipSync({
      'meta.xml': metaXml,
      'Program/Bank A/Lead.ns4p': solo,
      'Synth Preset/Bank 1/Pad.ns4y': presetBytes,
    });

    const scanner = mainThreadScanner();
    await scanner.scanLoose([file('F/Backup.ns4b', zip)], () => {});

    const batches: ScanBatch[] = [];
    await scanner.expandBundles(['Backup.ns4b'], (b) => batches.push(b));

    const programs = batches.flatMap((b) => b.programs);
    const presets = batches.flatMap((b) => b.presets);

    // Both a program and a preset must arrive.
    expect(programs.map((p) => p.id)).toEqual(['folder:Backup.ns4b!Program/Bank A/Lead.ns4p']);
    expect(presets.map((p) => p.id)).toEqual(['folder:Backup.ns4b!Synth Preset/Bank 1/Pad.ns4y']);

    // The program path/name is unchanged from the forward-stream baseline.
    expect(programs[0].path).toBe('Backup.ns4b!Program/Bank A/Lead.ns4p');
    expect(presets[0].kind).toBe('synth-preset');
  });

  it('Pass B surfaces backup pianos and samples as byte-free BackupRefs, with correct native flag', async () => {
    // Build a ZIP with meta.xml, one factory piano, one factory sample, one user sample.
    const metaXml = strToU8('<?xml version="1.0"?><backup product_id="46"/>');

    const zip = zipSync({
      'meta.xml': metaXml,
      'Piano/Grand Lady D.npno': new Uint8Array(100),          // factory piano (always native)
      'Samp Lib/Choir/Choir.nsmp4': new Uint8Array(512),        // factory sample ("Samp Lib/" folder)
      'User Samples/MyPad.nsmp3': new Uint8Array(64),           // user sample (other folder)
    });

    const scanner = mainThreadScanner();
    await scanner.scanLoose([file('F/Backup.ns4b', zip)], () => {});

    const batches: ScanBatch[] = [];
    await scanner.expandBundles(['Backup.ns4b'], (b) => batches.push(b));

    const backupPianos = batches.flatMap((b) => b.backupPianos);
    const backupSamples = batches.flatMap((b) => b.backupSamples);

    // Piano: one factory entry, no bytes anywhere in the batch.
    expect(backupPianos).toHaveLength(1);
    expect(backupPianos[0].entry.path).toBe('Piano/Grand Lady D.npno');
    expect(backupPianos[0].native).toBe(true);
    expect(backupPianos[0].bundlePath).toBe('Backup.ns4b');

    // Samples: factory under "Samp Lib/", user under "User Samples/"
    expect(backupSamples).toHaveLength(2);
    const choir = backupSamples.find((r) => r.entry.path.includes('Choir'));
    const mypad = backupSamples.find((r) => r.entry.path.includes('MyPad'));
    expect(choir?.native).toBe(true);
    expect(mypad?.native).toBe(false);

    // No bytes in the batches for piano/sample refs.
    for (const b of batches) {
      expect(b.backupPianos.every((r) => !('bytes' in r))).toBe(true);
      expect(b.backupSamples.every((r) => !('bytes' in r))).toBe(true);
    }
  });
});
