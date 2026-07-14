import { useEffect, useState } from 'react';

/**
 * Width (px) at/above which the Library shows master + detail side by side.
 * Mirrored in tokens.css as `--bp-split`; keep the two in sync. CSS media
 * queries cannot read a custom property, so this constant is the JS-side source.
 */
export const BP_SPLIT = 900;

/** True when the viewport is wide enough for the two-pane split layout. */
export function useSplitLayout(): boolean {
  const query = `(min-width: ${BP_SPLIT}px)`;
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [wide, setWide] = useState(() => (supported ? window.matchMedia(query).matches : false));

  useEffect(() => {
    if (!supported) return;
    const mql = window.matchMedia(query);
    const onChange = () => setWide(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query, supported]);

  return wide;
}
