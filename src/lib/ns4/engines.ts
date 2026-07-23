import type { NS4Program } from './types';
import type { EngineKind, EngineSummary } from '../clavia/engines';
import { activeLayers } from './view';

const KIND_ORDER: EngineKind[] = ['organ', 'piano', 'synth'];

/**
 * Stage 4: the engine leads and layers stack within it. A Layer Scene only
 * changes which layers are muted, so `scene` just picks which ones count.
 */
export function ns4Engines(p: NS4Program, scene?: 'I' | 'II'): EngineSummary {
  const layers = activeLayers(p, scene);
  return {
    axis: 'engine',
    engines: KIND_ORDER.flatMap((kind) => {
      const ids = layers.filter((l) => l.kind === kind).map((l) => l.id);
      return ids.length ? [{ kind, layers: ids }] : [];
    }),
  };
}
