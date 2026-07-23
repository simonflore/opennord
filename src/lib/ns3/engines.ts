import type { Ns3Panel } from './decode';
import type { EngineKind, EngineSummary } from '../clavia/engines';

const KIND_ORDER: EngineKind[] = ['organ', 'piano', 'synth'];

/**
 * Stage 3: the Panel leads — each of A/B is a whole sound with its own
 * organ+piano+synth. `decodeNs3` already returns only the active panels, so an
 * empty array here means the decoder found none (see ns3/decode.ts:642).
 */
export function ns3Engines(panels: Ns3Panel[]): EngineSummary {
  return {
    axis: 'container',
    term: 'Panel',
    groups: panels.map((p) => ({
      id: p.id,
      engines: KIND_ORDER.filter((k) => p[k].on),
    })),
  };
}
