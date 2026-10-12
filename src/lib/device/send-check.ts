import { hasCbinMagic, readCbinHeader } from '../clavia/cbin';
import type { ModelInfo } from '../clavia/partitions';
import { pushRefusal } from './transfer';

/**
 * Why a program can't be sent from the Library to the connected Nord, in a
 * player's words — or undefined when it can. Beyond what Nord Sound Manager
 * itself refuses (pushRefusal), the program has to be this keyboard's own kind:
 * a Stage 3 program written into a Stage 4's program memory is not a Stage 4
 * program. When the connected model isn't known, only pushRefusal applies (the
 * write probe already limits what such a keyboard accepts).
 */
export function sendRefusal(bytes: Uint8Array, model: ModelInfo | null | undefined): string | undefined {
  const refused = pushRefusal(bytes);
  if (refused) return refused;
  if (!model?.programTag || !hasCbinMagic(bytes)) return undefined;
  const tag = readCbinHeader(bytes).tag;
  if (tag === model.programTag) return undefined;
  if (tag === 'ns4l') return 'This is a Live program; OpenNord can’t send Live programs yet.';
  const older = tag === 'ns3f' ? 'Stage 3' : tag === 'ns2p' ? 'Stage 2' : null;
  // The one conversion there is goes to Stage 4.
  if (older && model.id === 'stage-4') return `This is a ${older} program. Convert it to Stage 4 first, then send the result.`;
  return older
    ? `This is a ${older} program, so it can’t be sent to a ${model.name}.`
    : `This program isn’t for a ${model.name}, so it can’t be sent to it.`;
}
