import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  findProgramPiano, isSizedPianoBase, knownVersionCount, localPianoKeys, localPianos, pianoKey, versionLabel, versionNumber,
  type LocalPiano,
} from './piano-match';
import { pianoEntriesFromBackupRefs } from './piano-entries';
import { PIANO_NAMES } from '../ns4/names.generated';
import type { BackupRef } from '../clavia/backup/backup-index';

/** Header-only synthetic .npno: CBIN + npno + version + CNSP + "name#variant" at CNSP+0x1C. */
function npno(nameField: string, versionRaw: number): Uint8Array {
  const buf = new Uint8Array(0x100);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  ascii('CBIN', 0); ascii('npno', 8);
  buf[0x14] = versionRaw & 0xff; buf[0x15] = versionRaw >> 8;
  ascii('CNSP', 0x2c); ascii(nameField, 0x48);
  return buf;
}

const folderPiano = (file: string, nameField: string, versionRaw: number): LocalPiano =>
  localPianos({ pianos: [{ id: `folder:${file}`, name: file.replace(/\.npno$/, ''), bytes: npno(nameField, versionRaw) }], backupPianos: [] })[0];

const backupRef = (path: string): BackupRef => ({
  bundlePath: 'Stage4 backup.ns4b', entry: { path, size: 1, compressedSize: 1, offset: 0, method: 0 }, kind: 'piano', native: true,
});
const backupPiano = (path: string): LocalPiano => localPianos({ pianos: [], backupPianos: [backupRef(path)] })[0];

describe('pianoKey / versions', () => {
  it('splits a trailing version off, in any of Nord\'s spellings', () => {
    expect(pianoKey('White Grand XL 6.3')).toEqual({ model: 'white grand xl', version: 630 });
    expect(pianoKey('White_Grand_XL_6.3.npno')).toEqual({ model: 'white grand xl', version: 630 });
    expect(pianoKey('Beethoven_FortePBroadwood_Lrg5.3')).toEqual({ model: 'beethoven fortepbroadwood lrg', version: 530 });
    expect(pianoKey('Concert Grand1   Med')).toEqual({ model: 'concert grand1 med' });
    expect(pianoKey('Wurlitzer 1')).toEqual({ model: 'wurlitzer 1' });
  });

  it('reads one- and two-digit minor versions the same way Nord writes them', () => {
    expect(versionNumber('6.1')).toBe(610);
    expect(versionNumber('6.10')).toBe(610);
    expect(versionNumber('5.30')).toBe(530);
    expect(versionLabel(610)).toBe('6.1');
    expect(versionLabel(625)).toBe('6.25');
  });
});

describe('localPianoKeys', () => {
  it('drops the recorded-instrument token Nord\'s download names carry', () => {
    const p = folderPiano('Royal_Grand_3D_YaS6_XL_5.4.npno', 'Royal Grand 3D#YaS6', 540);
    expect(localPianoKeys(p)).toContainEqual({ model: 'royal grand 3d xl', version: 540 });
    const lady = folderPiano('Grand_Lady_D___Stw_D__Lrg_5.3.npno', 'Grand Lady D#Stw D', 530);
    expect(localPianoKeys(lady)).toContainEqual({ model: 'grand lady d lrg', version: 530 });
  });

  it('falls back to the header name only for a renamed file', () => {
    expect(localPianoKeys(folderPiano('clav61.npno', 'Clavinet D6#', 610)))
      .toContainEqual({ model: 'clavinet d6', version: 610 });
    expect(localPianoKeys(folderPiano('White Grand XL 6.3.npno', 'White Grand#', 630)))
      .toEqual([{ model: 'white grand xl', version: 630 }]);
  });

  it('skips the header name of a renamed file when Nord also sells that name in sizes', () => {
    expect(isSizedPianoBase('Wurlitzer 2')).toBe(true); // "Wurlitzer 2 Lrg", "Wurlitzer 2 XL"
    expect(isSizedPianoBase('Concert Grand1')).toBe(true); // "Concert Grand1   Lrg"
    expect(isSizedPianoBase('Clavinet D6')).toBe(false);
    expect(isSizedPianoBase('Wurlitzer 1')).toBe(false);
    // The header never holds the size: "wurli.npno" may well be the Wurlitzer 2 XL.
    expect(localPianoKeys(folderPiano('wurli.npno', 'Wurlitzer 2#', 610)))
      .toEqual([{ model: 'wurli', version: 610 }]);
  });
});

describe('findProgramPiano', () => {
  it('matches a device-named piano in a backup by its panel name', () => {
    const m = findProgramPiano('EP1 Deep Timbre Lrg', [backupPiano('Piano/Electric/EP1 Deep Timbre Lrg 6.0.npno')]);
    expect(m?.piano.source).toBe('backup');
    expect(m?.version).toBe('6.0');
  });

  it('matches Nord download names and renamed files through the header', () => {
    expect(findProgramPiano('Electric Grand 1', [folderPiano('Electric_Grand_1_CP80__5.3.npno', 'Electric Grand 1#CP80', 530)]))
      .toMatchObject({ version: '5.3' });
    expect(findProgramPiano('Clavinet D6 6.1', [folderPiano('clav61.npno', 'Clavinet D6#', 610)]))
      .toMatchObject({ exactVersion: true, versionUncertain: false });
  });

  it('requires the version when the program names one', () => {
    expect(findProgramPiano('Clavinet D6 5.0', [folderPiano('Clavinet D6 6.1.npno', 'Clavinet D6#', 610)])).toBeNull();
  });

  it('does not match a renamed sized piano to the unsized program name', () => {
    const renamed = folderPiano('wurli.npno', 'Wurlitzer 2#', 610);
    expect(findProgramPiano('Wurlitzer 2', [renamed])).toBeNull();
    expect(findProgramPiano('Wurlitzer 2 XL', [renamed])).toBeNull();
    // Named files still match by their own name.
    expect(findProgramPiano('Wurlitzer 2', [folderPiano('Wurlitzer 2 6.1.npno', 'Wurlitzer 2#', 610)])).not.toBeNull();
    expect(findProgramPiano('Wurlitzer 2 XL', [folderPiano('Wurlitzer_2_XL_6.1.npno', 'Wurlitzer 2#', 610)])).not.toBeNull();
  });

  it('never matches a different size or a near name', () => {
    const locals = [folderPiano('White Grand Sml 6.3.npno', 'White Grand#', 630), backupPiano('Piano/White Grand XL.npno')];
    expect(findProgramPiano('White Grand Lrg', locals)).toBeNull();
    expect(findProgramPiano('White Grand', locals)).toBeNull();
    expect(findProgramPiano('White Grand XL', locals)?.piano.name).toBe('White Grand XL');
  });

  it('ignores placeholders and unplayable entries', () => {
    expect(findProgramPiano('—', [backupPiano('Piano/—.npno')])).toBeNull();
    expect(findProgramPiano('name unknown', [backupPiano('Piano/name unknown.npno')])).toBeNull();
    expect(findProgramPiano('My Grand', [{ id: 'x', name: 'My Grand', source: 'local' }])).toBeNull();
  });

  it('prefers a folder copy, then the newest version', () => {
    const m = findProgramPiano('White Grand XL', [
      backupPiano('Piano/White Grand XL 6.3.npno'),
      folderPiano('White Grand XL 6.2.npno', 'White Grand#', 620),
      folderPiano('White_Grand_XL_6.3.npno', 'White Grand#', 630),
    ]);
    expect(m?.piano.source).toBe('local');
    expect(m?.version).toBe('6.3');
  });

  it('flags the version as uncertain when Nord made the piano more than once', () => {
    expect(knownVersionCount('White Grand XL')).toBeGreaterThan(1);
    expect(findProgramPiano('White Grand XL', [backupPiano('Piano/White Grand XL 6.3.npno')])?.versionUncertain).toBe(true);
    const single = Object.values(PIANO_NAMES).find((n) => knownVersionCount(n) === 1 && !pianoKey(n).version)!;
    expect(findProgramPiano(single, [backupPiano(`Piano/${single} 6.1.npno`)])?.versionUncertain).toBe(false);
  });
});

describe('backup piano id and name', () => {
  it('are the same in the Pianos browser and the program audition', () => {
    const r = backupRef('Piano/Electric/EP1 Deep Timbre Lrg 6.0.npno');
    const [entry] = pianoEntriesFromBackupRefs([r]);
    const local = localPianos({ pianos: [], backupPianos: [r] })[0];
    expect(local.id).toBe(entry.id);
    expect(local.name).toBe(entry.name);
    expect(entry).toMatchObject({ id: 'backup:Stage4 backup.ns4b!Piano/Electric/EP1 Deep Timbre Lrg 6.0.npno', name: 'EP1 Deep Timbre Lrg 6.0' });
  });
});

// Real pianos kept outside the repo (NPNO_DIR) — each must match the panel name of
// its instrument, using its header and either its own or a renamed file name.
const npnoDir = process.env.NPNO_DIR;
const realNpno = npnoDir && existsSync(npnoDir) ? readdirSync(npnoDir).filter((f) => f.endsWith('.npno')) : [];
describe.skipIf(realNpno.length === 0)('findProgramPiano — real pianos in $NPNO_DIR', () => {
  it('matches each file to a panel name in PIANO_NAMES', () => {
    const locals = localPianos({
      pianos: realNpno.map((f) => ({ id: `folder:${f}`, name: f.replace(/\.npno$/, ''), bytes: new Uint8Array(readFileSync(join(npnoDir!, f))) })),
      backupPianos: [],
    });
    const names = [...new Set(Object.values(PIANO_NAMES))];
    for (const p of locals) {
      const hits = names.filter((n) => findProgramPiano(n, [p])?.piano === p);
      expect(hits.length, `${p.name} → ${hits.join(', ')}`).toBeGreaterThan(0);
    }
  });
});
