/**
 * Live files store the program record verbatim (real files: `.ns2l` = `.ns2p`,
 * 547 bytes legacy; `.ns3l` = `.ns3f`, 592 NSM-era), so a Live file reads with
 * its model's program reader — when its record has the program record's length.
 * Otherwise, and for Settings / Songs / Set Lists, the file is identified only.
 */
import { describe, it, expect } from 'vitest';
import { parseClaviaFile, programTagFor } from './formats';
import { decodedProgramFor } from './presenters';
import { identifyNordFile } from './clavia/nord-file';
import { buildCbinHeader } from './clavia/cbin';
import { synthLegacyLayoutFile } from './clavia/block-chain.synth';
import type { LegacyLayout } from './clavia/legacy-record';
import { NS2_LAYOUT } from './ns2/layout.generated';
import { NE3HP_LAYOUT } from './ne3/layout-hp.generated';
import { NE5_LAYOUT } from './ne5/layout.generated';
import { NP1_LAYOUT } from './np1/layout.generated';
import { NP2_LAYOUT } from './np2/layout.generated';
import { NP3_LAYOUT } from './np3/layout.generated';
import { NCP_LAYOUT } from './nc/layout.generated';
import { NC2_LAYOUT } from './nc2/layout.generated';

const tagFor = (bytes: Uint8Array) => programTagFor(identifyNordFile(bytes), bytes);

/** Grow or shrink a legacy file's record by `delta` bytes, keeping its 2-byte trailer. */
function resize(bytes: Uint8Array, delta: number): Uint8Array {
  const out = new Uint8Array(bytes.length + delta);
  out.set(bytes.subarray(0, Math.min(bytes.length, out.length) - 2));
  out.set(bytes.subarray(bytes.length - 2), out.length - 2);
  return out;
}

describe('Stage 2 / 3 Live files', () => {
  it('reads a .ns2l as a Stage 2 program, behind either header (547 / 565 bytes)', () => {
    for (const nsmHeader of [false, true]) {
      const live = synthLegacyLayoutFile('ns2l', NS2_LAYOUT, {}, { nsmHeader });
      expect(live).toHaveLength(nsmHeader ? 565 : 547);
      expect(tagFor(live)).toBe('ns2p');
      const f = parseClaviaFile(live);
      expect(f.model).toBe('ns2');
      expect(f.engines).toBeDefined();
      expect(decodedProgramFor(live)?.title).toMatch(/Stage 2/);
    }
  });

  it('identifies a .ns2l of another length without decoding it', () => {
    const odd = resize(synthLegacyLayoutFile('ns2l', NS2_LAYOUT), 4);
    expect(identifyNordFile(odd)).toMatchObject({ kind: 'live', kindLabel: 'Live', modelId: 'stage-2' });
    expect(tagFor(odd)).toBeUndefined();
    expect(parseClaviaFile(odd).engines).toBeUndefined();
    expect(decodedProgramFor(odd)).toBeNull();
  });

  it('reads a .ns3l with the Stage 3 program reader (its blocks are self-delimiting)', () => {
    const ns3l = new Uint8Array(592);
    ns3l.set(buildCbinHeader({ formatType: 1, tag: 'ns3l', bank: 0, location: 0, category: 0, versionRaw: 304 }));
    expect(tagFor(ns3l)).toBe('ns3f');
  });

  it('never decodes Settings, Songs or Synth presets as programs', () => {
    for (const tag of ['ns3t', 'ns3s', 'ns3y', 'ns2y', 'ns2s']) {
      const file = new Uint8Array(592);
      file.set(buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw: 304 }));
      expect(tagFor(file), tag).toBeUndefined();
      expect(parseClaviaFile(file).engines, tag).toBeUndefined();
      expect(decodedProgramFor(file), tag).toBeNull();
    }
  });
});

describe('legacy-record Live files route to the program reader when the record matches', () => {
  const cases: [live: string, program: string, layout: LegacyLayout, model: string, title: string][] = [
    ['neli', 'nepg', NE3HP_LAYOUT, 'ne3', 'Nord Electro 3 · Program'],
    ['ne5l', 'ne5p', NE5_LAYOUT, 'ne5', 'Nord Electro 5 · Program'],
    ['npli', 'nppg', NP1_LAYOUT, 'np1', 'Nord Piano · Program'],
    ['np2l', 'np2p', NP2_LAYOUT, 'np2', 'Nord Piano 2 · Program'],
    ['np3l', 'np3p', NP3_LAYOUT, 'np3', 'Nord Piano 3 · Program'],
    ['ncli', 'ncpg', NCP_LAYOUT, 'nc', 'Nord C2 · Program'],
    ['nc2l', 'nc2p', NC2_LAYOUT, 'nc2', 'Nord C2D · Program'],
  ];
  for (const [live, program, layout, model, title] of cases) {
    it(`${live} → ${program} reader`, () => {
      const file = synthLegacyLayoutFile(live, layout, {}, { version: layout.recordVersion ?? 0 });
      expect(tagFor(file)).toBe(program);
      const f = parseClaviaFile(file);
      expect(f.model).toBe(model);
      expect(f.program.parsed).toBe(true);
      expect(decodedProgramFor(file)?.title).toBe(title);
    });

    it(`${live} of another record length is identified only`, () => {
      const file = resize(synthLegacyLayoutFile(live, layout, {}, { version: layout.recordVersion ?? 0 }), -1);
      expect(identifyNordFile(file).kind).toBe('live');
      expect(tagFor(file)).toBeUndefined();
      expect(parseClaviaFile(file).model).toBe('unknown');
      expect(decodedProgramFor(file)).toBeNull();
    });
  }
});
