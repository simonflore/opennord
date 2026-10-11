/**
 * Runtime platform detection. One source of truth for transport selection and
 * the `data-native` root flag. (Pattern ported from the vitronitor starter.)
 *
 *   - Capacitor native: window.Capacitor?.isNativePlatform() === true
 *   - Web:              otherwise
 */
interface CapacitorWindow {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => 'web' | 'ios' | 'android';
  };
}

export function isCapacitorPlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as unknown as CapacitorWindow).Capacitor?.isNativePlatform?.() === true;
}

export function getCapacitorPlatform(): 'web' | 'ios' | 'android' {
  if (typeof window === 'undefined') return 'web';
  return ((window as unknown as CapacitorWindow).Capacitor?.getPlatform?.() ?? 'web') as
    | 'web'
    | 'ios'
    | 'android';
}

/**
 * True when the iPad app is running on a Mac ("Designed for iPad"). There it
 * sits in a normal window under a title bar: no status bar to clear, though the
 * web view still reports a top safe-area inset the height of that title bar.
 * A Mac has no touch points; every iPad reports five.
 */
export function isIpadAppOnMac(): boolean {
  return isCapacitorPlatform() && typeof navigator !== 'undefined' && navigator.maxTouchPoints === 0;
}

export function isWebPlatform(): boolean {
  return !isCapacitorPlatform();
}

/** Apple keyboards: ⌘ is the shortcut modifier, and Ctrl+letter edits text. */
export const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
