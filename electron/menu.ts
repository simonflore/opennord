/**
 * The application menu, as plain data (no Electron import, so it is tested
 * directly). It is Electron's default menu rebuilt from roles, plus one item:
 * "Check for Updates…". Rebuilding rather than patching the default keeps the
 * result the same on every platform and drops the default Help links to
 * electronjs.org. A designed menu is a later job.
 */
export interface MenuTemplateItem {
  label?: string;
  role?: string;
  type?: 'separator';
  click?: () => void;
  submenu?: MenuTemplateItem[];
}

export function buildMenuTemplate(i: { mac: boolean; appName: string; onCheckForUpdates: () => void }): MenuTemplateItem[] {
  const check: MenuTemplateItem = { label: 'Check for Updates…', click: () => i.onCheckForUpdates() };
  const sep: MenuTemplateItem = { type: 'separator' };

  const appMenu: MenuTemplateItem = {
    label: i.appName,
    submenu: [
      { role: 'about' }, check, sep,
      { role: 'services' }, sep,
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, sep,
      { role: 'quit' },
    ],
  };

  return [
    ...(i.mac ? [appMenu] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    { role: 'help', submenu: i.mac ? [] : [check] },
  ];
}
