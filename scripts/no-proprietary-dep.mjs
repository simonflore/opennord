// Fails if packages/core declares a dependency on any proprietary workspace
// package — the public AGPL mirror must be buildable from core alone.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8'));
const PROPRIETARY = ['@opennord/contracts', '@opennord/frontend-pro', '@opennord/backend', '@opennord/web'];
const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
const bad = PROPRIETARY.filter((p) => p in deps);
if (bad.length) {
  console.error(`FATAL: packages/core must not depend on proprietary packages: ${bad.join(', ')}`);
  process.exit(1);
}
console.log('core dependency check: clean (AGPL-mirrorable)');
