import { pianoNameFromFilename } from './name';

/**
 * The 32-bit id a program uses to name the piano or sample it plays.
 *
 * It is MurmurHash2 (m = 0x5bd1e995, r = 24, seed 0) of the sound's library name,
 * reading the name in 4-byte blocks big-endian, with the standard tail and final mix;
 * a result of 0 is stored as 1 (0 means "none"). The algorithm is the one the
 * Stage 2/3 firmware uses when it upgrades old programs (the maintainers’ notes,
 * 5 → 6); the library name is the factory file's name without its extension —
 * a piano's with underscores read as spaces ("White_Grand_XL_6.3.npno" →
 * "White Grand XL 6.3"), a sample's as it is ("Oboe Multi_ST 4.1.nsmp4" →
 * "Oboe Multi_ST 4.1").
 *
 * Checked, not assumed: these names hash to 220 of the 236 factory pianos' ids already
 * in PIANO_NAMES and 85 of the 90 sample ids in SAMPLE_NAMES (the rest are sounds the
 * community table knows from older libraries), and to both sounds of the regression
 * fixture (ns4/factory-sounds.test.ts). Pure.
 */
export function soundId(libraryName: string): number {
  const data = new Uint8Array(libraryName.length);
  for (let i = 0; i < libraryName.length; i++) data[i] = libraryName.charCodeAt(i) & 0xff;
  const m = 0x5bd1e995;
  const n = data.length;
  let h = n >>> 0; // seed 0, xor length
  let i = 0;
  for (; n - i >= 4; i += 4) {
    let k = ((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]) >>> 0;
    k = Math.imul(k, m) >>> 0;
    k = (k ^ (k >>> 24)) >>> 0;
    k = Math.imul(k, m) >>> 0;
    h = (Math.imul(h, m) ^ k) >>> 0;
  }
  const rest = n - i;
  if (rest === 3) h = (h ^ (data[i + 2] << 16)) >>> 0;
  if (rest >= 2) h = (h ^ (data[i + 1] << 8)) >>> 0;
  if (rest >= 1) h = Math.imul((h ^ data[i]) >>> 0, m) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, m) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return h === 0 ? 1 : h;
}

/** A factory file's library name: its name without the extension; a piano's underscores read as spaces. */
export function libraryName(filename: string, kind: 'piano' | 'sample'): string {
  return kind === 'piano'
    ? pianoNameFromFilename(filename).replace(/_/g, ' ')
    : filename.slice(0, filename.lastIndexOf('.'));
}
