import { useState } from 'react';
import { createRoute, useNavigate, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { BuildList } from '@/components/build/BuildList';
import { BuildScreen } from '@/components/build/BuildScreen';
import { createProject } from '@/lib/library/useSampleProject';
import { saveClipAudio, saveProject } from '@/lib/library/sampleProjectStore';
import { readOnsample } from '@/lib/sample-build/onsample';
import { pickFile } from '@/lib/pick-file';
import { readFileBytes } from '@/lib/file';
import { getErrorMessage } from '@/lib/errors';

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
  const open = (id: string) => void navigate({ to: '/library/samples/build/{-$projectId}', params: { projectId: id } });

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

  if (projectId) return <BuildScreen projectId={projectId} onClose={() => void navigate({ to: '/library/samples/build/{-$projectId}', params: { projectId: undefined } })} />;
  return <BuildList onOpen={open} onNew={() => void createProject('New sample').then(open)} onOpenFile={() => void openFile()} problem={problem} />;
}
