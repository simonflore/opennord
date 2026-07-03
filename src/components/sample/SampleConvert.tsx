import { useRef, useState } from 'react';
import type { NsmpFile } from '../../lib/ns4/nsmp';
import { convertNsmp, type TargetCodec } from '../../lib/ns4/nsmp-convert';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { useFolder } from '../../lib/folder/FolderContext';
import { useFolderWrite } from '../../lib/folder/useFolderWrite';
import { WriteTargetDialog } from '../ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'done'; msg: string; warnings: string[] }
  | { kind: 'error'; msg: string };

/**
 * Every Nord Sample generation OpenNord can write, newest first. Labels match
 * Nord's own Sample Editor export names ("NSMP 2/3/4"); the `code` is the
 * `convertNsmp` target (2 = `.nsmp`, 3 = `.nsmp3`, 4 = `.nsmp4`). Listing all three
 * lets the UI offer any generation as a target, so a loaded sample can be converted
 * from *any* generation to *any other* -- including the downconverts the official
 * editor refuses (`.nsmp4`/`.nsmp3` -> `.nsmp`).
 */
const GENERATIONS: { code: TargetCodec; ext: string; label: string; experimental?: boolean }[] = [
  { code: 4, ext: '.nsmp4', label: 'NSMP 4 (.nsmp4)' },
  { code: 3, ext: '.nsmp3', label: 'NSMP 3 (.nsmp3)' },
  { code: 2, ext: '.nsmp', label: 'NSMP 2 (.nsmp)', experimental: true },
];

/** Which generation a loaded file is, as a {@link GENERATIONS} code (`.nsmp` -> 2). */
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
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Keep a ref to the latest pending output so onFallback can always access it.
  const pendingRef = useRef<{ out: Uint8Array; filename: string } | null>(null);

  const folderWrite = useFolderWrite({
    onSaved: (path, folderName) =>
      setStatus({ kind: 'done', msg: `Saved to ${folderName}/${path}`, warnings: [] }),
    onFallback: () => {
      const p = pendingRef.current;
      if (p) {
        downloadBytes(p.out, p.filename);
        setStatus({ kind: 'done', msg: `Saved ${p.filename}`, warnings: [] });
      }
    },
  });

  const source = sourceGeneration(file);
  const targets = GENERATIONS.filter((g) => g.code !== source);
  if (targets.length === 0) return null;

  async function convert(target: TargetCodec) {
    try {
      const { bytes: out, extension, warnings } = convertNsmp(bytes, target);
      const filename = `${file.name?.trim() || name?.trim() || 'sample'}${extension}`;

      // Capture output so onFallback can access it when writeBack returns 'download'
      // or when there is no folder linked.
      pendingRef.current = { out, filename };

      const existing = folder.result.samples.some((s) => s.name === filename);
      await folderWrite.save({ name: filename, existing, write: async (w) => {
        await w.write(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer);
      } });

      // If we fell back via onFallback (no folder), warnings came from convertNsmp; surface them.
      if (!folder.folderName) {
        setStatus((s) => s.kind === 'done' ? { ...s, warnings } : s);
      }
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    }
  }

  if (folderWrite.dialogProps) {
    return (
      <WriteTargetDialog
        {...folderWrite.dialogProps}
        onChoose={(mode, remember) => void folderWrite.dialogProps!.onChoose(mode, remember)}
        onCancel={folderWrite.dialogProps.onCancel}
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
            disabled={folderWrite.saving}
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
      {folderWrite.error && (
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>{"Couldn't save:"} {folderWrite.error}</p>
      )}
    </div>
  );
}
