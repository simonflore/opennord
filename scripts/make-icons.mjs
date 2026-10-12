// Renders the icon artwork to PNG with Electron's own Chromium, so no image
// library is needed:
//
//   electron/icon/icon.svg  → electron/icon/icon.png          1024 px, the desktop app icon
//                             (electron-builder makes the .icns and .ico from it at pack time)
//   public/favicon.svg      → public/favicon-32.png           fallback for browsers without SVG favicons
//                           → public/apple-touch-icon.png     180 px, iOS home screen
//
//   npm run icons        (re-run only when an SVG changes; commit the PNGs)
import { app, BrowserWindow } from 'electron';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const core = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The app icon's legend is set in the app's mono face. Embedded here so the render
// does not depend on which fonts this machine happens to have installed.
const FONT = join(core, 'node_modules', '@fontsource', 'ibm-plex-mono', 'files', 'ibm-plex-mono-latin-700-normal.woff2');
const fontFace = `@font-face { font-family: 'IBM Plex Mono'; font-weight: 700; src: url(data:font/woff2;base64,${readFileSync(FONT).toString('base64')}); }`;

const JOBS = [
  { svg: 'electron/icon/icon.svg', png: 'electron/icon/icon.png', size: 1024 },
  { svg: 'public/favicon.svg', png: 'public/favicon-32.png', size: 32 },
  { svg: 'public/favicon.svg', png: 'public/apple-touch-icon.png', size: 180 },
];

/** Draw at 1024 px whatever the target, then scale down: small renders come out crisper than drawing small. */
const CANVAS = 1024;

// One window for every job, each page loaded from a scratch file: a second
// window, or a page passed as a long data: URL, fails to load on Electron 44.
const scratch = mkdtempSync(join(tmpdir(), 'opennord-icons-'));

async function render(win, { svg, png, size }) {
  const source = readFileSync(join(core, svg), 'utf8').replace('<svg', `<svg width="${CANVAS}" height="${CANVAS}"`);
  const page = `<html><head><style>${fontFace}</style></head><body style="margin:0;background:transparent">${source}</body></html>`;
  const file = join(scratch, 'page.html');
  writeFileSync(file, page);
  await win.loadFile(file);
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))))');
  const image = (await win.webContents.capturePage()).resize({ width: size, height: size, quality: 'best' });
  writeFileSync(join(core, png), image.toPNG());
  console.log(`wrote ${png} (${image.getSize().width}×${image.getSize().height})`);
}

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false, width: CANVAS, height: CANVAS, frame: false, transparent: true,
    webPreferences: { offscreen: true },
  });
  try {
    for (const job of JOBS) await render(win, job);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
  rmSync(scratch, { recursive: true, force: true });
  app.quit();
});
