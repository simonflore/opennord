import type { ProgramEntry } from './transfer';
import { pullFile, pushFile, deleteProgram, decodeFileInfo } from './transfer';
import { CQryFileInfo } from './opcodes';
import type { NordSession } from './session';
import type { Addr } from './reorg';

export interface DeviceIO {
  /** Read the full CBIN file (header + body) at the entry's slot. */
  pull(partition: number, entry: ProgramEntry): Promise<Uint8Array>;
  /** Write a full CBIN file to a slot (overwrites). */
  push(partition: number, addr: Addr, file: Uint8Array, name: string): Promise<void>;
  delete(partition: number, addr: Addr): Promise<void>;
  /** Slot metadata, or null if the slot is empty. */
  info(partition: number, addr: Addr): Promise<ProgramEntry | null>;
}

/** Real DeviceIO. Assumes the caller has an open `withSession(partition)` around the plan. */
export function sessionDeviceIO(session: NordSession): DeviceIO {
  return {
    pull: (_partition, entry) => pullFile(session, entry),
    push: (_partition, addr, file, name) => pushFile(session, addr.bank, addr.slot, file, name),
    delete: (_partition, addr) => deleteProgram(session, addr.bank, addr.slot),
    async info(_partition, addr) {
      const reply = await session.requestRaw(CQryFileInfo, [addr.bank, addr.slot]);
      if (reply.status !== 0) return null;
      return decodeFileInfo(reply.payload, addr.bank, addr.slot);
    },
  };
}
