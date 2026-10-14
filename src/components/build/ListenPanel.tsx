import { useEffect, useState } from 'react';
import { SectionLabel } from '@/components/ui';
import { SampleListen } from '@/components/sample/SampleListen';
import { PianoListen } from '@/components/piano/PianoListen';
import { buildProject, type BuildResult } from '@/lib/sample-build/build';
import type { SampleProject } from '@/lib/sample-build/model';
import type { ReadAudio } from '@/lib/sample-build/render';
import { getErrorMessage } from '@/lib/errors';

const DELAY_MS = 400;

type Built = { file: BuildResult } | { error: string } | null;
/** A finished build and the project it was built from. */
export interface LastBuild { project: SampleProject; file: BuildResult }

/**
 * Play the build as the Nord will (spec §7): the real file, rebuilt after each pause in editing.
 * `onBuilt` hears of each finished file, so Save can reuse it while the project is unchanged.
 */
export function ListenPanel({ project, read, onBuilt }: { project: SampleProject; read: ReadAudio; onBuilt?: (b: LastBuild) => void }) {
  const [built, setBuilt] = useState<Built>(null);
  useEffect(() => {
    if (!project.zones.length) { setBuilt(null); return; }
    // buildProject is synchronous, so a finished build is always for the latest project:
    // a newer change clears this timer before it can fire.
    const t = setTimeout(() => {
      let file: BuildResult;
      try { file = buildProject(project, read); } catch (e) { setBuilt({ error: getErrorMessage(e) }); return; }
      setBuilt({ file });
      onBuilt?.({ project, file });
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [project, read, onBuilt]);

  return (
    <section aria-label="Listen" className="flex flex-col gap-2 rounded-lg border border-line bg-surface-2 p-4">
      <SectionLabel>Listen</SectionLabel>
      {!built ? <p className="text-sm text-muted">Add recordings to listen.</p>
        : 'error' in built ? <p className="text-sm text-warn">Fix this to listen: {built.error}</p>
        : built.file.extension === '.npno' ? <PianoListen bytes={built.file.bytes} />
        : <SampleListen bytes={built.file.bytes} name={built.file.fileName} />}
    </section>
  );
}
