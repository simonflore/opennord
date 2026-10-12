// Renders electron/icon/icon.svg to electron/icon/icon.png (1024 px, with
// transparency) using Electron's own Chromium, so no image library is needed.
// electron-builder turns that PNG into the .icns and .ico at pack time.
//
//   npm run icons        (re-run only when the SVG changes; commit the PNG)
import { app, BrowserWindow } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const core = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(core, 'electron', 'icon');
const SIZE = 1024;
// The icon's legend is set in the app's mono face. Embedded here so the render
// does not depend on which fonts this machine happens to have installed.
const FONT = join(core, 'node_modules', '@fontsource', 'ibm-plex-mono', 'files', 'ibm-plex-mono-latin-700-normal.woff2');

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false, width: SIZE, height: SIZE, frame: false, transparent: true,
    webPreferences: { offscreen: true },
  });
  const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');
  const fontFace = `@font-face { font-family: 'IBM Plex Mono'; font-weight: 700; src: url(data:font/woff2;base64,${readFileSync(FONT).toString('base64')}); }`;
  const page = `<html><head><style>${fontFace}</style></head><body style="margin:0;background:transparent">${svg.replace('<svg', `<svg width="${SIZE}" height="${SIZE}"`)}</body></html>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`);
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => true)');
  const image = (await win.webContents.capturePage()).resize({ width: SIZE, height: SIZE, quality: 'best' });
  writeFileSync(join(dir, 'icon.png'), image.toPNG());
  console.log(`wrote ${join(dir, 'icon.png')} (${image.getSize().width}×${image.getSize().height})`);
  app.quit();
});
