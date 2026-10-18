import { programSlotLayout, type ModelInfo, type SlotLayout } from '../clavia/partitions';
import type { BankInfo } from './capacity';
import type { ProgramEntry } from './transfer';

/**
 * The slots a device view draws, from the best source there is: the Nord's own
 * bank list (`CRpyBankList`, read with the partition's capacity), else the model's
 * recorded Program partition shape, else a Stage 4's. Then grown to reach every
 * file the Nord listed: a shape is a record, not a promise, so a file outside it
 * (an OS with more slots, a model whose shape isn't known) still gets its cell,
 * and a view never hides something that is on the Nord.
 */
export function deviceSlotLayout(
  model: ModelInfo | undefined, entries: readonly ProgramEntry[], bankList?: readonly BankInfo[] | null,
): SlotLayout {
  let { banks, perBank } = bankList?.length
    ? { banks: bankList.length, perBank: Math.max(...bankList.map((b) => b.slotCapacity)) }
    : programSlotLayout(model);
  for (const e of entries) {
    banks = Math.max(banks, e.bank + 1);
    perBank = Math.max(perBank, e.slot + 1);
  }
  return { banks, perBank };
}
