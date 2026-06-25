import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { buildCbinHeader } from '../clavia/cbin';
import { patchNs4Checksum } from '../clavia/checksum';
import { buildMetaXml } from './ns4b';
import { PARTITION_PROGRAM } from './opcodes';
import { buildOccupancy, planMove, type Plan } from './reorg';
import { executePlan } from './execute';
import { loadBackup, backupDeviceIO, listPrograms, serializeBackup, type BackupModel } from './backup-io';
import type { DeviceIO } from './device-io';

const PART = PARTITION_PROGRAM;

/** A synthetic full CBIN .ns4p file (44-byte header + body), addressed to {bank,slot}. */
function cbinFile(bank: number, slot: number, bodyLen = 4): Uint8Array {
  const header = buildCbinHeader({ formatType: 1, tag: 'ns4p', bank, location: slot, category: 6, versionRaw: 313 });
  const file = new Uint8Array(header.length + bodyLen);
  file.set(header, 0);
  return patchNs4Checksum(file);
}

function synthBackup(): Uint8Array {
  return zipSync({
    'meta.xml': strToU8(buildMetaXml(0)),
    'Program/Bank A/Lead.ns4p': cbinFile(0, 0),
    'Program/Bank A/Pad.ns4p': cbinFile(0, 1),
    'Samp Lib/Bank 1/Factory.nsmp4': new Uint8Array([1, 2, 3]), // non-program passthrough
  }, { level: 0 });
}

describe('backup-io', () => {
  it('loads a backup and lists program entries by {bank,slot}', () => {
    const model = loadBackup(synthBackup());
    const progs = listPrograms(model).sort((a, b) => a.slot - b.slot);
    expect(progs.map((p) => [p.bank, p.slot, p.name])).toEqual([[0, 0, 'Lead'], [0, 1, 'Pad']]);
    expect(model.passthrough.has('Samp Lib/Bank 1/Factory.nsmp4')).toBe(true); // non-program kept
  });

  it('rejects a non-Nord zip', () => {
    const notBackup = zipSync({ 'hello.txt': strToU8('hi') }, { level: 0 });
    expect(() => loadBackup(notBackup)).toThrow(/not a nord backup/i);
  });

  it('moves a program via the real engine: target occupied, source empty, header + checksum rewritten', async () => {
    const model = loadBackup(synthBackup());
    const io = backupDeviceIO(model);
    const occ = buildOccupancy(listPrograms(model));
    const plan = planMove(occ, { bank: 0, slot: 0 }, { bank: 0, slot: 5 }) as Plan;

    const res = await executePlan(io, PART, plan, occ);
    expect(res.ok).toBe(true);

    const after = listPrograms(model);
    expect(after.find((p) => p.slot === 5)?.name).toBe('Lead');
    expect(after.find((p) => p.slot === 0)).toBeUndefined();

    // moved file's CBIN header now addresses bank 0 / location 5
    const moved = await io.pull(PART, { bank: 0, slot: 5, name: 'Lead', categoryId: 6, version: 313, sizeBytes: 4, fourcc: 'ns4p' });
    expect(moved[0x0c]).toBe(0);
    expect(moved[0x0e]).toBe(5);
    // checksum re-sealed: re-patching yields identical bytes
    expect([...patchNs4Checksum(moved)]).toEqual([...moved]);
  });

  it('serializes and round-trips the move with a clean name (no "(slot N)" suffix)', async () => {
    const model = loadBackup(synthBackup());
    const io = backupDeviceIO(model);
    const occ = buildOccupancy(listPrograms(model));
    await executePlan(io, PART, planMove(occ, { bank: 0, slot: 0 }, { bank: 0, slot: 5 }) as Plan, occ);

    const round = loadBackup(serializeBackup(model));
    const progs = listPrograms(round).sort((a, b) => a.slot - b.slot);
    expect(progs.map((p) => [p.slot, p.name])).toEqual([[1, 'Pad'], [5, 'Lead']]); // clean 'Lead', not 'Lead (slot 5)'
  });

  it('rolls the model back to its original state when a copy push fails', async () => {
    const model = loadBackup(synthBackup());
    const base = backupDeviceIO(model);
    let pushes = 0;
    const failIo: DeviceIO = {
      ...base,
      push: async (...args) => { if (pushes++ === 0) throw new Error('boom'); return base.push(...args); },
    };
    const occ = buildOccupancy(listPrograms(model));
    const res = await executePlan(failIo, PART, planMove(occ, { bank: 0, slot: 0 }, { bank: 0, slot: 5 }) as Plan, occ);
    expect(res.ok).toBe(false);
    expect(res.rolledBack).toBe(true);
    const after = listPrograms(model).sort((a, b) => a.slot - b.slot);
    expect(after.map((p) => [p.slot, p.name])).toEqual([[0, 'Lead'], [1, 'Pad']]); // unchanged
  });
});
