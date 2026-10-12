/**
 * Remembers the window's size, position and maximized state between launches,
 * in a small JSON file under the app's userData folder. Never throws: a window
 * that opens at the default size is always better than one that fails to open.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { usableBounds, type Bounds } from './shell-policy';

export interface WindowState {
  bounds: Bounds;
  maximized: boolean;
}

/** Saved state, with bounds only if they are still on a connected display. */
export function loadWindowState(file: string, displays: Bounds[]): { bounds: Bounds | null; maximized: boolean } {
  try {
    const saved = JSON.parse(readFileSync(file, 'utf8')) as { bounds?: unknown; maximized?: unknown };
    return { bounds: usableBounds(saved.bounds, displays), maximized: saved.maximized === true };
  } catch {
    return { bounds: null, maximized: false };
  }
}

export function saveWindowState(file: string, state: WindowState): void {
  try {
    writeFileSync(file, JSON.stringify(state));
  } catch {
    /* not worth interrupting anyone for */
  }
}
