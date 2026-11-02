import { describe, it, expect } from 'vitest';
import {
  NON_LIBRARY_PARTITIONS, USER_PARTITIONS, backupPath, buildMetaXml, disambiguatePath, libraryForPartition, nameFromPath, partitionForPath,
} from './ns4b';

describe('ns4b helpers', () => {
  it('USER_PARTITIONS covers the six user partitions, then the Piano and Sample libraries', () => {
    expect(USER_PARTITIONS.map((p) => p.partition)).toEqual([6, 7, 8, 9, 10, 11, 1, 5]);
    expect(USER_PARTITIONS.find((p) => p.partition === 6)).toMatchObject({ folder: 'Program', ext: 'ns4p' });
    expect(USER_PARTITIONS.find((p) => p.partition === 10)).toMatchObject({ folder: 'Live', ext: 'ns4l' });
    expect(USER_PARTITIONS.find((p) => p.partition === 1)).toMatchObject({ folder: 'Piano', ext: 'npno', library: 'piano' });
    expect(USER_PARTITIONS.find((p) => p.partition === 5)).toMatchObject({ folder: 'Samp Lib', ext: 'nsmp4', library: 'sample' });
  });

  it('NON_LIBRARY_PARTITIONS is every user partition but the two libraries', () => {
    expect(NON_LIBRARY_PARTITIONS.map((p) => p.partition)).toEqual([6, 7, 8, 9, 10, 11]);
    expect(NON_LIBRARY_PARTITIONS.every((p) => p.library === undefined)).toBe(true);
  });

  it('partitionForPath maps every backed-up extension and skips unknown ones', () => {
    expect(partitionForPath('Program/Bank C/X.ns4p')).toBe(6);
    expect(partitionForPath('Organ Preset/Bank 1/X.ns4o')).toBe(7);
    expect(partitionForPath('Live/Bank 1/Live 2.ns4l')).toBe(10);
    expect(partitionForPath('Settings/Bank 1/Settings.ns4t')).toBe(11);
    expect(partitionForPath('Piano/Grand/Royal.npno')).toBe(1);
    expect(partitionForPath('Samp Lib/Pad/X.nsmp4')).toBe(5);
    expect(partitionForPath('Samp Lib/Pad/Old.nsmp3')).toBeNull();
    expect(partitionForPath('meta.xml')).toBeNull();
  });

  it('libraryForPartition names the two libraries only', () => {
    expect(libraryForPartition(5)).toBe('sample');
    expect(libraryForPartition(1)).toBe('piano');
    expect(libraryForPartition(6)).toBeNull();
  });

  it('nameFromPath is the file name without its folders or extension', () => {
    expect(nameFromPath('Piano/Bank 1/White Grand XL 6.3.npno')).toBe('White Grand XL 6.3');
    expect(nameFromPath('Program/Bank A/Lead.ns4p')).toBe('Lead');
    expect(nameFromPath('Samp Lib/Pad.1/No Extension')).toBe('No Extension');
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

  it('backupPath turns a slash into _ to stay in its bank folder, keeps a backslash, and restore reads that name back', () => {
    const samples = USER_PARTITIONS.find((p) => p.partition === 5)!;
    for (const [name, saved] of [['Pads/Strings', 'Pads_Strings'], ['Back\\slash', 'Back\\slash'], ['Intro: Pad?', 'Intro: Pad?']]) {
      const path = backupPath(samples, 0, name);
      expect(path).toBe(`Samp Lib/Bank 1/${saved}.nsmp4`);
      expect(path.split('/')).toHaveLength(3); // no extra folder
      expect(nameFromPath(path)).toBe(saved);
      expect(partitionForPath(path)).toBe(5);
    }
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
