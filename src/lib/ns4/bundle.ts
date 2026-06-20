/**
 * Reading and writing Nord Stage 4 **bundles**.
 *
 * A Nord backup/bundle is a plain ZIP archive of individual program files — not
 * a custom container (verified from the Stage 2/3 ecosystem; see docs/FORMAT.md).
 * So importing a bundle means unzipping and decoding each `.ns4p`/`.ns4l` entry,
 * and sharing a collection means zipping individual programs back up.
 *
 * Legal note: a bundle carries **user programs only, never sample audio**
 * (docs/LEGAL.md). Programs reference factory samples by id.
 */

import { unzipSync, zipSync } from 'fflate';
import { parseNs4Program } from './parse';
import { programNameFromFilename } from '../clavia/name';
import type { NS4Program } from './types';

/** File extensions that hold a decodable program inside a bundle. */
const PROGRAM_EXTENSIONS = ['.ns4p', '.ns4l'];

function isProgramPath(path: string): boolean {
  const lower = path.toLowerCase();
  return PROGRAM_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** One program found inside a bundle. */
export interface Ns4BundleEntry {
  /** Path of the entry inside the zip, e.g. `"Bank 1/My Patch.ns4p"`. */
  path: string;
  /** Display name derived from the filename (docs/FORMAT.md: no name in binary). */
  name: string;
  /** Raw program bytes, exactly as stored in the bundle. */
  bytes: Uint8Array;
  /** Decoded program. */
  program: NS4Program;
}

/** A program to pack into a bundle. */
export interface Ns4BundleInput {
  /** Display name — used to build the entry path when `path` is omitted. */
  name: string;
  /** Raw, already-checksummed `.ns4p` bytes (see checksum.ts). */
  bytes: Uint8Array;
  /** Optional explicit path inside the zip; defaults to `"<name>.ns4p"`. */
  path?: string;
}

/**
 * Decode every program in a bundle (ZIP) buffer.
 *
 * Tolerant by design: it filters entries by extension, skips directories and
 * macOS resource-fork entries, and derives each name from its basename — so it
 * works regardless of the bundle's internal folder convention.
 */
export function readNs4Bundle(zipData: Uint8Array): Ns4BundleEntry[] {
  const files = unzipSync(zipData);
  const entries: Ns4BundleEntry[] = [];

  for (const [path, bytes] of Object.entries(files)) {
    if (path.endsWith('/')) continue; // directory entry
    if (path.startsWith('__MACOSX/') || path.split('/').pop()?.startsWith('._')) continue;
    if (!isProgramPath(path)) continue;

    entries.push({
      path,
      name: programNameFromFilename(path),
      bytes,
      program: parseNs4Program(bytes),
    });
  }

  return entries;
}

/** Filesystem-safe version of a name for use as a zip entry filename. */
function safeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'Unnamed';
}

/**
 * Pack programs into a bundle (ZIP) buffer.
 *
 * Uses a flat layout (`"<name>.ns4p"`) unless an explicit `path` is given.
 * Duplicate paths are disambiguated with a numeric suffix so no entry is lost.
 */
export function writeNs4Bundle(programs: Ns4BundleInput[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};

  for (const p of programs) {
    let path = p.path ?? `${safeFilename(p.name)}.ns4p`;
    if (path in files) {
      const dot = path.lastIndexOf('.');
      const stem = dot === -1 ? path : path.slice(0, dot);
      const ext = dot === -1 ? '' : path.slice(dot);
      let n = 2;
      while (`${stem} (${n})${ext}` in files) n++;
      path = `${stem} (${n})${ext}`;
    }
    files[path] = p.bytes;
  }

  return zipSync(files);
}
