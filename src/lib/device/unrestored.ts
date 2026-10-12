import { zipSync } from 'fflate';
import type { UnrestoredFile } from './execute';
import { downloadBytes } from '../download';
import { safeFilename } from '../ns4/bundle';

/** Download, as one zip named by slot, the files a failed rollback left off the device:
 *  after it they exist nowhere else. */
export function saveUnrestored(files: UnrestoredFile[]): void {
  const zip: Record<string, Uint8Array> = {};
  for (const f of files) zip[`slot ${f.addr.bank}-${f.addr.slot} ${safeFilename(f.name)}.${f.ext}`] = f.file;
  downloadBytes(zipSync(zip, { level: 0 }), `OpenNord recovered ${new Date().toISOString().slice(0, 10)}.zip`);
}
