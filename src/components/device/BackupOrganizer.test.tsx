// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { zipSync, strToU8 } from 'fflate';
import { buildCbinHeader } from '../../lib/clavia/cbin';
import { patchNs4Checksum } from '../../lib/clavia/checksum';
import { buildMetaXml } from '../../lib/device/ns4b';
import { loadBackup } from '../../lib/device/backup-io';
import { BackupOrganizer } from './BackupOrganizer';

// Mutable state that vi.mock closes over — tests can change it between renders.
let __bundles: { path: string; size: number }[] = [];

// Mock useFolder so BackupOrganizer can call it without a FolderProvider.
vi.mock('../../lib/folder/FolderContext', () => ({
  useFolder: () => ({ bundles: __bundles, openBundle: vi.fn(), folderName: null, writeBack: vi.fn() }),
}));

// Mock useWriteBackPref so BackupOrganizer can call it without localStorage.
vi.mock('../../lib/library/writeBackPrefs', () => ({
  useWriteBackPref: () => ({ mode: 'ask', setMode: vi.fn() }),
}));

function cbinFile(bank: number, slot: number): Uint8Array {
  const h = buildCbinHeader({ formatType: 1, tag: 'ns4p', bank, location: slot, category: 6, versionRaw: 313 });
  const f = new Uint8Array(h.length + 4); f.set(h, 0); return patchNs4Checksum(f);
}
const model = () => loadBackup(zipSync({
  'meta.xml': strToU8(buildMetaXml(0)),
  'Program/Bank A/Lead.ns4p': cbinFile(0, 0),
}, { level: 0 }));

describe('BackupOrganizer', () => {
  it('prompts to open a backup when none is loaded', () => {
    __bundles = [];
    const html = renderToStaticMarkup(<BackupOrganizer onBack={() => {}} />);
    expect(html).toMatch(/open a backup/i);
    expect(html).toContain('disabled'); // download disabled until a backup is loaded
  });

  it('renders the program grid and an enabled download once a backup is loaded', () => {
    __bundles = [];
    const html = renderToStaticMarkup(<BackupOrganizer onBack={() => {}} initialModel={model()} />);
    expect(html).toContain('Lead');                 // the program is shown
    expect(html).toContain('data-slot=');           // SlotGrid rendered
    expect(html).toMatch(/download/i);              // download action present
  });

  it('offers the folder bundles to organize when several exist', () => {
    __bundles = [
      { path: '/folder/A.ns4b', size: 3_160_000_000 },
      { path: '/folder/B.ns4b', size: 2_100_000_000 },
    ];
    const html = renderToStaticMarkup(<BackupOrganizer onBack={() => {}} />);
    expect(html).toMatch(/organize which backup/i);
  });
});
