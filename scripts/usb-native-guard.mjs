// Guards the one mistake that has shipped a broken Windows build twice.
//
// node-usb is N-API + prebuildify: it carries `prebuilds/<platform>-<arch>/` for
// every target and must never be rebuilt. A local `electron-rebuild` (or any
// node-gyp run) writes `node_modules/usb/build/Release/usb_bindings.node` for the
// HOST, and node-gyp-build resolves `build/Release/*.node` BEFORE `prebuilds/` —
// so that one file wins on every platform. Packed from a Mac it is a Mach-O
// binary, and Windows dies at startup, before any of our code runs, with
// "usb_bindings.node is not a valid Win32 application".
//
//   node scripts/usb-native-guard.mjs clean
//       Deletes node_modules/usb/build AND release/. Run before packing.
//   node scripts/usb-native-guard.mjs verify [--target <platform>-<arch>]
//       Fails the pack if any app under release/ still carries usb/build, or is
//       missing the target's prebuild. Defaults to the host tuple.
//
// `clean` empties release/ so that `verify` can only ever see output from the
// run that just happened. Without that, an app.asar.unpacked left by an earlier
// local pack is indistinguishable from a fresh one — and since node-usb ships
// prebuilds for every platform, a stale tree satisfies any --target. A new pack
// that omitted `usb` entirely would produce no unpacked dir at all, leaving the
// stale one as the only thing scanned, and it would pass. Note the consequence:
// packing one target discards the other target's output.
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const core = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [command, ...rest] = process.argv.slice(2);

function fatal(message) {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

function clean() {
  const build = join(core, 'node_modules', 'usb', 'build');
  if (existsSync(build)) {
    rmSync(build, { recursive: true, force: true });
    console.log('usb native guard: removed node_modules/usb/build (a rebuild artifact — never ship it)');
  } else {
    console.log('usb native guard: no node_modules/usb/build — prebuilds will be used');
  }

  const release = join(core, 'release');
  if (existsSync(release)) {
    // Retries: on macOS, Finder can drop a .DS_Store into the folder mid-delete,
    // which fails the removal with ENOTEMPTY.
    rmSync(release, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log('usb native guard: emptied release/ so verify can only see this run’s output');
  }
}

/** Every app.asar.unpacked under release/ — one per packed platform/arch. */
function packedApps(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'app.asar.unpacked') found.push(join(dir, entry.name));
    else packedApps(join(dir, entry.name), found);
  }
  return found;
}

/** `darwin-x64+arm64` → { platform: 'darwin', arches: ['x64', 'arm64'] } */
function parseTuple(name) {
  const dash = name.indexOf('-');
  return { platform: name.slice(0, dash), arches: name.slice(dash + 1).split('+') };
}

function verify() {
  const flag = rest.indexOf('--target');
  const target = flag === -1 ? `${process.platform}-${process.arch}` : rest[flag + 1];
  if (!target?.includes('-')) fatal('--target needs a <platform>-<arch> tuple, e.g. win32-x64');
  const want = parseTuple(target);

  const apps = packedApps(join(core, 'release'));
  if (apps.length === 0) fatal('no packed app found under release/ — did electron-builder run?');

  for (const app of apps) {
    const usb = join(app, 'node_modules', 'usb');
    // Native modules are unpacked wholesale, so an absent usb/ here means the
    // binding sits inside the asar where Electron cannot dlopen it.
    if (!existsSync(usb)) fatal(`${app} does not carry node_modules/usb — node-usb would fail to load`);

    if (existsSync(join(usb, 'build'))) {
      fatal(`${usb}/build shipped — a host-platform rebuild artifact that node-gyp-build prefers over prebuilds/`);
    }

    const prebuilds = join(usb, 'prebuilds');
    if (!existsSync(prebuilds)) fatal(`${usb} has no prebuilds/ — nothing to load the native binding from`);
    const match = readdirSync(prebuilds).find((name) => {
      if (!name.includes('-') || !statSync(join(prebuilds, name)).isDirectory()) return false;
      const tuple = parseTuple(name);
      return tuple.platform === want.platform && want.arches.every((arch) => tuple.arches.includes(arch));
    });
    if (!match) fatal(`${prebuilds} has no ${target} prebuild — the app cannot open a Nord on that platform`);
    if (!readdirSync(join(prebuilds, match)).some((f) => f.endsWith('.node'))) {
      fatal(`${prebuilds}/${match} holds no .node binary`);
    }
    console.log(`usb native guard: ${app} → prebuilds/${match}, no build/ — OK`);
  }
}

if (command === 'clean') clean();
else if (command === 'verify') verify();
else fatal('usage: usb-native-guard.mjs <clean|verify> [--target <platform>-<arch>]');
