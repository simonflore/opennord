import { describe, expect, it } from 'vitest';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';
import { ns2SynthFile } from '../ns2/file.synth';
import { NS2_LAYOUT } from '../ns2/layout.generated';
import { ns3SynthFile } from '../ns3/file.synth';
import { fileByteMap } from './byte-map';

describe('fileByteMap', () => {
  it('maps every byte of a Stage 2 program: header, record version, parameters, reserved bits', () => {
    const bytes = ns2SynthFile();
    const map = fileByteMap(bytes, 'stage-2');
    expect(map.layoutName).toBe('Nord Stage 2');
    expect(map.bytes.filter((b) => b.role === 'unmapped')).toEqual([]);
    expect(map.bytes[0x0e].labels).toEqual(['location in bank']);
    expect(map.bytes[0x18].labels).toEqual(['checksum (CRC-32)']);
    expect(map.bytes[0x2c]).toEqual({ role: 'structure', labels: ['record version'] });
    // Slot A's synth container starts at data byte 177: the mod envelope attack.
    expect(map.bytes[0x2e + 177].labels).toContain('slotA_synth.modEnvelopeAttack');
    // Reserved space in the record reads as unused, not as a gap.
    expect(map.bytes.some((b) => b.role === 'unused' && b.labels[0] === 'reserved')).toBe(true);
    expect(map.fields.find((f) => f.key === 'slotA_synth.filterFrequency')?.value).toBe(127);
  });

  it('maps a legacy-header Stage 2 program with its CRC-16 trailer', () => {
    const bytes = synthLegacyLayoutFile('ns2p', NS2_LAYOUT);
    const map = fileByteMap(bytes, 'stage-2');
    expect(map.bytes.filter((b) => b.role === 'unmapped')).toEqual([]);
    expect(map.bytes[bytes.length - 1].labels).toEqual(['checksum (CRC-16)']);
  });

  it('maps a Stage 3 program block by block', () => {
    const map = fileByteMap(ns3SynthFile(), 'stage-3');
    expect(map.bytes.filter((b) => b.role === 'unmapped')).toEqual([]);
    expect(map.bytes[0x2c + 4].labels).toEqual(['block length · Common:MultiCommon']);
  });

  it('leaves the body unmapped, saying why, when no layout fits', () => {
    const map = fileByteMap(ns3SynthFile(), 'stage-2');
    expect(map.layoutName).toBeNull();
    expect(map.note).toMatch(/record is \d+ bytes; the Nord Stage 2 layout makes 519/);
    expect(map.bytes[0x08].labels).toEqual(['file type tag']);
    const notNord = fileByteMap(new Uint8Array(60), 'stage-2');
    expect(notNord.note).toMatch(/Not a Nord file/);
    expect(notNord.bytes.every((b) => b.role === 'unmapped')).toBe(true);
  });
});
