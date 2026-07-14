import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { MODELS } from '../lib/clavia/partitions';

export interface CorpusModel { id: string; files: string[]; }

const unsafe = (s: string) => !s || s === '..' || s.includes('/') || s.includes('\\') || s.includes('\0');

/** Absolute path under `root`, or null if model/name is unsafe or escapes root. */
export function resolveFixturePath(root: string, model: string, name: string): string | null {
  if (unsafe(model) || unsafe(name)) return null;
  const abs = resolve(root, model, name);
  return abs.startsWith(resolve(root) + sep) ? abs : null;
}

/** List corpus subdirectories whose name is a known model id, with their (non-dot, non-README) files. */
export function corpusManifest(root: string): CorpusModel[] {
  if (!existsSync(root)) return [];
  const out: CorpusModel[] = [];
  for (const id of readdirSync(root).sort()) {
    const dir = resolve(root, id);
    if (!statSync(dir).isDirectory() || !(id in MODELS)) continue;
    const files = readdirSync(dir).sort().filter(
      (f) => !f.startsWith('.') && f !== 'README.md' && statSync(resolve(dir, f)).isFile(),
    );
    if (files.length) out.push({ id, files });
  }
  return out;
}
