import { useState } from 'react';
import type { NsmpFile } from '../../lib/ns4/nsmp';
import { convertNsmp, type TargetCodec } from '../../lib/ns4/nsmp-convert';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { useFolder } from '../../lib/folder/FolderContext';
import { useWriteBackPref } from '../../lib/library/writeBackPrefs';
import { WriteTargetDialog } from '../ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'done'; msg: string; warnings: string[] }
  | { kind: 'error'; msg: string };

/** Pending write-to-folder dialog state. */
type PendingWrite = { out: Uint8Array; filename: string; existing: boolean };

/**
 * Every Nord Sample generation OpenNord can write, newest first. The `code` is the
 * `convertNsmp` target; `2` is the original `.nsmp` (OG `NWS` container). Listing
 * all three lets the UI offer any generation as a target, so a loaded sample can be
 * converted from *any* generation to *any other* -- including the downconverts the
 * official editor refuses (`.nsmp4`/`.nsmp3` -> original `.nsmp`).
 */
const GENERATIONS: { code: TargetCodec; ext: string; label: string; experimental?: boolean }[] = [
  { code: 4, ext: '.nsmp4', label: 'Stage 4 (.nsmp4)' },
  { code: 3, ext: '.nsmp3', label: 'Stage 3 (.nsmp3)' },
  { code: 2, ext: '.nsmp', label: 'Original (.nsmp)', experimental: true },
];

/** Which generation a loaded file is, as a {@link GENERATIONS} code (OG -> 2). */
function sourceGeneration(file: NsmpFile): TargetCodec | 0 {
  if (file.legacy) return 2;
  if (file.codec === 3 || file.codec === 4) return file.codec;
  return 0;
}

/**
 * Convert a loaded sample to another generation and save it. If a folder is linked
 * the result lands there; otherwise it downloads. Offers every generation other than
 * the source -- the original `.nsmp` (OG), `.nsmp3` and `.nsmp4` -- so a sample can
 * be converted between *any* two generations in either direction. Audio is preserved
 * exactly (`convertNsmp`).
 */
export function SampleConvert({ bytes, file, name }: { bytes: Uint8Array; file: NsmpFile; name?: string }) {
  const folder = useFolder();
  const writeBackPref = useWriteBackPref();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [pendingWrite, setPendingWrite] = useState<PendingWrite | null>(null);

  const source = sourceGeneration(file);
  const targets = GENERATIONS.filter((g) => g.code !== source);
  if (targets.length === 0) return null;

  async function performFolderWrite(out: Uint8Array, filename: string, mode: 'new' | 'overwrite') {
    try {
      const res = await folder.writeBack(filename, async (w) => { await w.write(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer); }, { mode });
      if (res.target === 'folder') {
        setStatus({ kind: 'done', msg: `Saved to ${folder.folderName ?? ''}/${res.path}`, warnings: [] });
        return;
      }
      // writeBack returned 'download' (no FSA / denied) -- fall through to download.
      downloadBytes(out, filename);
      setStatus({ kind: 'done', msg: `Saved ${filename}`, warnings: [] });
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    }
  }

  async function convert(target: TargetCodec) {
    try {
      const { bytes: out, extension, warnings } = convertNsmp(bytes, target);
      const filename = `${file.name?.trim() || name?.trim() || 'sample'}${extension}`;

      // Folder-first: if a folder is linked, route through writeBack.
      if (folder.folderName) {
        if (writeBackPref.mode === 'ask') {
          const existing = folder.result.samples.some((s) => s.name === filename);
          setPendingWrite({ out, filename, existing });
          setStatus({ kind: 'idle' });
          return;
        }
        // Remembered preference -- use it directly.
        setStatus({ kind: 'idle' });
        await performFolderWrite(out, filename, writeBackPref.mode);
        return;
      }

      // No folder linked -- download verbatim.
      downloadBytes(out, filename);
      setStatus({ kind: 'done', msg: `Saved ${filename}`, warnings });
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    }
  }

  async function handleDialogChoose(mode: 'new' | 'overwrite', remember: boolean) {
    if (!pendingWrite) return;
    const { out, filename } = pendingWrite;
    if (remember) writeBackPref.setMode(mode);
    setPendingWrite(null);
    await performFolderWrite(out, filename, mode);
  }

  if (pendingWrite && folder.folderName) {
    return (
      <WriteTargetDialog
        folderName={folder.folderName}
        existing={pendingWrite.existing}
        onChoose={(mode, remember) => void handleDialogChoose(mode, remember)}
        onCancel={() => setPendingWrite(null)}
      />
    );
  }

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>CONVERT</h4>
      <p className="ps-sub" style={{ marginTop: 0 }}>
        Save this sample as any other generation -- audio is preserved exactly.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {targets.map((g) => (
          <button
            key={g.code}
            className="on-btn on-btn--secondary"
            onClick={() => void convert(g.code)}
            title={g.experimental ? 'Experimental -- not yet hardware-validated' : undefined}
          >
            Convert to {g.label}{g.experimental ? ' -- experimental' : ''}
          </button>
        ))}
      </div>
      {status.kind === 'done' && (
        <>
          <p className="ps-sub" style={{ margin: '10px 0 0', color: 'var(--ink)' }}>&#x2713; {status.msg}</p>
          {status.warnings.length > 0 && (
            <ul className="ps-sub" style={{ margin: '4px 0 0' }}>
              {status.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </>
      )}
      {status.kind === 'error' && (
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>{"Couldn't convert:"} {status.msg}</p>
      )}
    </div>
  );
}
