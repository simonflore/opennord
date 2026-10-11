import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';

/**
 * Back to the bare list when the open entry goes away (removed here, or gone
 * with its Nord), instead of keeping its route and calling it "not in your
 * library". Only an entry that was shown counts: a deep link whose entry hasn't
 * loaded yet stays put. Replaces the history entry, so Back doesn't return to it.
 */
export function useLeaveRemoved(selectedId: string | undefined, known: boolean, list: '/library/presets' | '/library/samples' | '/library/pianos') {
  const navigate = useNavigate();
  const shown = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (known) shown.current = selectedId;
    else if (selectedId && shown.current === selectedId) {
      shown.current = undefined;
      void navigate({ to: list, replace: true });
    }
  }, [selectedId, known, list, navigate]);
}
