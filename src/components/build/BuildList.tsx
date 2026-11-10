import { useEffect, useState } from 'react';
import { Button, Card, ConfirmDialog, Menu, MenuItem, SectionLabel } from '@/components/ui';
import { EmptyNote } from '@/components/library/EmptyNote';
import { deleteProject, listProjects, loadProject } from '@/lib/library/sampleProjectStore';
import { TARGETS } from '@/lib/sample-build/targets';
import { plural } from '@/lib/plural';
import type { SampleProject } from '@/lib/sample-build/model';

type Row = Awaited<ReturnType<typeof listProjects>>[number];

/**
 * Your builds, newest first: open one, delete one, or start one (spec §7). Every way to start
 * is in one menu, **New build**: from recordings, a sample file, an SFZ instrument, a Nord Sample
 * Editor project, or a saved build. `problem` is why opening something failed.
 */
export function BuildList({ onOpen, onNew, onOpenFile, onOpenSampleFile, onImportSfz, onImportNsmpproj, importing = false, problem }: {
  onOpen: (id: string) => void; onNew: () => void;
  /** Open a saved build (`.onsample`). */
  onOpenFile: () => void;
  /** Start from a sample file of your own (`.nsmp`, `.nsmp3`, `.nsmp4`). */
  onOpenSampleFile?: () => void;
  /** Start from an SFZ instrument's folder; `importing` while it reads. */
  onImportSfz?: () => void; importing?: boolean;
  /** Start from a Nord Sample Editor project's folder (the project and its recordings). */
  onImportNsmpproj?: () => void;
  problem?: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [deleting, setDeleting] = useState<SampleProject | null>(null);
  const refresh = () => void listProjects().then(setRows).catch(() => setRows([]));
  useEffect(refresh, []);

  async function ask(id: string) {
    const p = await loadProject(id);
    if (p) setDeleting(p);
  }

  async function remove(p: SampleProject) {
    setDeleting(null);
    await deleteProject(p);
    refresh();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <SectionLabel>Your builds</SectionLabel>
        <div className="ml-auto">
          <Menu label="New build" trigger={<Button variant="primary" disabled={importing}>{importing ? 'Opening…' : 'New build ▾'}</Button>}>
            <MenuItem onSelect={onNew} hint="Add or record your own audio">From recordings</MenuItem>
            {onOpenSampleFile && <MenuItem onSelect={onOpenSampleFile} hint="A sample of your own, to rework. In User Samples: More › Open in Build a sample">From a sample file…</MenuItem>}
            {onImportSfz && <MenuItem onSelect={onImportSfz} hint="Pick the instrument’s folder">From an SFZ instrument…</MenuItem>}
            {onImportNsmpproj && <MenuItem onSelect={onImportNsmpproj} hint="Pick the folder with the project and its recordings">From a Nord Sample Editor project…</MenuItem>}
            <MenuItem onSelect={onOpenFile} hint="A build saved as a project file (.onsample)">Open a saved build…</MenuItem>
          </Menu>
        </div>
      </div>
      {problem && <p role="alert" className="text-sm text-warn">{problem}</p>}
      {rows === null ? <EmptyNote>Loading your builds…</EmptyNote>
        : rows.length === 0 ? <EmptyNote>No builds yet. Start one with New build.</EmptyNote>
        : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className="flex items-center gap-3 p-3">
                  <button type="button" className="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center text-left" onClick={() => onOpen(r.id)}>
                    <span className="max-w-full truncate font-medium">{r.name}</span>
                    <span className="font-mono text-xs text-muted">{TARGETS[r.target].label} · {plural(r.zones, 'zone')}</span>
                  </button>
                  <Button variant="secondary" className="min-h-11" onClick={() => void ask(r.id)} aria-label={`Delete ${r.name}`}>Delete</Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      {deleting && (
        <ConfirmDialog title={`Delete the build “${deleting.name}”?`} confirmLabel="Delete build"
          onCancel={() => setDeleting(null)} onConfirm={() => void remove(deleting)}>
          Its recordings go too. Samples you saved from it stay.
        </ConfirmDialog>
      )}
    </div>
  );
}
