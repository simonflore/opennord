/**
 * Where a new file goes: the first empty place, bank by bank, as NSM's
 * `GetFirstAvailableLocation` scans (a place being filled earlier in
 * the same batch counts as used). A restore prefers the place in the file's own
 * header (`CreateDownloadEntry`). Pure.
 */
import type { BankInfo } from './capacity';
import { addrKey, type Addr } from './reorg';

export function firstFreeLocation(
  occupied: { bank: number; slot: number }[],
  banks: Pick<BankInfo, 'slotCapacity'>[],
  { prefer, taken = [] }: { prefer?: Addr; taken?: Addr[] } = {},
): Addr | null {
  const used = new Set([...occupied, ...taken].map((a) => addrKey({ bank: a.bank, slot: a.slot })));
  const isFree = (a: Addr) =>
    a.bank >= 0 && a.bank < banks.length && a.slot >= 0 && a.slot < banks[a.bank].slotCapacity && !used.has(addrKey(a));
  if (prefer && isFree(prefer)) return prefer;
  for (let bank = 0; bank < banks.length; bank++) {
    for (let slot = 0; slot < banks[bank].slotCapacity; slot++) {
      if (!used.has(addrKey({ bank, slot }))) return { bank, slot };
    }
  }
  return null;
}
