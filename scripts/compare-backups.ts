/**
 * compare-backups — compare two `.ns4b` backups (hardware session W6).
 *   npm run hw:compare-backups -- <before.ns4b> <after.ns4b>
 * Exit code 0 when nothing changed or went missing; "moved" (same sound, another place) is reported, not failed.
 */
import { openAsBlob } from 'node:fs';
import { compareBackups } from '@/lib/hwtest/compare-backups';

const [first, second] = process.argv.slice(2);
if (!first || !second) {
  console.error('usage: npm run hw:compare-backups -- <first.ns4b> <second.ns4b>');
  process.exit(2);
}
const r = await compareBackups(await openAsBlob(first), await openAsBlob(second));
console.log(`same: ${r.same}`);
for (const [label, list] of [['moved (same sound, another place)', r.moved], ['changed', r.changed], ['only in the first', r.onlyInFirst], ['only in the second', r.onlyInSecond]] as const) {
  console.log(`${label}: ${list.length}`);
  for (const p of list) console.log(`  ${p}`);
}
process.exit(r.changed.length || r.onlyInFirst.length || r.onlyInSecond.length ? 1 : 0);
