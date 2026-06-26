import { describe, it, expect } from 'vitest';
import { USER_PARTITIONS, partitionForPath, backupPath, disambiguatePath, buildMetaXml } from './ns4b';

describe('ns4b helpers', () => {
  it('USER_PARTITIONS covers the six user partitions', () => {
    expect(USER_PARTITIONS.map((p) => p.partition)).toEqual([6, 7, 8, 9, 10, 11]);
    expect(USER_PARTITIONS.find((p) => p.partition === 6)).toMatchObject({ folder: 'Program', ext: 'ns4p' });
    expect(USER_PARTITIONS.find((p) => p.partition === 10)).toMatchObject({ folder: 'Live', ext: 'ns4l' });
  });

  it('partitionForPath maps user extensions and skips factory/unknown', () => {
    expect(partitionForPath('Program/Bank C/X.ns4p')).toBe(6);
    expect(partitionForPath('Organ Preset/Bank 1/X.ns4o')).toBe(7);
    expect(partitionForPath('Live/Bank 1/Live 2.ns4l')).toBe(10);
    expect(partitionForPath('Settings/Bank 1/Settings.ns4t')).toBe(11);
    expect(partitionForPath('Piano/Grand/Royal.npno')).toBeNull();
    expect(partitionForPath('Samp Lib/Pad/X.nsmp4')).toBeNull();
    expect(partitionForPath('meta.xml')).toBeNull();
  });

  it('partitionForPath parses the basename — a dot in a folder name is not the extension', () => {
    expect(partitionForPath('Samp Lib/Pad.1/x.ns4p')).toBe(6); // folder has a dot; file is .ns4p
    expect(partitionForPath('Program/Bank C/No Extension')).toBeNull(); // dotless filename → skip
  });

  it('backupPath uses letter banks for Program, number banks otherwise', () => {
    const program = USER_PARTITIONS.find((p) => p.partition === 6)!;
    const synth = USER_PARTITIONS.find((p) => p.partition === 9)!;
    expect(backupPath(program, 2, 'Euphoria')).toBe('Program/Bank C/Euphoria.ns4p');
    expect(backupPath(synth, 3, 'Pulse Pluck')).toBe('Synth Preset/Bank 4/Pulse Pluck.ns4y');
  });

  it('disambiguatePath suffixes "(slot N)" only when the plain path is already taken', () => {
    const program = USER_PARTITIONS.find((p) => p.partition === 6)!;
    const taken = new Set(['Program/Bank A/Lead.ns4p']);
    const has = (p: string) => taken.has(p);
    expect(disambiguatePath(program, 0, 'Pad', 1, has)).toBe('Program/Bank A/Pad.ns4p'); // free
    expect(disambiguatePath(program, 0, 'Lead', 5, has)).toBe('Program/Bank A/Lead (slot 5).ns4p'); // collision
  });

  it('buildMetaXml is well-formed with the backup format version', () => {
    const xml = buildMetaXml(0);
    expect(xml).toContain('backup_format_version="1"');
    expect(xml).toContain('product_content_version="0"');
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});
