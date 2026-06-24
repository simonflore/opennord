import type { ProgramEntry } from './transfer';
import { formatSlot } from '../clavia/slot';

export interface Addr { bank: number; slot: number }
export type Op = { kind: 'copy'; from: Addr; to: Addr } | { kind: 'delete'; at: Addr };
export interface Plan { ops: Op[]; journalSlots: Addr[]; summary: string }
export interface PlanError { error: string }
export type Occupancy = Map<string, ProgramEntry>;

export function addrKey(a: Addr): string {
  return `${a.bank}:${a.slot}`;
}

export function buildOccupancy(entries: ProgramEntry[]): Occupancy {
  const m: Occupancy = new Map();
  for (const e of entries) m.set(addrKey({ bank: e.bank, slot: e.slot }), e);
  return m;
}

export function isPlanError(p: Plan | PlanError): p is PlanError {
  return (p as PlanError).error !== undefined;
}

/** Plan a move of one program into an empty slot. Copy-then-delete (no move opcode). */
export function planMove(occ: Occupancy, from: Addr, to: Addr): Plan | PlanError {
  if (addrKey(from) === addrKey(to)) return { error: 'Source and target are the same slot.' };
  const src = occ.get(addrKey(from));
  if (!src) return { error: 'There is no program in the source slot.' };
  if (occ.has(addrKey(to))) return { error: 'The target slot is already occupied.' };
  return {
    ops: [
      { kind: 'copy', from, to },
      { kind: 'delete', at: from },
    ],
    journalSlots: [from, to],
    summary: `Move "${src.name || formatSlot(from.bank, from.slot)}" from ${formatSlot(from.bank, from.slot)} to ${formatSlot(to.bank, to.slot)}`,
  };
}
