// Runs under the default node env: Node's File implements .stream() (jsdom's does not).
import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mainThreadScanner, type ScanBatch, type BundleDescriptor } from './pipeline';
import { MAX_READ_BYTES } from './scan';

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
    const zip = zipSync({ 'Bank 1/Lead.ns4p': solo });
    const scanner = mainThreadScanner();
    await scanner.scanLoose([file('F/Backup.ns4b', zip)], () => {});
    const batches: ScanBatch[] = [];
    await scanner.expandBundles(['Backup.ns4b'], (b) => batches.push(b));
    const r = drain(batches);
    expect(r.programs.map((p) => p.id)).toEqual(['folder:Backup.ns4b!Bank 1/Lead.ns4p']);
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

  it('records one error for a bundle whose stream fails, then continues', async () => {
    const scanner = mainThreadScanner();
    const broken = file('F/Broken.ns4b', new Uint8Array([0]));
    // A read error mid-stream (IO failure) must be caught per-bundle, not abort the scan.
    Object.defineProperty(broken, 'stream', {
      value: () => new ReadableStream<Uint8Array>({ pull(c) { c.error(new Error('stream failed')); } }),
    });
    await scanner.scanLoose([broken], () => {});
    const batches: ScanBatch[] = [];
    await scanner.expandBundles(['Broken.ns4b'], (b) => batches.push(b));
    const r = drain(batches);
    expect(r.errors.map((e) => e.path)).toEqual(['Broken.ns4b']);
  });
});
