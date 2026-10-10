import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { buildCbinHeader } from '../clavia/cbin';
import { patchNs4Checksum } from '../clavia/checksum';
import { crc16ccitt } from '../clavia/crc16';
import { readZipDirectory } from '../clavia/backup/zip-directory';
import { buildMetaXml } from '../device/ns4b';
import { makeNpno, tone, type SynthStroke } from './nsp-synth.testing';
import { readNspDirectory } from './nsp-audio';
import { writeNsmp } from './nsmp-write';
import {
  BackupCheckError, backupItemKind, checkBackup, checkBackupItem, checkPiano, summarizeBackupCheck, type BackupCheckReport,
} from './backup-check';

// Everything below is synthetic or a committed user-program fixture — no Nord content.
const program = () => new Uint8Array(readFileSync(join(__dirname, '__fixtures__/regressionTest.ns4p')));

/** The same program re-tagged as a Live program (`ns4l` — identical body). */
function live(): Uint8Array {
  const b = program();
  b.set(strToU8('ns4l'), 8);
  return b;
}

/** A CBIN file of `tag` over a zeroed body of `size` bytes (presets: ns4o 183 / ns4n 195 / ns4y 541). */
function cbin(tag: string, size: number): Uint8Array {
  const b = new Uint8Array(size);
  b.set(buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw: 205 }), 0);
  return patchNs4Checksum(b);
}

const pianoStrokes = (): SynthStroke[] => [0, 50].map((velocityFrom, i) => ({
  pcm: [tone(4000, 0.02, 3000, i + 1)], velocityFrom, before: [[0, 0, 0, 0]],
}));

function sample(): Uint8Array {
  const n = 3000;
  return writeNsmp({ name: 'My Sample', codec: 4, channels: [Array.from({ length: n }, (_, i) => Math.round(4000 * Math.sin(i / 9)))] });
}

function backupBlob(files: Record<string, Uint8Array>): Blob {
  const z = zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), ...files }, { level: 0 });
  return new Blob([z as unknown as BlobPart]);
}

const fullBackup = () => ({
  'Program/Bank A/Lead.ns4p': program(),
  'Live/Bank 1/Live 1.ns4l': live(),
  'Organ Preset/Bank 1/Gospel.ns4o': cbin('ns4o', 183),
  'Piano Preset/Bank 1/Bright.ns4n': cbin('ns4n', 195),
  'Synth Preset/Bank 1/Pad.ns4y': cbin('ns4y', 541),
  'Settings/Bank 1/Settings.ns4t': cbin('ns4t', 124),
  'Piano/Grand v6.npno': makeNpno(pianoStrokes(), 1, 0x2c),
  'Piano/Grand v5.npno': makeNpno(pianoStrokes(), 1, 0x18),
  'Samp Lib/My Sample.nsmp4': sample(),
  'notes.txt': strToU8('not Nord content'),
});

describe('backupItemKind', () => {
  it('maps every Stage 4 extension and ignores the rest', () => {
    expect(backupItemKind('Program/Bank A/x.ns4p')).toBe('program');
    expect(backupItemKind('Live/Bank 1/x.NS4L')).toBe('live');
    expect(['ns4o', 'ns4n', 'ns4y'].map((e) => backupItemKind(`a/x.${e}`))).toEqual(['preset', 'preset', 'preset']);
    expect(backupItemKind('Settings/Bank 1/Settings.ns4t')).toBe('settings');
    expect(backupItemKind('Piano/x.npno')).toBe('piano');
    expect(['nsmp', 'nsmp3', 'nsmp4'].map((e) => backupItemKind(`a/x.${e}`))).toEqual(['sample', 'sample', 'sample']);
    expect(backupItemKind('meta.xml')).toBeNull();
    expect(backupItemKind('Program/')).toBeNull();
    expect(backupItemKind('__MACOSX/Program/._x.ns4p')).toBeNull();
    expect(backupItemKind('Samp.Lib/noext')).toBeNull();
  });
});

describe('checkBackup', () => {
  it('passes an intact backup and counts what it holds', async () => {
    const seen: number[] = [];
    const r = await checkBackup(backupBlob(fullBackup()), { onProgress: (p) => seen.push(p.doneBytes) });
    expect(r.problems).toEqual([]);
    expect(r.isNordBackup).toBe(true);
    expect(r.cancelled).toBe(false);
    expect(r.ignored).toBe(1); // notes.txt
    expect(r.counts).toEqual({
      program: { total: 1, ok: 1 }, live: { total: 1, ok: 1 }, preset: { total: 3, ok: 3 },
      settings: { total: 1, ok: 1 }, piano: { total: 2, ok: 2 }, sample: { total: 1, ok: 1 },
    });
    expect(r.pianoNotesChecked).toBe(4); // 2 pianos × 2 velocity layers, every one decoded
    expect(seen.at(-1)).toBeGreaterThan(0);
    expect(seen).toEqual([...seen].sort((a, b) => a - b)); // progress only moves forward
  });

  it('catches damage to the backup file itself (the archive CRC)', async () => {
    const blob = backupBlob(fullBackup());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const entry = (await readZipDirectory(blob)).find((e) => e.path === 'Piano/Grand v5.npno')!;
    // Stored entry: data starts after the 30-byte local header + name (no extra field).
    bytes[entry.offset + 30 + entry.path.length + 4000] ^= 0x01;
    const r = await checkBackup(new Blob([bytes]));
    expect(r.problems.map((p) => [p.name, p.kind])).toEqual([['Grand v5', 'piano']]);
    expect(r.problems[0].message).toMatch(/damaged in this backup file/i);
    expect(r.counts.piano).toEqual({ total: 2, ok: 1 });
  });

  it("catches a program whose own check value doesn't match", async () => {
    const bad = program();
    bad[400] ^= 0x01; // body changed, CRC not re-patched — the archive itself is consistent
    const r = await checkBackup(backupBlob({ 'Program/Bank A/Bad.ns4p': bad }));
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0].message).toMatch(/may refuse to load this program/);
  });

  it('decodes piano notes — a broken note shows up even when the checksum is intact (v5)', async () => {
    const piano = makeNpno(pianoStrokes(), 1, 0x18);
    const dir = readNspDirectory(piano)!;
    piano[dir.strokes[1].offset + 1] = 0xe0; // block header: width 0, predictor order 7
    const crc = crc16ccitt(piano.subarray(0, piano.length - 2)); // re-seal the v5 CRC-16 trailer
    piano[piano.length - 2] = crc & 0xff;
    piano[piano.length - 1] = crc >>> 8;
    const r = await checkBackup(backupBlob({ 'Piano/Broken.npno': piano }));
    expect(r.problems.map((p) => p.message)).toEqual(["1 of its 2 notes can't be played back."]);
    expect(r.pianoNotesChecked).toBe(1);
  });

  it("archive-checks meta.xml and stray files too, so damage there isn't missed", async () => {
    const blob = backupBlob(fullBackup());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const meta = (await readZipDirectory(blob)).find((e) => e.path === 'meta.xml')!;
    bytes[meta.offset + 30 + meta.path.length + 5] ^= 0x01;
    const r = await checkBackup(new Blob([bytes]));
    expect(r.problems.map((p) => [p.name, p.kind])).toEqual([['meta', 'file']]);
    expect(r.otherChecked).toBe(2); // meta.xml + notes.txt
    expect(summarizeBackupCheck(r).ok).toBe(false);
  });

  it("doesn't call a v6 piano damaged when its checksum proves it intact but a note won't decode", async () => {
    const piano = makeNpno(pianoStrokes(), 1, 0x2c);
    const dir = readNspDirectory(piano)!;
    piano[dir.strokes[1].offset + 1] = 0xe0; // a block OpenNord can't decode
    const r = await checkBackup(backupBlob({ 'Piano/Odd.npno': patchNs4Checksum(piano) }));
    expect(r.problems).toEqual([]);
    expect(r.counts.piano).toEqual({ total: 1, ok: 1 });
    expect(r.pianoNotesSkipped).toBe(1);
    expect(summarizeBackupCheck(r).detail).toMatch(/can't play 1 more yet/);
  });

  it('says a cut-off backup is incomplete, in plain words', async () => {
    const bytes = new Uint8Array(await backupBlob(fullBackup()).arrayBuffer());
    const err = await checkBackup(new Blob([bytes.subarray(0, bytes.length - 200)])).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BackupCheckError);
    expect((err as Error).message).toMatch(/incomplete or damaged/);
  });

  it('skips note decoding when asked, but still reads the note list', async () => {
    const r = await checkBackup(backupBlob({ 'Piano/A.npno': makeNpno(pianoStrokes(), 1, 0x2c) }), { playPianos: false });
    expect(r.counts.piano).toEqual({ total: 1, ok: 1 });
    expect(r.pianoNotesChecked).toBe(0);
  });

  it('stops when cancelled and says so', async () => {
    const ac = new AbortController();
    const r = await checkBackup(backupBlob(fullBackup()), {
      signal: ac.signal,
      onProgress: (p) => { if (p.current === 'Gospel') ac.abort(); },
    });
    expect(r.cancelled).toBe(true);
    const checked = Object.values(r.counts).reduce((n, c) => n + c.total, 0);
    expect(checked).toBeLessThan(9);
  });
});

describe('checkBackupItem', () => {
  it('flags files that are not what their extension says', () => {
    expect(checkBackupItem('program', cbin('ns4o', 183))).toMatch(/Stage 4 program/);
    expect(checkBackupItem('preset', cbin('ns4p', 868))).toMatch(/Stage 4 preset/);
    expect(checkBackupItem('settings', cbin('ns4p', 868))).toMatch(/settings/);
    expect(checkBackupItem('sample', program())).toMatch(/Nord sample/);
    expect(checkBackupItem('program', new Uint8Array(100))).toMatch(/readable Nord file/);
  });

  it('flags a damaged sample', () => {
    const s = sample();
    s[s.length - 10] ^= 0x01;
    expect(checkBackupItem('sample', s)).toMatch(/may refuse to load this sample/);
  });
});

describe('checkPiano', () => {
  it('rejects a damaged v6 piano by its checksum before decoding', async () => {
    const p = makeNpno(pianoStrokes(), 1, 0x2c);
    p[p.length - 5] ^= 0x01;
    expect(await checkPiano(p)).toEqual({ problem: 'Damaged — your Nord may refuse to load this piano.', notes: 0, skipped: 0 });
  });
});

describe('summarizeBackupCheck', () => {
  const base = (): BackupCheckReport => ({
    isNordBackup: true,
    counts: {
      program: { total: 356, ok: 356 }, live: { total: 0, ok: 0 }, preset: { total: 3, ok: 3 },
      settings: { total: 1, ok: 1 }, piano: { total: 2, ok: 2 }, sample: { total: 1, ok: 1 },
    },
    pianoNotesChecked: 120, pianoNotesSkipped: 0, problems: [], ignored: 0, otherChecked: 0, cancelled: false,
  });

  it('reads like a player would say it', () => {
    expect(summarizeBackupCheck(base())).toEqual({
      ok: true,
      headline: 'Everything in this backup checks out.',
      contents: '356 programs · 3 presets · 1 settings file · 2 pianos · 1 sample',
      detail: 'Every note of all 2 pianos plays back (120 recorded notes).',
    });
  });

  it('counts problems and partial piano coverage', () => {
    const r = base();
    r.counts.piano.ok = 1;
    r.problems = [{ path: 'Piano/x.npno', name: 'x', kind: 'piano', message: '…' }];
    const s = summarizeBackupCheck(r);
    expect(s.ok).toBe(false);
    expect(s.headline).toBe('1 of 363 files needs attention.');
    expect(s.detail).toBe('1 of 2 pianos play back in full (120 recorded notes).');
  });

  it('reports a stopped check and an empty backup', () => {
    expect(summarizeBackupCheck({ ...base(), cancelled: true }).headline).toBe('Check stopped — 363 of 363 files checked out so far.');
    const empty = base();
    for (const c of Object.values(empty.counts)) { c.total = 0; c.ok = 0; }
    expect(summarizeBackupCheck(empty)).toMatchObject({ ok: false, headline: 'Nothing to check in this backup.', contents: 'No Stage 4 content found' });
  });
});

// Real factory pianos (NPNO_DIR, outside the repo — Clavia's audio, never committed): a
// backup holding them checks out, every note decoded. Built in memory; skipped in CI.
const npnoDir = process.env.NPNO_DIR;
const realPianos = npnoDir && existsSync(npnoDir) ? readdirSync(npnoDir).filter((f) => f.endsWith('.npno')) : [];
describe.skipIf(realPianos.length === 0)('checkBackup — real pianos in $NPNO_DIR', () => {
  it('passes a backup of real v5 + v6 factory pianos', async () => {
    const files = Object.fromEntries(realPianos.map((f) => [`Piano/${f}`, new Uint8Array(readFileSync(join(npnoDir!, f)))]));
    const r = await checkBackup(backupBlob(files));
    expect(r.problems).toEqual([]);
    expect(r.counts.piano).toEqual({ total: realPianos.length, ok: realPianos.length });
    expect(r.pianoNotesChecked).toBeGreaterThan(realPianos.length * 10);
  }, 300_000);
});

// A real NSM-written backup (NS4B_FILE, kept outside the repo): the check must report
// no problems on an intact backup — the guard against false alarms on files NSM wrote.
// Notes aren't decoded by default (minutes on a full Piano partition); NS4B_PLAY=1 does.
const ns4bFile = process.env.NS4B_FILE;
describe.skipIf(!ns4bFile || !existsSync(ns4bFile))('checkBackup — real backup in $NS4B_FILE', () => {
  it('finds nothing wrong with an intact NSM backup', async () => {
    const { openAsBlob } = await import('node:fs');
    const r = await checkBackup(await openAsBlob(ns4bFile!), { playPianos: process.env.NS4B_PLAY === '1' });
    expect(r.isNordBackup).toBe(true);
    expect(r.problems).toEqual([]);
    expect(r.counts.program.total).toBeGreaterThan(0);
  }, 3_600_000);
});
