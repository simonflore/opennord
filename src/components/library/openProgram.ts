import type { useNavigate } from '@tanstack/react-router';
import type { LibraryEntry } from '../../lib/library/types';

/**
 * Open a library program: its own page when it has been read, otherwise the
 * Device page (a Nord slot that hasn't been pulled yet). The library list and
 * the ⌘K palette both open programs this way.
 */
export function openProgram(navigate: ReturnType<typeof useNavigate>, e: LibraryEntry) {
  if (e.program) navigate({ to: '/library/programs/{-$programId}', params: { programId: e.id } });
  else navigate({ to: '/device' });
}
