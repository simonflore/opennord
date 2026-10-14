import { useEffect, useState } from 'react';
import { buildProject, type BuildResult } from '@/lib/sample-build/build';
import type { SampleProject } from '@/lib/sample-build/model';
import type { ReadAudio } from '@/lib/sample-build/render';
import { getErrorMessage } from '@/lib/errors';

const DELAY_MS = 400;

/** The file the Nord will get, or why it can't be made yet; null before there is anything to build. */
export type Built = { project: SampleProject; file: BuildResult } | { error: string } | null;

/**
 * The real file for the project, rebuilt after each pause in editing (spec §7), so what you play
 * on the keyboard is what the Nord plays, and Save can reuse it while the project is unchanged.
 */
export function useBuiltFile(project: SampleProject, read: ReadAudio): Built {
  const [built, setBuilt] = useState<Built>(null);
  useEffect(() => {
    if (!project.zones.length) { setBuilt(null); return; }
    // buildProject is synchronous, so a finished build is always for the latest project:
    // a newer change clears this timer before it can fire.
    const t = setTimeout(() => {
      try { setBuilt({ project, file: buildProject(project, read) }); } catch (e) { setBuilt({ error: getErrorMessage(e) }); }
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [project, read]);
  return built;
}

/** A finished build and the project it was built from. */
export type LastBuild = Extract<Built, { file: BuildResult }>;
