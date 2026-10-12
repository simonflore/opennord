import { anyDialogOpen } from '../ui';

/**
 * Whether a keydown is free for a page shortcut (J/K, F, Esc on the program
 * page): not already handled, no modifier held, not a key repeat or an IME
 * composition, not typed into a field, and no dialog over the page. One copy,
 * so the shortcuts can't disagree about when they're live.
 */
export function plainShortcut(ev: KeyboardEvent): boolean {
  if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey || ev.repeat || ev.isComposing) return false;
  const t = ev.target;
  const typing = t instanceof HTMLElement && (t.isContentEditable || !!t.closest('input, textarea, select'));
  return !typing && !anyDialogOpen();
}
