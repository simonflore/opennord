import type { Ns2Slot } from './decode';
import type { EngineKind, EngineSummary } from '../clavia/engines';

const KIND_ORDER: EngineKind[] = ['organ', 'piano', 'synth'];

/**
 * Stage 2: the Slot leads — each of A/B is a whole sound with its own
 * organ+piano+synth. Takes the *active* slots; callers filter on `Ns2Slot.active`
 * (decodeNs2 returns inactive slots too), matching Ns2ProgramView.
 */
export function ns2Engines(slots: Ns2Slot[]): EngineSummary {
  return {
    axis: 'container',
    term: 'Slot',
    groups: slots.map((s) => ({
      id: s.id,
      engines: KIND_ORDER.filter((k) => s[k].on),
    })),
  };
}
