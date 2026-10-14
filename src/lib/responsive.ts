import { useEffect, useState } from 'react';

/**
 * Width (px) at/above which the Library shows master + detail side by side.
 * Mirrored in tokens.css as `--bp-split`; keep the two in sync. CSS media
 * queries cannot read a custom property, so this constant is the JS-side source.
 */
export const BP_SPLIT = 900;

/** Width (px) below which a screen takes its phone layout (Tailwind's `md`). */
export const BP_PHONE = 768;

/** True when the viewport is wide enough for the two-pane split layout. */
export function useSplitLayout(): boolean {
  return useMedia(`(min-width: ${BP_SPLIT}px)`);
}

/** True on a phone-width viewport. False where the width can't be read, so the full layout shows. */
export function useNarrow(): boolean {
  return useMedia(`(max-width: ${BP_PHONE - 1}px)`);
}

function useMedia(query: string): boolean {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [matches, setMatches] = useState(() => (supported ? window.matchMedia(query).matches : false));

  useEffect(() => {
    if (!supported) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query, supported]);

  return matches;
}
