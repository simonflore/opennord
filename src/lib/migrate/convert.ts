/**
 * The cross-generation migration orchestrator. Reads a Stage 2 or Stage 3
 * program, lifts it into the neutral CommonProgram, emits Stage-4 edits, and
 * applies them onto the neutralized donor template — producing a valid .ns4p
 * plus a musician-facing report.
 *
 * Flow: identify → route (ns2 → decodeNs2/fromNs2, ns3 → decodeNs3/fromNs3) →
 * emitNs4 → editNs4Program(template, edits) → patch the CBIN header (carry the
 * donor's category, force the ns4p tag) → re-checksum. The program name never
 * lands in the file (ns4p stores no name) — it becomes the suggested filename.
 *
 * `templateBytes`: the browser UI (Task 9) always supplies these (fetched via
 * Vite's `?url` asset pipeline), so `buildMigrationTemplate` (pure, no Node
 * builtins) is all that path needs. When omitted — tests, scripts — this
 * module falls back to the on-disk fixture via a dynamic import of
 * `template-node.ts`, keeping `node:fs`/`node:url` out of the browser bundle
 * (see `docs/MIGRATION.md`).
 */
import { identifyNordFile } from '../clavia/nord-file';
import { decodeNs2 } from '../ns2/decode';
import { decodeNs3 } from '../ns3/decode';
import { fromNs2 } from './from-ns2';
import { fromNs3 } from './from-ns3';
import { emitNs4, type AvailableSound } from './to-ns4';
import { buildMigrationTemplate } from './template';
import { editNs4Program } from '../ns4/writer';
import { naiveAdvisor, type MigrationAdvisor } from './advisor';
import { readCbinHeader, buildCbinHeader, CBIN_BODY_OFFSET } from '../clavia/cbin';
import { PROGRAM_CATEGORY } from '../clavia/categories';
import type { CommonProgram, MigrationReport, LiftResult } from './common';

export interface MigrationResult {
  bytes: Uint8Array;
  report: MigrationReport;
  suggestedFilename: string;
}

/**
 * Reverse lookup category name → id over the clavia PROGRAM_CATEGORY table
 * (there is no name→id export in clavia/categories.ts, and we must not modify
 * clavia/). First id wins for duplicate names (e.g. "User" at 14 and 43).
 */
function categoryIdByName(name: string): number | undefined {
  for (const [id, n] of Object.entries(PROGRAM_CATEGORY)) {
    if (n === name) return Number(id);
  }
  return undefined;
}

/** Sanitize a program name into a safe .ns4p filename. */
function toFilename(name: string): string {
  const clean = name.replace(/[/\\:*?"<>|]+/g, '_').trim();
  return `${clean || 'Migrated Program'}.ns4p`;
}

export async function migrateToNs4(
  sourceBytes: Uint8Array,
  opts: {
    advisor?: MigrationAdvisor;
    sounds?: AvailableSound[];
    /** Filename-derived program name. */
    sourceName?: string;
    /** Browser path passes fixture bytes; Node/tests use the on-disk fixture. */
    templateBytes?: Uint8Array;
    sampleName?: (id: number, variation?: number) => string | undefined;
  } = {},
): Promise<MigrationResult> {
  const advisor = opts.advisor ?? naiveAdvisor;
  const sounds = opts.sounds ?? [];

  const id = identifyNordFile(sourceBytes);

  let lifted: LiftResult;
  if (id.recognized && id.generation === 'Stage 2') {
    lifted = fromNs2(decodeNs2(sourceBytes), { sampleName: opts.sampleName });
  } else if (id.recognized && id.generation === 'Stage 3') {
    lifted = fromNs3(decodeNs3(sourceBytes), { sampleName: opts.sampleName });
  } else {
    throw new Error('Only Stage 2 and Stage 3 programs can be converted');
  }

  const common: CommonProgram = lifted.common;
  const { edits, report } = await emitNs4(common, lifted.dropped, { advisor, sounds });

  // Apply edits onto the neutralized donor template. The browser UI always
  // supplies raw templateBytes (fetched via `?url`), built here via the pure
  // buildMigrationTemplate. The dynamic import below — the on-disk fixture
  // fallback for tests/scripts — only ever executes on the Node path (no
  // caller in src/components reaches it), keeping node:fs/node:url out of
  // the browser bundle.
  const template = opts.templateBytes
    ? buildMigrationTemplate(opts.templateBytes)
    : (await import('./template-node')).buildMigrationTemplateFromDisk();
  let bytes = editNs4Program(template, edits);

  // Carry the CBIN header: keep the ns4 template's header shape, force the
  // ns4p tag, and override category from the source (donor category, or the
  // lifted CommonProgram.category by name). Then re-checksum via editNs4Program.
  const donorHeader = readCbinHeader(bytes);
  const sourceHeader = id.recognized ? readCbinHeader(sourceBytes) : undefined;
  const categoryFromName = common.category ? categoryIdByName(common.category) : undefined;
  const category = categoryFromName ?? sourceHeader?.category ?? donorHeader.category;
  const header = buildCbinHeader({ ...donorHeader, tag: 'ns4p', category });
  bytes.set(header.subarray(0, CBIN_BODY_OFFSET), 0);
  // Re-checksum (editNs4Program re-checksums even with no edits).
  bytes = editNs4Program(bytes, []);

  const name = opts.sourceName ?? common.name ?? 'Migrated Program';

  return { bytes, report, suggestedFilename: toFilename(name) };
}
