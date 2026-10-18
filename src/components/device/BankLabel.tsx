import { bankLetter } from '../../lib/clavia/slot';

/** The "BANK X" panel label shown above a bank's slot grid/list in the device views. */
export function BankLabel({ bank }: { bank: number }) {
  return <h4 className="ps-bank-head">BANK {bankLetter(bank)}</h4>;
}
