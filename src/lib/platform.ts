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

export function isWebPlatform(): boolean {
  return !isCapacitorPlatform();
}
