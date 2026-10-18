import { useState } from 'react';
import { createRoute, useNavigate, useParams, useRouterState } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { BuildList } from '@/components/build/BuildList';
import { BuildScreen } from '@/components/build/BuildScreen';
import { createProject } from '@/lib/library/useSampleProject';
import { saveClipAudio, saveProject } from '@/lib/library/sampleProjectStore';
import { readOnsample } from '@/lib/sample-build/onsample';
import { pickFile, pickFolderFiles } from '@/lib/pick-file';
import { importSfz, isSfz, type PickedFile } from '@/lib/library/importSfz';
import { decodeWithBrowser } from '@/lib/sample-build/browser-decode';
import { Button, Dialog } from '@/components/ui';
import { readFileBytes } from '@/lib/file';
import { getErrorMessage } from '@/lib/errors';

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** What an SFZ import brought over and left out, for the build it opened; gone once dismissed. */
    importNotes?: string[];
  }
}

/** Build a sample from your own recordings (spec §7): the list of builds, or one open build. */
export const BuildSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/samples/build/{-$projectId}',
  component: BuildSampleScreen,
});

function BuildSampleScreen() {
  const { projectId } = useParams({ from: BuildSampleRoute.id });
  const navigate = useNavigate();
  const [problem, setProblem] = useState(''); // why a project file couldn't be opened
  const open = (id: string, importNotes?: string[]) =>
    void navigate({ to: '/library/samples/build/{-$projectId}', params: { projectId: id }, state: importNotes && { importNotes } });
  const importNotes = useRouterState({ select: (s) => s.location.state.importNotes });
  // A folder with several instruments asks which to import.
  const [choice, setChoice] = useState<PickedFile[] | null>(null);
  const [importing, setImporting] = useState(false);

  async function importFolder() {
    let files: PickedFile[] | null;
    try { files = await pickFolderFiles(); } catch (e) { setProblem(getErrorMessage(e)); return; }
    if (!files) return;
    setProblem('');
    const sfzs = files.filter((f) => isSfz(f.path));
    if (!sfzs.length) setProblem('There’s no .sfz file in that folder. Pick the folder the instrument came in.');
    else if (sfzs.length === 1) await runImport(sfzs[0], files);
    else setChoice(files);
  }

  async function runImport(sfz: PickedFile, files: PickedFile[]) {
    setChoice(null);
    setImporting(true);
    try {
      const r = await importSfz(sfz, files, decodeWithBrowser);
      open(r.projectId, r.notes);
    } catch (e) {
      setProblem(getErrorMessage(e));
    } finally {
      setImporting(false);
    }
  }

  async function openFile() {
    const f = await pickFile('.onsample');
    if (!f) return;
    setProblem('');
    try {
      const { project, audio } = readOnsample(await readFileBytes(f));
      for (const [ref, a] of audio) await saveClipAudio(ref, a);
      await saveProject(project);
      open(project.id);
    } catch (e) {
      setProblem(getErrorMessage(e));
    }
  }

  if (projectId) {
    // An import's notes ride on the visit that opened the build: dismissing them replaces it
    // without them, and opening the build again from the list starts without them.
    return <BuildScreen key={projectId} projectId={projectId} importNotes={importNotes}
      onDismissNotes={() => void navigate({ to: '/library/samples/build/{-$projectId}', params: { projectId }, replace: true, state: {} })}
      onClose={() => void navigate({ to: '/library/samples/build/{-$projectId}', params: { projectId: undefined } })} />;
  }
  return (
    <>
      <BuildList onOpen={(id) => open(id)} onNew={() => void createProject('New sample').then((id) => open(id))} onOpenFile={() => void openFile()}
        onImportSfz={() => void importFolder()} importing={importing} problem={problem} />
      <Dialog open={!!choice} onClose={() => setChoice(null)} title="Which instrument?">
        <p className="m-0 mb-3 text-sm text-dim">This folder holds several. Pick the one to import.</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {choice?.filter((f) => isSfz(f.path)).map((s) => (
            <li key={s.path}>
              <Button variant="secondary" className="min-h-11 w-full justify-start" onClick={() => void runImport(s, choice)}>
                {s.path.split('/').slice(1).join('/') || s.path}
              </Button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
