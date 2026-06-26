import type { ProgramEntry } from './transfer';
import { formatSlot } from '../clavia/slot';

export interface Addr { bank: number; slot: number }
export type Op = { kind: 'copy'; from: Addr; to: Addr } | { kind: 'delete'; at: Addr };
export interface Plan { ops: Op[]; journalSlots: Addr[]; title: string; summary: string }
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
    title: 'Move program',
    summary: `Move "${src.name || formatSlot(from.bank, from.slot)}" from ${formatSlot(from.bank, from.slot)} to ${formatSlot(to.bank, to.slot)}`,
  };
}

/** Swap two occupied slots. Two journaled copies — the executor reads each copy's
 *  source from its pre-mutation journal, so b's bytes survive a's overwrite. No
 *  scratch slot, no delete. */
export function planSwap(occ: Occupancy, a: Addr, b: Addr): Plan | PlanError {
  if (addrKey(a) === addrKey(b)) return { error: 'Source and target are the same slot.' };
  const A = occ.get(addrKey(a));
  const B = occ.get(addrKey(b));
  if (!A || !B) return { error: 'Both slots must hold a program to swap.' };
  return {
    ops: [
      { kind: 'copy', from: a, to: b },
      { kind: 'copy', from: b, to: a },
    ],
    journalSlots: [a, b],
    title: 'Swap programs',
    summary: `Swap "${A.name || formatSlot(a.bank, a.slot)}" (${formatSlot(a.bank, a.slot)}) and "${B.name || formatSlot(b.bank, b.slot)}" (${formatSlot(b.bank, b.slot)})`,
  };
}

/** A drop from `from` onto `to`: move into an empty target, swap with an occupied one. */
export function planReorg(occ: Occupancy, from: Addr, to: Addr): Plan | PlanError {
  if (addrKey(from) === addrKey(to)) return { error: 'Dropped on the same slot.' };
  return occ.has(addrKey(to)) ? planSwap(occ, from, to) : planMove(occ, from, to);
}
