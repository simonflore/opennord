import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { resolveFixturePath, corpusManifest } from './fixtures-fs';

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'corpus-'));
  mkdirSync(join(root, 'stage-3'));
  writeFileSync(join(root, 'stage-3', 'Patch.ns3f'), 'x');
  writeFileSync(join(root, 'stage-3', 'README.md'), 'x');     // skipped
  writeFileSync(join(root, 'stage-3', '.hidden'), 'x');        // skipped
  mkdirSync(join(root, 'not-a-model'));                        // skipped (unknown id)
  writeFileSync(join(root, 'not-a-model', 'y.bin'), 'x');
  writeFileSync(join(root, 'README.md'), 'x');                 // file at root, skipped
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('resolveFixturePath', () => {
  it('resolves a valid model/name under root', () => {
    expect(resolveFixturePath(root, 'stage-3', 'Patch.ns3f')).toBe(resolve(root, 'stage-3', 'Patch.ns3f'));
  });
  it('rejects traversal, absolute, and multi-segment names', () => {
    expect(resolveFixturePath(root, '..', 'x')).toBeNull();
    expect(resolveFixturePath(root, 'stage-3', '..')).toBeNull();
    expect(resolveFixturePath(root, 'stage-3', '../../etc/passwd')).toBeNull();
    expect(resolveFixturePath(root, 'stage-3', 'a/b')).toBeNull();
    expect(resolveFixturePath(root, 'stage-3', '/abs')).toBeNull();
  });
});

describe('corpusManifest', () => {
  it('lists known-model dirs, skipping dotfiles/README/unknown dirs', () => {
    const m = corpusManifest(root);
    expect(m).toEqual([{ id: 'stage-3', files: ['Patch.ns3f'] }]);
  });
  it('returns [] when the root is missing', () => {
    expect(corpusManifest(join(root, 'nope'))).toEqual([]);
  });
});
