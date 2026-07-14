import { type Addr, type Op, type Plan } from './reorg';

/** A delete-only offload plan: remove each address, journaled so the executor
 *  pulls each slot's bytes before deleting and re-pushes them on any failure
 *  (whole-batch rollback). Reuses executePlan unchanged. Bulk (destructive →
 *  always confirms). `whatLabel` lets piano offload say "pianos". */
export function planOffload(addrs: Addr[], whatLabel = 'samples'): Plan {
  const ops: Op[] = addrs.map((at) => ({ kind: 'delete', at }));
  const n = addrs.length;
  const noun = n === 1 ? whatLabel.replace(/s$/, '') : whatLabel;
  return {
    ops,
    journalSlots: addrs.map((a) => ({ bank: a.bank, slot: a.slot })),
    title: 'Remove from Nord',
    summary: `Remove ${n} ${noun} from your Nord — frees space`,
    bulk: true,
  };
}
