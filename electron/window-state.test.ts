import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadWindowState, saveWindowState } from './window-state';

const display = [{ x: 0, y: 0, width: 1512, height: 944 }];
const file = () => join(mkdtempSync(join(tmpdir(), 'opennord-window-')), 'window-state.json');

describe('window state', () => {
  it('round-trips bounds and the maximized flag', () => {
    const f = file();
    saveWindowState(f, { bounds: { x: 40, y: 60, width: 1300, height: 800 }, maximized: true });
    expect(loadWindowState(f, display)).toEqual({ bounds: { x: 40, y: 60, width: 1300, height: 800 }, maximized: true });
  });
  it('falls back to defaults when there is no file yet', () => {
    expect(loadWindowState(file(), display)).toEqual({ bounds: null, maximized: false });
  });
  it('falls back to defaults when the file is corrupt', () => {
    const f = file();
    writeFileSync(f, '{not json');
    expect(loadWindowState(f, display)).toEqual({ bounds: null, maximized: false });
  });
  it('drops bounds from a display that is gone but keeps the maximized flag', () => {
    const f = file();
    saveWindowState(f, { bounds: { x: 3000, y: 0, width: 1300, height: 800 }, maximized: true });
    expect(loadWindowState(f, display)).toEqual({ bounds: null, maximized: true });
  });
  it('does not throw when the folder cannot be written', () => {
    expect(() => saveWindowState('/nonexistent-dir/window-state.json', { bounds: { x: 0, y: 0, width: 900, height: 700 }, maximized: false })).not.toThrow();
  });
  it('writes plain JSON a person can read', () => {
    const f = file();
    saveWindowState(f, { bounds: { x: 1, y: 2, width: 900, height: 700 }, maximized: false });
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ bounds: { x: 1, y: 2, width: 900, height: 700 }, maximized: false });
  });
});
