import { useRef, useState } from 'react';
import templateUrl from '../../lib/ns4/__fixtures__/regressionTest.ns4p?url';
import { migrateToNs4, type MigrationResult } from '../../lib/migrate/convert';
import { naiveAdvisor } from '../../lib/migrate/advisor';
import type { AvailableSound } from '../../lib/migrate/to-ns4';
import type { MigrationNote, MigrationStatus } from '../../lib/migrate/common';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { useFolder } from '../../lib/folder/FolderContext';
import type { FolderLibrary } from '../../lib/folder/useFolderLibrary';
import { useFolderWrite } from '../../lib/folder/useFolderWrite';
import { Button, Dialog, SectionLabel, WriteTargetDialog } from '../ui';

/**
 * `useFolder()` throws hard outside a `FolderProvider` (by design — every
 * screen in the app is wrapped). This component is exercised by unit tests
 * (ProgramView.test.tsx) that render bare `<ProgramView>` without that
 * provider, same as several other program-view widgets — so read the folder
 * defensively rather than requiring every such test to grow a provider.
 * Safe because a mounted component's provider ancestry never changes across
 * its own re-renders, so this stays a stable, unconditional hook call.
 */
function useFolderSafe(): FolderLibrary | null {
  try {
    return useFolder();
  } catch {
    return null;
  }
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; result: MigrationResult }
  | { kind: 'error'; msg: string };

/** Report groups in display order, keyed by MigrationNote.status, titled in musician language. */
const GROUPS: { status: MigrationStatus; title: string }[] = [
  { status: 'mapped', title: 'Carried over' },
  { status: 'approximated', title: 'Close match' },
  { status: 'defaulted', title: 'Pick on your Stage 4' },
  { status: 'not-migratable', title: "Doesn't carry over" },
];

function groupNotes(notes: MigrationNote[]): Map<MigrationStatus, MigrationNote[]> {
  const map = new Map<MigrationStatus, MigrationNote[]>();
  for (const n of notes) {
    const arr = map.get(n.status) ?? [];
    arr.push(n);
    map.set(n.status, arr);
  }
  return map;
}

/** Pianos/samples visible on the linked folder, as AvailableSound options for the
 *  migration advisor. Folder entries carry no numeric ns4 sound id today, so we
 *  intentionally pass an empty list rather than fabricate one — every sound then
 *  gets an honest "re-pick on your Stage 4" note instead of a wrong match. */
function availableSounds(): AvailableSound[] {
  return [];
}

/** Fetch the template (or use the injected test seam) and run the migration. */
async function runConversion(
  bytes: Uint8Array,
  name: string | undefined,
  templateBytes: Uint8Array | undefined,
): Promise<MigrationResult> {
  const tmpl = templateBytes ?? new Uint8Array(await (await fetch(templateUrl)).arrayBuffer());
  return migrateToNs4(bytes, {
    advisor: naiveAdvisor,
    sounds: availableSounds(),
    sourceName: name,
    templateBytes: tmpl,
  });
}

export interface ConvertToStage4Props {
  bytes: Uint8Array;
  name?: string;
  /** Test seam: inject template bytes directly instead of fetching templateUrl. */
  templateBytes?: Uint8Array;
}

/**
 * "Convert to Stage 4" — lifts a Stage 2/3 program into a Stage 4 `.ns4p` and shows
 * a musician-facing report of what carried over. Rendered above the Stage 2/3
 * program views (ProgramView.tsx); Stage 4 files have nothing to convert.
 *
 * Thin outer shell: probes folder-provider availability once via the same
 * throwing `useFolder()` (wrapped safely), then mounts one of two fixed
 * implementations — this keeps `useFolderWrite()` (which itself calls
 * `useFolder()` unconditionally) from ever being called outside a provider,
 * without touching FolderContext.tsx/useFolderWrite.ts.
 */
export function ConvertToStage4(props: ConvertToStage4Props) {
  const folder = useFolderSafe();
  return folder ? <ConvertToStage4WithFolder {...props} /> : <ConvertToStage4NoFolder {...props} />;
}

/** Save path used outside a linked folder (or no FolderProvider at all): always downloads. */
function ConvertToStage4NoFolder({ bytes, name, templateBytes }: ConvertToStage4Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    setSaveMsg(null);
    setStatus({ kind: 'loading' });
    try {
      const result = await runConversion(bytes, name, templateBytes);
      setStatus({ kind: 'ready', result });
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    }
  }

  function handleSave() {
    if (status.kind !== 'ready') return;
    downloadBytes(status.result.bytes, status.result.suggestedFilename);
    setSaveMsg(`Saved ${status.result.suggestedFilename}`);
  }

  const grouped = status.kind === 'ready' ? groupNotes(status.result.report.notes) : null;
  const globalNotes = status.kind === 'ready' ? status.result.report.globalNotes : [];

  return (
    <>
      <Button variant="secondary" aria-label="Convert to Stage 4" onClick={() => void handleOpen()}>
        Convert to Stage 4
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Converted for Stage 4"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={status.kind !== 'ready'}>Save</Button>
          </>
        }
      >
        <ReportBody status={status} grouped={grouped} globalNotes={globalNotes} saveMsg={saveMsg} saveError={null} />
      </Dialog>
    </>
  );
}

/** Save path used inside a linked FolderProvider — offers the folder-write flow with a download fallback. */
function ConvertToStage4WithFolder({ bytes, name, templateBytes }: ConvertToStage4Props) {
  const folder = useFolder();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const pendingRef = useRef<{ out: Uint8Array; filename: string } | null>(null);

  const folderWrite = useFolderWrite({
    prefScope: 'migrate-ns4',
    onSaved: (path, folderName) => setSaveMsg(`Saved to ${folderName}/${path}`),
    onFallback: () => {
      const p = pendingRef.current;
      if (p) {
        downloadBytes(p.out, p.filename);
        setSaveMsg(`Saved ${p.filename}`);
      }
    },
  });

  async function handleOpen() {
    setOpen(true);
    setSaveMsg(null);
    setStatus({ kind: 'loading' });
    try {
      const result = await runConversion(bytes, name, templateBytes);
      setStatus({ kind: 'ready', result });
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    }
  }

  async function handleSave() {
    if (status.kind !== 'ready') return;
    const { bytes: out, suggestedFilename } = status.result;
    pendingRef.current = { out, filename: suggestedFilename };
    const existing = folder.result.programs.some((p) => p.name === suggestedFilename);
    await folderWrite.save({
      name: suggestedFilename,
      existing,
      write: async (w) => {
        await w.write(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer);
      },
    });
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

  const grouped = status.kind === 'ready' ? groupNotes(status.result.report.notes) : null;
  const globalNotes = status.kind === 'ready' ? status.result.report.globalNotes : [];

  return (
    <>
      <Button
        variant="secondary"
        aria-label="Convert to Stage 4"
        onClick={() => void handleOpen()}
      >
        Convert to Stage 4
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Converted for Stage 4"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => void handleSave()}
              disabled={status.kind !== 'ready' || folderWrite.saving}
            >
              Save
            </Button>
          </>
        }
      >
        <ReportBody status={status} grouped={grouped} globalNotes={globalNotes} saveMsg={saveMsg} saveError={folderWrite.error} />
      </Dialog>
    </>
  );
}

/** Shared dialog body: loading/error state, the four report groups, the save confirmation/error. */
function ReportBody({ status, grouped, globalNotes, saveMsg, saveError }: {
  status: Status;
  grouped: Map<MigrationStatus, MigrationNote[]> | null;
  globalNotes: string[];
  saveMsg: string | null;
  saveError: string | null;
}) {
  return (
    <>
      {status.kind === 'loading' && <p>Converting…</p>}
      {status.kind === 'error' && (
        <p style={{ color: 'var(--warn)' }}>{"Couldn't convert:"} {status.msg}</p>
      )}
      {grouped && (
        <div>
          {GROUPS.map((g) => {
            const notes = grouped.get(g.status);
            if (!notes || notes.length === 0) return null;
            return (
              <div key={g.status} style={{ marginBottom: 16 }}>
                <SectionLabel>{g.title}</SectionLabel>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {notes.map((n, i) => (
                    <li key={`${n.field}-${i}`}>
                      <strong>{n.field}:</strong> {n.note}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {globalNotes.length > 0 && (
            <p style={{ color: 'var(--dim)', marginTop: 12 }}>{globalNotes.join(' ')}</p>
          )}
        </div>
      )}
      {saveMsg && <p style={{ color: 'var(--ink)', marginTop: 12 }}>&#x2713; {saveMsg}</p>}
      {saveError && <p style={{ color: 'var(--warn)', marginTop: 12 }}>{"Couldn't save:"} {saveError}</p>}
    </>
  );
}
