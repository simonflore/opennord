import { useEffect, useState } from 'react';
import { Button, Card, ConfirmDialog, SectionLabel } from '@/components/ui';
import { EmptyNote } from '@/components/library/EmptyNote';
import { deleteProject, listProjects, loadProject } from '@/lib/library/sampleProjectStore';
import { TARGETS } from '@/lib/sample-build/targets';
import { plural } from '@/lib/plural';
import type { SampleProject } from '@/lib/sample-build/model';

type Row = Awaited<ReturnType<typeof listProjects>>[number];

/** Your builds, newest first: open one, delete one, or start a new one (spec §7). `problem` is why opening a file failed. */
export function BuildList({ onOpen, onNew, onOpenFile, problem }: {
  onOpen: (id: string) => void; onNew: () => void; onOpenFile: () => void; problem?: string;
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
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={onOpenFile}>Open a project file…</Button>
          <Button variant="primary" onClick={onNew}>New build</Button>
        </div>
      </div>
      {problem && <p role="alert" className="text-sm text-warn">{problem}</p>}
      {rows === null ? <EmptyNote>Loading your builds…</EmptyNote>
        : rows.length === 0 ? <EmptyNote>No builds yet. Start one from your own recordings.</EmptyNote>
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
