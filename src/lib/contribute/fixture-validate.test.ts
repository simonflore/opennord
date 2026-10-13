import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { synthFwBody, synthFwFile, synthLegacyLayoutFile, writeBits } from '../clavia/block-chain.synth';
import { sealFileChecksum } from '../clavia/checksum';
import { buildCbinHeader } from '../clavia/cbin';
import { makeNpno, tone } from '../ns4/nsp-synth.testing';
import { writeNsmp } from '../ns4/nsmp-write';
import { NP3_LAYOUT } from '../np3/layout.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NW1_LAYOUT } from '../nw1/layout.generated';
import { LEGACY_DATA_OFFSET } from '../clavia/legacy-record';
import {
  checkProgram, checkMedia, validateMediaBytes, validateBytes, validateArchive, summarizeRows, formatSummary, alignmentVerdict,
  redactWriteMessage, isNordFileName, isArchiveName, rowProblems,
} from './fixture-validate';
import { runFixtureScan, listFixtureInputs, resolveUserPath, validateInput } from './fixture-files';
import { homedir } from 'node:os';

/** A clean Piano 3 program (legacy record, firmware defaults, sealed CRC-16). */
/** A Stage 4 organ preset: a real NSM-era header over a zeroed 183-byte body, sealed. */
function ns4o(): Uint8Array {
  const buf = new Uint8Array(183);
  buf.set(buildCbinHeader({ formatType: 1, tag: 'ns4o', bank: 0, location: 0, category: 0, versionRaw: 205 }), 0);
  return sealFileChecksum(buf);
}
const np3 = () => synthLegacyLayoutFile('np3p', NP3_LAYOUT);
/** A clean Electro 7 program (NSM-era header, firmware-layout body, sealed CRC-32). */
const ne7 = () => sealFileChecksum(synthFwFile('ne7p', synthFwBody(NE7_LAYOUT), 100));

/** An Electro 7 program with one field's bits set past its range. */
function ne7OutOfRange(): Uint8Array {
  const f = NE7_LAYOUT.fields.find((x) => x.enc !== 'raw' && x.max < 2 ** x.width - 1);
  if (!f) throw new Error('no Electro 7 field with spare raw values');
  const body = synthFwBody(NE7_LAYOUT);
  writeBits(body, (NE7_LAYOUT.blocks[f.block].offset + 1) * 8 + f.bit, f.width, 2 ** f.width - 1);
  return sealFileChecksum(synthFwFile('ne7p', body, 100));
}

/** A Piano 3 program with one field's bits set past its range (the firmware would reset it). */
function np3OutOfRange(): Uint8Array {
  const f = NP3_LAYOUT.fields.find((x) => x.enc !== 'raw' && x.max < 2 ** x.width - 1 && !x.copyOf);
  if (!f) throw new Error('no Piano 3 field with spare raw values');
  const bytes = np3();
  writeBits(bytes, LEGACY_DATA_OFFSET * 8 + f.bit, f.width, 2 ** f.width - 1);
  return sealFileChecksum(bytes);
}

describe('checkProgram', () => {
  it('passes a clean legacy-record program: framing, checksum, reader, no-op write and write-back', () => {
    const c = checkProgram(np3(), 'piano-3')!;
    expect(c.programTag).toBe('np3p');
    expect(c.codecModel).toBe('np3');
    expect(c.framing).toMatchObject({ headerType: 'legacy', lengthOk: true });
    expect(c.checksumOk).toBe(true);
    expect(c.reader).toMatchObject({ layoutMatched: true, headerOnly: false, recordVersion: 4, outOfRange: 0, convertedFrom: null });
    expect(c.noOpWrite.outcome).toBe('identical');
    expect(c.writeBack.outcome).toBe('identical');
  });

  it('passes a clean firmware block-chain program', () => {
    const c = checkProgram(ne7(), 'electro-7')!;
    expect(c.framing).toMatchObject({ headerType: 'nsm-era', lengthOk: true, recordBytes: NE7_LAYOUT.bodyBytes });
    expect(c.checksumOk).toBe(true);
    expect(c.reader.layoutMatched).toBe(true);
    expect(c.noOpWrite.outcome).toBe('identical');
    expect(c.writeBack.outcome).toBe('identical');
  });

  it('reads a Live file as its model’s program', () => {
    const c = checkProgram(synthLegacyLayoutFile('np3l', NP3_LAYOUT), 'piano-3')!;
    expect(c.programTag).toBe('np3p');
    expect(c.noOpWrite.outcome).toBe('identical');
  });

  it('flags a broken checksum — and the writer refuses to reseal it', () => {
    const bytes = np3();
    bytes[bytes.length - 1] ^= 0xff;
    const c = checkProgram(bytes, 'piano-3')!;
    expect(c.checksumOk).toBe(false);
    expect(c.noOpWrite.outcome).toBe('refused');
    expect(c.noOpWrite.reason).toMatch(/checksum/);
  });

  it('counts out-of-range values; writing the reader’s values back then differs or is refused', () => {
    const c = checkProgram(np3OutOfRange(), 'piano-3')!;
    expect(c.reader.outOfRange).toBe(1);
    expect(c.noOpWrite.outcome).toBe('identical');
    expect(['differs', 'refused', 'identical']).toContain(c.writeBack.outcome);
  });

  it('flags a record of the wrong length', () => {
    const short = sealFileChecksum(np3().slice(0, -3));
    const c = checkProgram(short, 'piano-3')!;
    expect(c.framing.lengthOk).toBe(false);
    expect(c.framing.expectedRecordBytes).toEqual([2 + NP3_LAYOUT.dataBytes + (NP3_LAYOUT.padBytes ?? 0)]);
  });

  it('marks a model OpenNord does not write as not writable', () => {
    // A Stage 4 tag on a body nothing reads: the check still runs, the writer is the Stage 4 one.
    const c = checkProgram(synthFwFile('ns4p', new Uint8Array(64)), 'stage-4');
    expect(c?.noOpWrite.outcome).toBe('not-writable');
  });

  it('returns null for files no program reader reads', () => {
    expect(checkProgram(new Uint8Array([1, 2, 3]), null)).toBeNull();
    expect(checkProgram(synthFwFile('ns3t', new Uint8Array(16)), 'stage-3')).toBeNull(); // Settings
  });
});

describe('validateBytes', () => {
  it('infers the model from the file when no folder names it', () => {
    const r = validateBytes('Lib/Bank 1/Soft.np3p', np3(), null);
    expect(r.model).toBe('piano-3');
    expect(r.kind).toBe('program');
    expect(r.check?.noOpWrite.outcome).toBe('identical');
    expect(rowProblems(r)).toEqual([]);
  });

  it('cross-checks against the folder’s model', () => {
    const r = validateBytes('electro-6/Soft.np3p', np3(), 'electro-6');
    expect(r.issues.join(' ')).toMatch(/np3p/);
  });

  it('never throws on junk, and runs no checks on a file read only for its header', () => {
    expect(validateBytes('x.ns3f', new Uint8Array([0, 1]), null).check).toBeUndefined();
    expect(validateBytes('big.np3p', np3(), null, 5_000_000, true).check).toBeUndefined();
  });
});

describe('validateArchive', () => {
  it('opens a backup and checks each program inside, labelled backup › entry', async () => {
    const zip = zipSync({
      'Program/Bank A/Soft.np3p': np3(),
      'Program/Bank A/Broken.np3p': np3OutOfRange(),
      'Settings/x.np3s': synthLegacyLayoutFile('np3s', NP3_LAYOUT),
      'notes.txt': strToU8('hello'),
      '__MACOSX/Program/Bank A/._Soft.np3p': strToU8('resource fork'),
      'Program/Bank A/._Soft.np3p': strToU8('resource fork'),
    });
    const rows = await validateArchive('Backups/My.np3b', new Blob([zip]), null);
    expect(rows[0]).toMatchObject({ kind: 'backup', model: 'piano-3', skippedEntries: 3 });
    expect(rows.map((r) => r.path)).toEqual([
      'Backups/My.np3b',
      'Backups/My.np3b › Program/Bank A/Soft.np3p',
      'Backups/My.np3b › Program/Bank A/Broken.np3p',
      'Backups/My.np3b › Settings/x.np3s',
    ]);
    expect(rows[1].check?.noOpWrite.outcome).toBe('identical');
    expect(rows[2].check?.reader.outOfRange).toBe(1);
    expect(rows[3].check).toBeUndefined();
  });

  it('reports an archive that isn’t a ZIP instead of throwing', async () => {
    const rows = await validateArchive('bad.ns3b', new Blob([new Uint8Array(40)]), null);
    expect(rows).toHaveLength(1);
    expect(rows[0].issues[0]).toMatch(/could not read/);
  });
});

describe('presets', () => {
  it('checks a Stage 4 preset: checksum, read, voices and identity', () => {
    const row = validateBytes('Organ.ns4o', ns4o(), null);
    expect(row.check).toBeUndefined();
    expect(row.preset).toEqual({ checksumOk: true, read: true, voices: 1, identified: true });
    expect(rowProblems(row)).toEqual([]);
    const [s] = summarizeRows([row]);
    expect(s).toMatchObject({ model: 'stage-4', programs: 0, presets: 1, presetsRead: 1, presetChecksumOk: 1, presetsIdentified: 1 });
    const text = formatSummary([row], 'r.json');
    expect(text).toContain('0 program(s), 1 preset(s) checked');
    expect(text).toContain('presets: read 1 · voice identified 1 · checksum OK 1 / fail 0');
  });

  it('flags a preset whose checksum does not hold', () => {
    const bad = ns4o();
    bad[bad.length - 1] ^= 0xff;
    const row = validateBytes('Organ.ns4o', bad, null);
    expect(row.preset?.checksumOk).toBe(false);
    expect(rowProblems(row)).toContain('checksum does not hold');
  });
});

describe('pianos and samples', () => {
  const piano = () => makeNpno([0, 50].map((velocityFrom, i) => ({
    pcm: [tone(4000, 0.02, 3000, i + 1)], velocityFrom, before: [[0, 0, 0, 0]],
  })), 1, 0x2c);
  const sample = () => writeNsmp({ name: 'My Sample', codec: 4, channels: [Array.from({ length: 4000 }, (_, i) => Math.round(4000 * Math.sin(i / 9)))] });

  it('checks a piano: check value and every note decoded', async () => {
    expect(await checkMedia(piano())).toEqual({ kind: 'piano', checksumOk: true, notes: 2, notesDecoded: 2 });
  });

  it('checks a sample: check value and every note decoded', async () => {
    const m = await checkMedia(sample());
    expect(m).toMatchObject({ kind: 'sample', checksumOk: true });
    expect(m!.notes).toBeGreaterThan(0);
    expect(m!.notesDecoded).toBe(m!.notes);
  });

  it('converts a sample to the other generations only when asked, and counts what was kept', async () => {
    expect((await checkMedia(sample()))!.conversions).toBeUndefined();
    const m = await checkMedia(sample(), { conversions: true });
    expect(m!.conversions).toEqual([{ target: 2, lost: [] }, { target: 3, lost: [] }]);
    const row = await validateMediaBytes('My Sample.nsmp4', sample(), null, { conversions: true });
    expect(formatSummary([row], 'r.json')).toContain('sample conversions: 2 tried · 2 keep audio, loops, level and tuning');
    // A conversion that lost something is named on the file's line.
    row.media!.conversions![0].lost = ['loop points'];
    const text = formatSummary([row], 'r.json');
    expect(text).toContain('2 tried · 1 keep');
    expect(text).toContain('converted to .nsmp: loses loop points');
  });

  it('flags a damaged piano and sums notes in the summary', async () => {
    const bad = piano();
    bad[bad.length - 100] ^= 0xff;
    const rows = [await validateMediaBytes('Grand.npno', piano(), null), await validateMediaBytes('Bad.npno', bad, null)];
    expect(rowProblems(rows[1])).toContain('checksum does not hold');
    const text = formatSummary(rows, 'r.json');
    expect(text).toContain('2 piano(s)/sample(s) checked');
    expect(text).toContain('pianos/samples: checksum OK 1 / fail 1');
  });

  it('returns null for a file that is neither', async () => {
    expect(await checkMedia(np3())).toBeNull();
  });
});

describe('summary', () => {
  it('says a candidate layout looks right when every real file reads cleanly', () => {
    const rows = [validateBytes('a.ne7p', ne7(), null), validateBytes('b.ne7p', ne7(), null)];
    const [s] = summarizeRows(rows);
    expect(s).toMatchObject({ model: 'electro-7', layoutStatus: 'candidate', programs: 2, cleanReads: 2 });
    expect(alignmentVerdict(s)).toBe('2 real files read cleanly → alignment looks right');
  });

  it('counts a block-chain file’s out-of-range values against its layout', () => {
    const rows = [validateBytes('a.ne7p', ne7(), null), validateBytes('b.ne7p', ne7OutOfRange(), null)];
    expect(rows[1].check?.reader.outOfRange).toBe(1);
    expect(alignmentVerdict(summarizeRows(rows)[0])).toBe('1 of 2 read cleanly (1 with out-of-range values) → alignment needs a look');
  });

  it('does not count a file the reader warns about (an older format) as a clean read', () => {
    const old = sealFileChecksum(synthFwFile('ne7p', synthFwBody(NE7_LAYOUT, {}, 90), 100));
    const [s] = summarizeRows([validateBytes('a.ne7p', old, null)]);
    expect(s).toMatchObject({ programs: 1, readOk: 1, warned: 1, converted: 1, cleanReads: 0 });
    expect(alignmentVerdict(s)).toBe('0 of 1 read cleanly (1 with reader warnings) → alignment needs a look');
  });

  it('counts an older record OpenNord converts exactly as the firmware does as a clean read', () => {
    const v7 = synthLegacyLayoutFile('nwp', NW1_LAYOUT, {}, { version: 7 });
    const [s] = summarizeRows([validateBytes('a.nwp', v7, null)]);
    expect(s).toMatchObject({ programs: 1, converted: 1, warned: 0, cleanReads: 1 });
    expect(alignmentVerdict(s)).toBe('1 real file read cleanly → alignment looks right');
  });

  it('says a candidate layout needs a look when a file has out-of-range values', () => {
    const rows = [validateBytes('a.np3p', np3(), null), validateBytes('b.np3p', np3OutOfRange(), null)];
    const [s] = summarizeRows(rows);
    expect(alignmentVerdict(s)).toBe('1 of 2 read cleanly (1 with out-of-range values) → alignment needs a look');
    const text = formatSummary(rows, 'fixtures/.report.json');
    expect(text).toContain('Nord Piano 3 (piano-3) — layout candidate');
    expect(text).toContain('LOOK Nord Piano 3');
    expect(text).toContain('! b.np3p: 1 out-of-range value(s)');
  });
});

describe('helpers', () => {
  it('redacts the value a writer names, keeping the field', () => {
    expect(redactWriteMessage('common.outLevel: 300 is outside its range 0–127')).toBe('common.outLevel: <value> is outside its range 0–127');
    expect(redactWriteMessage('This program file’s checksum doesn’t match')).toBe('This program file’s checksum doesn’t match');
  });

  it('knows Nord file names and archives', () => {
    expect(isNordFileName('a/b/Lead.ns3f')).toBe(true);
    expect(isNordFileName('Piano.nsmp4')).toBe(true);
    expect(isNordFileName('notes.pdf')).toBe(false);
    expect(isArchiveName('x.ns4b')).toBe(true);
    expect(isArchiveName('x.ne6pbundle')).toBe(true);
    expect(isArchiveName('x.ns4p')).toBe(false);
  });

  it('expands ~ in a NORD_FILES path', () => {
    expect(resolveUserPath('~/Music/Nord')).toBe(join(homedir(), 'Music/Nord'));
  });
});

describe('runFixtureScan (files on disk)', () => {
  let dir = '';
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = ''; });

  /** Every file's bytes under `root`, to prove the scan changed nothing. */
  const snapshot = (root: string): Record<string, string> => {
    const out: Record<string, string> = {};
    const go = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) go(p); else out[p] = Buffer.from(readFileSync(p)).toString('base64');
      }
    };
    go(root);
    return out;
  };

  it('does nothing with no fixtures and no NORD_FILES', async () => {
    dir = mkdtempSync(join(tmpdir(), 'fixtures-'));
    expect(await runFixtureScan({ fixturesRoot: join(dir, 'missing') })).toEqual({ rows: [], notes: [] });
  });

  it('walks a NORD_FILES folder recursively, opens backups, and leaves every file untouched', async () => {
    dir = mkdtempSync(join(tmpdir(), 'nordfiles-'));
    mkdirSync(join(dir, 'Piano 3/Bank A'), { recursive: true });
    mkdirSync(join(dir, 'Backups'));
    writeFileSync(join(dir, 'Piano 3/Bank A/Soft.np3p'), np3());
    writeFileSync(join(dir, 'Lead.ne7p'), ne7());
    writeFileSync(join(dir, 'Backups/All.np3b'), zipSync({ 'Program/Bank B/Bright.np3p': np3() }));
    writeFileSync(join(dir, 'readme.txt'), 'not a Nord file');
    writeFileSync(join(dir, '.DS_Store'), 'hidden');
    const before = snapshot(dir);

    const { rows, notes } = await runFixtureScan({ fixturesRoot: join(dir, 'no-fixtures'), nordFiles: dir });
    expect(rows.map((r) => r.path).sort()).toEqual([
      'Backups/All.np3b', 'Backups/All.np3b › Program/Bank B/Bright.np3p', 'Lead.ne7p', 'Piano 3/Bank A/Soft.np3p',
    ]);
    expect(rows.every((r) => !r.path.startsWith('/'))).toBe(true); // paths relative to the folder given
    expect(notes).toEqual(['NORD_FILES: 1 file(s) that aren\'t Nord files ignored']);
    expect(snapshot(dir)).toEqual(before);

    const text = formatSummary(rows, 'fixtures/.report.json');
    expect(text).toContain('OK   Nord Piano 3: 2 real files read cleanly → alignment looks right');
    expect(text).toContain('OK   Nord Electro 7: 1 real file read cleanly → alignment looks right');
  });

  it('records a file it cannot read by its error code, never its absolute path', async () => {
    dir = mkdtempSync(join(tmpdir(), 'nordfiles-'));
    const [row] = await validateInput({ abs: join(dir, 'gone.ns3f'), label: 'gone.ns3f', model: null, size: 0 });
    expect(row.issues).toEqual(['could not read: ENOENT']);
    expect(JSON.stringify(row)).not.toContain(dir);
  });

  it('takes fixtures/<model-id>/ folders recursively, plus the Nord files in other folders and at the top', async () => {
    dir = mkdtempSync(join(tmpdir(), 'fixtures-'));
    mkdirSync(join(dir, 'piano-3/sub'), { recursive: true });
    mkdirSync(join(dir, 'pairs'));
    writeFileSync(join(dir, 'piano-3/sub/Soft.np3p'), np3());
    writeFileSync(join(dir, 'pairs/Strings.nsmp4'), new Uint8Array(8));
    writeFileSync(join(dir, 'pairs/notes.txt'), 'x');
    writeFileSync(join(dir, 'Loose.np3p'), np3());
    writeFileSync(join(dir, 'README.md'), '#');
    const { inputs, notes } = listFixtureInputs(dir);
    expect(inputs.map((i) => [i.label, i.model])).toEqual([
      ['Loose.np3p', null], ['pairs/Strings.nsmp4', null], ['piano-3/sub/Soft.np3p', 'piano-3'],
    ]);
    expect(notes).toEqual([]);
  });
});
