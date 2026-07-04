/**
 * Repeatable, dedup-safe fixture-corpus grower.
 *
 * Nord publishes artist/factory sound banks as nested zips (a zip of zips, some
 * levels being `.nl4pbundle`/`.np4pbundle`/`.ne4pb`, which are themselves zips).
 * This walks that nesting, copies every leaf program/sample file into
 * `fixtures/<model>/` with a `BANK_<sanitized>__` prefix, and dedups by SHA-1
 * content hash against whatever is already there — so re-running is idempotent.
 *
 * The fixtures/ tree is gitignored local-only RE material (docs/LEGAL.md);
 * this tool never commits or redistributes anything.
 *
 * Usage:  node scripts/extract-banks.mjs "<path to bank zip>" <model-id>
 * e.g.    node scripts/extract-banks.mjs "fixtures/Nord Lead 4 Sound Banks.zip" lead-4
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';

/** Turn a raw folder/bank name into a safe, short filename prefix. */
export function sanitizeBankPrefix(name) {
  return name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
}

const LEAF_EXT = new Set([
  '.nl4s', '.nl4p', '.nlas', '.nlap', '.nwp', '.nw2p',
  '.ne4p', '.ne5p', '.ne6p', '.ng2p', '.np4p', '.np5p',
  '.ns2p', '.ns3f', '.nsmp', '.nsmp3', '.nsmp4', '.npno',
]);
const ARCHIVE_EXT = new Set(['.zip', '.nl4pbundle', '.nl4sbundle', '.np4pbundle', '.np4sbundle', '.ne4pb']);

function sha1(buf) {
  return createHash('sha1').update(buf).digest('hex');
}

function unzipTo(archive, dest) {
  mkdirSync(dest, { recursive: true });
  try {
    execFileSync('unzip', ['-oq', archive, '-d', dest, '-x', '__MACOSX/*'], { stdio: 'ignore' });
  } catch {
    // unzip exits non-zero on the -x "nothing matched" warning even on success; ignore.
  }
}

function walkArchives(dir, onLeaf, bankName) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkArchives(full, onLeaf, bankName);
      continue;
    }
    const ext = extname(entry.name).toLowerCase();
    if (ARCHIVE_EXT.has(ext)) {
      const sub = `${full}.__x`;
      unzipTo(full, sub);
      walkArchives(sub, onLeaf, sanitizeBankPrefix(basename(entry.name, ext)));
    } else if (LEAF_EXT.has(ext)) {
      onLeaf(full, bankName || sanitizeBankPrefix(basename(dirname(full))));
    }
  }
}

/**
 * Extract every leaf program/sample from a (possibly deeply nested) bank archive
 * into fixtures/<model>/, deduped by content hash. Returns {copied, skipped}.
 */
export function extractBanks(srcZip, model, destRoot) {
  const dest = join(destRoot, model);
  mkdirSync(dest, { recursive: true });

  const seen = new Set();
  for (const f of readdirSync(dest)) {
    const p = join(dest, f);
    try {
      seen.add(sha1(readFileSync(p)));
    } catch {
      // subdirectory or unreadable entry — skip.
    }
  }

  const scratch = join(tmpdir(), `banks-${process.pid}-${seen.size}`);
  unzipTo(srcZip, scratch);

  let copied = 0;
  let skipped = 0;
  walkArchives(scratch, (leaf, bank) => {
    const data = readFileSync(leaf);
    const h = sha1(data);
    if (seen.has(h)) {
      skipped++;
      return;
    }
    seen.add(h);
    let out = join(dest, `BANK_${bank}__${basename(leaf)}`);
    let n = 1;
    while (existsSync(out)) {
      const stem = basename(leaf, extname(leaf));
      out = join(dest, `BANK_${bank}__${stem}_${n}${extname(leaf)}`);
      n++;
    }
    writeFileSync(out, data);
    copied++;
  });

  return { copied, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , srcZip, model] = process.argv;
  if (!srcZip || !model) {
    console.error('Usage: node scripts/extract-banks.mjs "<bank zip>" <model-id>');
    process.exit(1);
  }
  const root = new URL('../fixtures', import.meta.url).pathname;
  console.log(extractBanks(srcZip, model, root));
}
