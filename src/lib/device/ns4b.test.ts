import { describe, it, expect } from 'vitest';
import { USER_PARTITIONS, partitionForPath, backupPath, buildMetaXml } from './ns4b';

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

  it('backupPath uses letter banks for Program, number banks otherwise', () => {
    const program = USER_PARTITIONS.find((p) => p.partition === 6)!;
    const synth = USER_PARTITIONS.find((p) => p.partition === 9)!;
    expect(backupPath(program, 2, 'Euphoria')).toBe('Program/Bank C/Euphoria.ns4p');
    expect(backupPath(synth, 3, 'Pulse Pluck')).toBe('Synth Preset/Bank 4/Pulse Pluck.ns4y');
  });

  it('buildMetaXml is well-formed with the backup format version', () => {
    const xml = buildMetaXml(0);
    expect(xml).toContain('backup_format_version="1"');
    expect(xml).toContain('product_content_version="0"');
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});
