import { MODELS, type NordModelId, type PartitionKind } from '../partitions';
import { readZipDirectory, extractZipEntry, type ZipEntry } from './zip-directory';

export interface BackupClass { kind: PartitionKind; native: boolean }
export interface BackupRef { bundlePath: string; entry: ZipEntry; kind: PartitionKind; native: boolean }
export interface BackupContents {
  model: NordModelId | null;
  programs: ZipEntry[];
  presets: ZipEntry[];
  pianos: BackupRef[];
  samples: BackupRef[];
}

/** meta.xml product_id → model. Seed Stage 4 (46); extend per model as verified. */
export const PRODUCT_IDS: Record<number, NordModelId> = { 46: 'stage-4' };

const ext = (path: string): string => {
  const f = path.replace(/^.*\//, '');
  const d = f.lastIndexOf('.');
  return d < 0 ? '' : f.slice(d + 1).toLowerCase();
};
const topFolder = (path: string): string => path.split('/')[0];

// Library files carry no partition fourcc in the registry; map by extension, and
// resolve native-vs-user from the top-level backup folder.
// Factory layouts (validated on real Stage-4 backup):
//   - Piano files (.npno)  → always factory (native: true); they live under "Piano/"
//   - Sample libs (.nsmp*) → factory under "Samp Lib/"; user-imported under other folders
const LIB_EXTS: Record<string, PartitionKind> = {
  npno: 'piano',
  nsmp: 'samplib',
  nsmp3: 'samplib',
  nsmp4: 'samplib',
};

const FACTORY_SAMPLIB_FOLDER = 'Samp Lib';

/** Classify a backup entry to its partition kind + factory flag, or null to skip. */
export function classifyBackupEntry(path: string, model: NordModelId | null): BackupClass | null {
  const basename = path.replace(/^.*\//, '');
  if (path.endsWith('/') || path === 'meta.xml' || path.startsWith('__MACOSX/') || basename.startsWith('._')) return null;
  const e = ext(path);
  // 1) program/preset/live: match the partition fourcc in the model registry.
  //    If the model is identified, prefer its own partition; then fall back to
  //    scanning all registered models (covers unidentified/null model and any
  //    not-yet-registered model whose files we still want to surface).
  const preferredSpecs = model ? MODELS[model].partitions : [];
  const byFourcc =
    preferredSpecs.find((s) => s.fourcc && s.fourcc.toLowerCase() === e) ??
    Object.values(MODELS)
      .flatMap((m) => m.partitions)
      .find((s) => s.fourcc && s.fourcc.toLowerCase() === e);
  if (byFourcc) return { kind: byFourcc.kind, native: byFourcc.native };
  // 2) library files (.npno/.nsmp*): kind by extension, native by folder.
  const libKind = LIB_EXTS[e];
  if (libKind) {
    // Piano files are always factory; sample libs are factory only under "Samp Lib/"
    const folder = topFolder(path);
    const native = libKind === 'piano' || folder === FACTORY_SAMPLIB_FOLDER;
    return { kind: libKind, native };
  }
  return null; // settings/unknown — not surfaced
}

/** Read meta.xml's product_id → model (null when absent/unknown). */
export async function identifyBackup(
  entries: ZipEntry[],
  readEntry: (e: ZipEntry) => Promise<Uint8Array>,
): Promise<NordModelId | null> {
  const meta = entries.find((e) => e.path === 'meta.xml');
  if (!meta) return null;
  const xml = new TextDecoder().decode(await readEntry(meta));
  const m = /product_id="(\d+)"/.exec(xml);
  return m ? PRODUCT_IDS[Number(m[1])] ?? null : null;
}

/** Index a backup: list entries, identify the model, split into the four buckets. */
export async function indexBackup(file: Blob, bundlePath: string): Promise<BackupContents> {
  const entries = await readZipDirectory(file);
  const model = await identifyBackup(entries, (e) => extractZipEntry(file, e));
  const out: BackupContents = { model, programs: [], presets: [], pianos: [], samples: [] };
  for (const entry of entries) {
    const c = classifyBackupEntry(entry.path, model);
    if (!c) continue;
    if (c.kind === 'program' || c.kind === 'live') out.programs.push(entry);
    else if (c.kind === 'organ-preset' || c.kind === 'piano-preset' || c.kind === 'synth-preset') out.presets.push(entry);
    else if (c.kind === 'piano') out.pianos.push({ bundlePath, entry, kind: c.kind, native: c.native });
    else if (c.kind === 'samplib') out.samples.push({ bundlePath, entry, kind: c.kind, native: c.native });
  }
  return out;
}
