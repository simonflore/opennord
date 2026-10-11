import type { useNavigate } from '@tanstack/react-router';
import type { LibraryEntry } from '../../lib/library/types';

type Navigate = ReturnType<typeof useNavigate>;

/**
 * Open a library program: its own page when it has been read, otherwise the
 * Device page (a Nord slot that hasn't been pulled yet).
 */
export function openProgram(navigate: Navigate, e: LibraryEntry) {
  if (e.program) navigate({ to: '/library/programs/{-$programId}', params: { programId: e.id } });
  else navigate({ to: '/device' });
}

/** Open a preset, sample or piano on its list's route. The lists and the ⌘K palette share these. */
export const openPreset = (navigate: Navigate, id: string) =>
  navigate({ to: '/library/presets/{-$presetId}', params: { presetId: id } });
export const openSample = (navigate: Navigate, id: string) =>
  navigate({ to: '/library/samples/{-$sampleId}', params: { sampleId: id } });
export const openPiano = (navigate: Navigate, id: string) =>
  navigate({ to: '/library/pianos/{-$pianoId}', params: { pianoId: id } });
