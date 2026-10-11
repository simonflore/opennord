// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildFileReadEvent, reportFileRead, resetFileReadSession, verdictOf, type FileReadDetail } from './file-read';
import { FILE_SUPPORT_PREF_KEY, readFileSupportOptIn, writeFileSupportOptIn } from './file-support-pref';
import { synthFwBody, synthFwFile, synthLegacyFile } from '../clavia/block-chain.synth';
import { buildCbinHeader } from '../clavia/cbin';
import { NG_LAYOUT } from '../ng/layout.generated';
import { httpDiagnostics } from '../capabilities/defaults';
import type { DiagnosticEvent, Diagnostics } from '../capabilities/types';
import { BUILD, COMMIT } from '../version';

/** A Nord Grand program built the way its firmware lays it out (block-chain reader). */
const grandFile = (versionRaw = 100) => synthFwFile('ngp', synthFwBody(NG_LAYOUT), versionRaw);

/** A Stage Classic / EX file: its record's place is not known yet, so it opens header-only. */
const stageClassicFile = () => synthLegacyFile('nspg', 10, new Uint8Array(398));

function sink(): Diagnostics & { events: DiagnosticEvent[] } {
  const events: DiagnosticEvent[] = [];
  return { events, record: (e) => { events.push(e); } };
}

const on = () => true;

beforeEach(() => {
  resetFileReadSession();
  localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

describe('buildFileReadEvent', () => {
  it('describes a program the reader matched: tag, model, size, header fields, framing, verdict, build', () => {
    const bytes = grandFile();
    const e = buildFileReadEvent(bytes)!;
    expect(e.kind).toBe('file.read');
    expect(e.ok).toBe(true);
    expect(e.message).toBe(`ngp ${bytes.length} B: read`);
    const d = e.detail as unknown as FileReadDetail;
    expect(d).toMatchObject({
      tag: 'ngp',
      modelId: 'grand',
      size: bytes.length,
      cbinFormatType: 1,
      versionField0x14: 100,
      framing: { bodyOffset: 0x2c },
      reader: { layoutMatched: true, headerOnly: false, warningCount: 0, warnings: [], outOfRange: 0 },
      app: { build: BUILD, commit: COMMIT },
    });
    // 0x14–0x17: version 100 (LE) and the two bytes before the checksum.
    expect(d.framing.at0x14).toBe('64000000');
    // Body: the u32 BE format version, then the first block's length byte — no payload.
    const v = NG_LAYOUT.versionRange?.[0] ?? 100;
    expect(d.framing.atBody).toBe(
      v.toString(16).padStart(8, '0') + NG_LAYOUT.blocks[0].length.toString(16).padStart(2, '0'));
    expect(d.reader.recordVersion).toBe(v);
  });

  it('reports a header-only read as not ok, with the reader’s generic warning', () => {
    const bytes = stageClassicFile();
    const e = buildFileReadEvent(bytes)!;
    expect(e.ok).toBe(false);
    expect(e.message).toBe(`nspg ${bytes.length} B: header-only`);
    const d = e.detail as unknown as FileReadDetail;
    expect(d.cbinFormatType).toBe(0);
    expect(d.versionField0x14).toBe(10);
    expect(d.framing.bodyOffset).toBe(0x18);
    expect(d.reader).toMatchObject({ layoutMatched: false, headerOnly: true });
    expect(d.reader.warningCount).toBeGreaterThan(0);
    expect(d.reader.warnings.join(' ')).toMatch(/only the file header/i);
  });

  it('captures only framing bytes — never the checksum, parameter bits or anything a player could have typed', () => {
    // Plant a would-be name everywhere outside the framing windows: header gaps and the body.
    const bytes = grandFile();
    const marker = Array.from('MyBallad', (c) => c.charCodeAt(0));
    bytes.set([0xde, 0xad, 0xbe, 0xef], 0x18); // the NSM-era CRC-32
    bytes.set(marker, 0x1c);                 // reserved header bytes
    bytes.set(marker, 0x2c + 8);             // inside the body, past the window
    bytes.set(marker, bytes.length - 8);     // end of file
    const json = JSON.stringify(buildFileReadEvent(bytes));
    const markerHex = marker.map((b) => b.toString(16)).join('');
    expect(json).not.toContain('MyBallad');
    expect(json).not.toContain(markerHex.slice(0, 8));
    expect(json).not.toContain('dead');
    const d = buildFileReadEvent(bytes)!.detail as unknown as FileReadDetail;
    expect(d.framing.at0x14).toHaveLength(8);
    expect(d.framing.atBody).toHaveLength(10); // u32 format version + first block length
  });

  it('takes only the record version from a legacy record', () => {
    const bytes = synthLegacyFile('nspg', 10, new Uint8Array(398).fill(0xee));
    const d = buildFileReadEvent(bytes)!.detail as unknown as FileReadDetail;
    expect(d.framing.atBody).toHaveLength(4);
    expect(JSON.stringify(d.framing)).not.toContain('ee');
  });

  it('never reports a sample (samples embed their name), a non-program file or an unrecognized one', () => {
    const header = buildCbinHeader({ formatType: 1, tag: 'nsmp', bank: 0, location: 0, category: 0, versionRaw: 400 });
    const sample = new Uint8Array(200);
    sample.set(header);
    sample.set(Array.from('hdr', (c) => c.charCodeAt(0)), 0x40);
    expect(buildFileReadEvent(sample)).toBeNull();
    const piano = new Uint8Array(200);
    piano.set(buildCbinHeader({ formatType: 1, tag: 'npno', bank: 0, location: 0, category: 0, versionRaw: 600 }));
    expect(buildFileReadEvent(piano)).toBeNull();
    expect(buildFileReadEvent(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

  it('fits the backend’s 16 KB body cap once posted', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    reportFileRead(httpDiagnostics('https://api.example/v1/diag'), stageClassicFile(), on);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((fetchMock.mock.calls[0][1].body as string).length).toBeLessThan(16 * 1024);
  });
});

describe('verdictOf', () => {
  it('caps warnings and counts out-of-range values', () => {
    const v = verdictOf({ layoutMatched: true, recordVersion: 7, outOfRange: ['a', 'b'], warnings: Array(15).fill('x'.repeat(300)) });
    expect(v).toMatchObject({ layoutMatched: true, recordVersion: 7, outOfRange: 2, warningCount: 15 });
    expect(v.warnings).toHaveLength(10);
    expect(v.warnings[0].length).toBeLessThanOrEqual(200);
  });
});

describe('reportFileRead', () => {
  it('sends nothing while the setting is off (the default)', () => {
    const s = sink();
    expect(readFileSupportOptIn()).toBe(false);
    expect(reportFileRead(s, grandFile())).toBe(false);
    expect(s.events).toHaveLength(0);
  });

  it('sends once the player opts in on this device', () => {
    const s = sink();
    writeFileSupportOptIn(true);
    expect(localStorage.getItem(FILE_SUPPORT_PREF_KEY)).toBe('on');
    expect(reportFileRead(s, grandFile())).toBe(true);
    expect(s.events).toHaveLength(1);
    writeFileSupportOptIn(false);
    expect(localStorage.getItem(FILE_SUPPORT_PREF_KEY)).toBeNull();
    expect(reportFileRead(s, stageClassicFile())).toBe(false);
  });

  it('reports each distinct file once per session, and the dedupe key is never sent', () => {
    const s = sink();
    expect(reportFileRead(s, grandFile(), on)).toBe(true);
    expect(reportFileRead(s, grandFile(), on)).toBe(false); // same bytes, new array
    expect(reportFileRead(s, grandFile(101), on)).toBe(true); // different file
    expect(s.events).toHaveLength(2);
    expect(JSON.stringify(s.events)).not.toMatch(/hash|key/i);
    resetFileReadSession();
    expect(reportFileRead(s, grandFile(), on)).toBe(true);
  });

  it('never throws, even when the sink does', () => {
    const bad: Diagnostics = { record: () => { throw new Error('down'); } };
    expect(() => reportFileRead(bad, grandFile(), on)).not.toThrow();
  });
});
