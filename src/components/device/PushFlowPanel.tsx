import { slotLabel } from '../../lib/clavia/slot';
import { freeName } from '../../lib/clavia/name';
import type { ProgramEntry } from '../../lib/device/transfer';
import type { ModelInfo } from '../../lib/clavia/partitions';
import type { BankInfo } from '../../lib/device/capacity';
import { TargetSlotPicker } from './TargetSlotPicker';
import { ConfirmPanel } from './ConfirmPanel';
import type { usePushFlow } from './usePushFlow';

/**
 * Sending a program to the Nord, once one is chosen (`push.pushSource`): pick a
 * slot, then confirm, with the name it gets on the Nord. The Device page and a
 * program's "Send to Nord" in the Library both show this, so the step is the
 * same wherever it starts.
 */
export function PushFlowPanel({ push, entries, model, bankList }: {
  push: ReturnType<typeof usePushFlow>; entries: ProgramEntry[];
  /** The connected Nord's model, so the slot picker draws its banks and slots. */
  model?: ModelInfo;
  /** The Nord's own bank list, when read. */
  bankList?: readonly BankInfo[] | null;
}) {
  if (!push.pushSource) return null;
  if (!push.picked) {
    return <TargetSlotPicker entries={entries} model={model} bankList={bankList} onPick={push.pickSlot} onCancel={push.cancel} />;
  }
  const where = slotLabel(push.picked.bank, push.picked.slot);
  const { bank, slot } = push.picked;
  // The Nord keeps one sound per name, so a name another slot holds is numbered, as the Nord does.
  const elsewhere = entries.filter((e) => !(e.bank === bank && e.slot === slot)).map((e) => e.name);
  const sendName = freeName(push.pushSource.name, elsewhere);
  return (
    <ConfirmPanel
      title="Send to Nord?"
      message={push.picked.occupiedBy
        ? `This replaces "${push.picked.occupiedBy}" at ${where}.`
        : `Send to ${where} (currently empty).`}
      confirmLabel="Send to Nord"
      busy={push.busy}
      onConfirm={() => push.confirmPush(sendName)}
      onCancel={push.unpick}
    >
      <p className="ps-sub">Name on the Nord: {sendName}</p>
      {push.error && <p className="ps-sub on-error">{push.error}</p>}
    </ConfirmPanel>
  );
}
