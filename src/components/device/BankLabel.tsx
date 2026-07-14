import { BANK_LETTERS } from '../../lib/clavia/slot';

/** The red "BANK X" heading shown above a bank's slot grid/list in the device views. */
export function BankLabel({ bank }: { bank: number }) {
  return <h4 className="ps-bank-head">BANK {BANK_LETTERS[bank] ?? bank}</h4>;
}
