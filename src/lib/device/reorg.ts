import type { ProgramEntry } from './transfer';
import { formatSlot, BANK_LETTERS } from '../clavia/slot';

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

export type ArrangeMode = 'name' | 'compact';

/** Tidy one bank in a single batch: 'name' sorts A–Z, 'compact' removes gaps
 *  (order preserved). Because the executor journals every source up front and
 *  each copy reads its pre-mutation bytes, an arbitrary in-bank rearrangement is
 *  just copies-to-targets + tail deletes — no scratch slot, no execute.ts change. */
export function planArrange(occ: Occupancy, bank: number, mode: ArrangeMode): Plan | PlanError {
  const progs = [...occ.values()].filter((e) => e.bank === bank);
  if (progs.length < 2) return { error: 'Nothing to arrange in this bank.' };
  const ordered = [...progs].sort((a, b) =>
    mode === 'name'
      ? (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }) || a.slot - b.slot
      : a.slot - b.slot,
  );
  const n = ordered.length;
  const ops: Op[] = [];
  ordered.forEach((p, i) => {
    if (p.slot !== i) ops.push({ kind: 'copy', from: { bank, slot: p.slot }, to: { bank, slot: i } });
  });
  for (const p of progs) {
    if (p.slot >= n) ops.push({ kind: 'delete', at: { bank, slot: p.slot } });
  }
  if (ops.length === 0) return { error: 'This bank is already arranged.' };
  // Journal every slot any op touches — guarantees each copy's source is journaled
  // and rollback can restore the whole bank.
  const seen = new Set<string>();
  const journalSlots: Addr[] = [];
  for (const op of ops) {
    for (const a of op.kind === 'copy' ? [op.from, op.to] : [op.at]) {
      if (!seen.has(addrKey(a))) { seen.add(addrKey(a)); journalSlots.push(a); }
    }
  }
  const label = BANK_LETTERS[bank & 0x7] ?? String(bank);
  return mode === 'name'
    ? { ops, journalSlots, title: 'Sort bank A–Z', summary: `Sort ${n} programs in Bank ${label} alphabetically` }
    : { ops, journalSlots, title: 'Compact bank', summary: `Compact ${n} programs in Bank ${label}` };
}
