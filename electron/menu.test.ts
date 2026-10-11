import { describe, expect, it, vi } from 'vitest';
import { buildMenuTemplate, type MenuTemplateItem } from './menu';

const find = (items: MenuTemplateItem[], label: string): MenuTemplateItem | undefined =>
  items.flatMap((i) => [i, ...(i.submenu ?? [])]).find((i) => i.label === label);

describe('buildMenuTemplate', () => {
  it('puts Check for Updates in the app menu on macOS, right under About', () => {
    const template = buildMenuTemplate({ mac: true, appName: 'OpenNord', onCheckForUpdates: () => {} });
    expect(template[0].label).toBe('OpenNord');
    expect(template[0].submenu?.[0].role).toBe('about');
    expect(template[0].submenu?.[1].label).toBe('Check for Updates…');
  });

  it('puts it in Help elsewhere, and has no app menu', () => {
    const template = buildMenuTemplate({ mac: false, appName: 'OpenNord', onCheckForUpdates: () => {} });
    expect(template[0].role).toBe('fileMenu');
    const help = template.find((i) => i.role === 'help');
    expect(help?.submenu?.[0].label).toBe('Check for Updates…');
  });

  it('runs the check when the item is clicked', () => {
    const onCheckForUpdates = vi.fn();
    for (const mac of [true, false]) {
      find(buildMenuTemplate({ mac, appName: 'OpenNord', onCheckForUpdates }), 'Check for Updates…')?.click?.();
    }
    expect(onCheckForUpdates).toHaveBeenCalledTimes(2);
  });

  it('keeps the standard edit, view and window menus (copy/paste, reload, zoom)', () => {
    for (const mac of [true, false]) {
      const roles = buildMenuTemplate({ mac, appName: 'OpenNord', onCheckForUpdates: () => {} }).map((i) => i.role);
      expect(roles).toEqual(expect.arrayContaining(['editMenu', 'viewMenu', 'windowMenu']));
    }
  });
});
