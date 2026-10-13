// Puts the page a desktop pack will carry into dist/, and checks the packed
// result. The decisions are in desktop-page-rules.mjs; this file only touches
// the disk. Both `electron:pack` scripts run it around electron-builder.
//
//   node scripts/desktop-page.mjs stage
//       No OPENNORD_DESKTOP_PAGE: builds this package's own page
//       (`npm run build:electron`) — the open app.
//       With it: checks that directory and copies it into dist/ instead.
//   node scripts/desktop-page.mjs verify
//       With OPENNORD_DESKTOP_PAGE: checks every app under release/ really
//       carries that page. Without it: nothing to check.
//
// electron-builder packs dist/ either way (`build.files`), and the shell loads
// dist/index.html (electron/main.ts), so neither needs to know which page it is.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_DIR_ENV, packedProblems, pagePlan, pageProblems } from './desktop-page-rules.mjs';

const core = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(core, 'dist');
const [command] = process.argv.slice(2);

function fatal(message) {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

function refuse(problems) {
  fatal(`the desktop page was refused:\n${problems.map((p) => `  • ${p}`).join('\n')}`);
}

/** Every file under `dir`, as paths relative to it with forward slashes. */
function filesUnder(dir, base = dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) filesUnder(path, base, found);
    else found.push(relative(base, path).split('\\').join('/'));
  }
  return found;
}

function stage(plan) {
  if (plan.kind === 'own') {
    console.log(`desktop page: building this package's own page (the open app; ${PAGE_DIR_ENV} is not set)`);
    execSync('npm run build:electron', { cwd: core, stdio: 'inherit' });
    return;
  }
  const dir = resolve(plan.dir);
  if (!existsSync(dir)) fatal(`${PAGE_DIR_ENV} points at ${dir}, which does not exist — build the page first.`);
  // Text only: the check is for strings, and the images and fonts cannot hold them.
  const files = filesUnder(dir)
    .filter((name) => /\.(html|js|mjs|css|json|map)$/.test(name))
    .map((name) => ({ name, text: readFileSync(join(dir, name), 'utf8') }));
  const problems = pageProblems({ files, apiUrl: plan.apiUrl });
  if (problems.length > 0) refuse(problems);
  rmSync(dist, { recursive: true, force: true });
  cpSync(dir, dist, { recursive: true });
  console.log(`desktop page: packing the page from ${dir} (carries ${plan.apiUrl}, no sign-in) — OK`);
}

/** Every folder under release/ holding a packed app's archives (`*.asar`). */
function packedApps(dir, found = []) {
  if (!existsSync(dir)) return found;
  const entries = readdirSync(dir, { withFileTypes: true });
  const archives = entries.filter((e) => e.isFile() && e.name.endsWith('.asar')).map((e) => e.name);
  if (archives.length > 0) found.push({ dir, archives });
  for (const entry of entries) {
    // Unpacked native modules sit beside the archive; the page is never in there.
    if (entry.isDirectory() && !entry.name.endsWith('.asar.unpacked')) packedApps(join(dir, entry.name), found);
  }
  return found;
}

function verify(plan) {
  if (plan.kind === 'own') {
    console.log('desktop page: the open app was packed — no handed-in page to check');
    return;
  }
  // An archive stores its files as they are, so the page's text can be searched in place.
  const apps = packedApps(join(core, 'release')).map((app) => ({
    dir: relative(core, app.dir),
    archives: app.archives.map((name) => {
      const bytes = readFileSync(join(app.dir, name));
      return { contains: (needle) => bytes.includes(needle) };
    }),
  }));
  const problems = packedProblems({ apps, apiUrl: plan.apiUrl });
  if (problems.length > 0) refuse(problems);
  for (const app of apps) console.log(`desktop page: ${app.dir} carries ${plan.apiUrl} and no sign-in — OK`);
}

const plan = pagePlan(process.env);
if (command === 'stage') stage(plan);
else if (command === 'verify') verify(plan);
else fatal('usage: desktop-page.mjs <stage|verify>');
