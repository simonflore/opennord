import { useRef, useState, type ReactNode } from 'react';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { useFolderWrite } from '../../lib/folder/useFolderWrite';
import { WriteTargetDialog } from '../ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'done'; msg: string; warnings: string[] }
  | { kind: 'error'; msg: string };

/**
 * Save a converted sample or piano: into the linked folder when there is one, else as a
 * download, and say how it went. `dialog` (the folder's "new file or overwrite" question)
 * takes the caller's place while it is open; `report` is the outcome, shown below its buttons.
 * `failLabel` starts what `fail` reports; `clear` empties the report before a new attempt.
 */
export function useSaveBytes({ failLabel = "Couldn't convert" }: { failLabel?: string } = {}) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  // The file being saved, for whichever way the save ends; dropped once it has.
  const pendingRef = useRef<{ out: Uint8Array; filename: string; warnings: string[] } | null>(null);

  const folderWrite = useFolderWrite({
    prefScope: 'sample',
    onSaved: (path, folderName, also) => {
      const more = also.length ? ` and ${also.join(', ')}` : '';
      setStatus({ kind: 'done', msg: `Saved to ${folderName}/${path}${more}`, warnings: pendingRef.current?.warnings ?? [] });
      pendingRef.current = null;
    },
    onFallback: () => {
      const p = pendingRef.current;
      if (p) {
        downloadBytes(p.out, p.filename);
        setStatus({ kind: 'done', msg: `Saved ${p.filename}`, warnings: p.warnings });
      }
      pendingRef.current = null;
    },
  });

  const writer = (bytes: Uint8Array) => async (w: FileSystemWritableFileStream) => {
    await w.write(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  };

  /** `also`: companion files written next to it in the linked folder; without a folder only the main file downloads. */
  async function save(out: Uint8Array, filename: string, existing: boolean, warnings: string[], also?: { out: Uint8Array; filename: string }[]) {
    pendingRef.current = { out, filename, warnings };
    await folderWrite.save({
      name: filename, existing, write: writer(out),
      also: also?.map((a) => ({ name: a.filename, write: writer(a.out) })),
    });
  }

  const fail = (e: unknown) => setStatus({ kind: 'error', msg: getErrorMessage(e) });
  const clear = () => setStatus({ kind: 'idle' });

  const dialog: ReactNode = folderWrite.dialogProps && (
    <WriteTargetDialog
      {...folderWrite.dialogProps}
      onChoose={(mode, remember) => void folderWrite.dialogProps!.onChoose(mode, remember)}
    />
  );

  const report = (
    <>
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
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>{failLabel}: {status.msg}</p>
      )}
      {folderWrite.error && (
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>{"Couldn't save:"} {folderWrite.error}</p>
      )}
    </>
  );

  return { save, fail, clear, saving: folderWrite.saving, dialog, report };
}
