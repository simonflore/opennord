import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { EngineKind } from '@/lib/clavia/engines';

// Engine identity colours (tokens.css --engine-*), the same ones that mark
// keyboard zones — so a tag on a card and a zone in the inspector read alike.
const COLOR: Record<EngineKind, string> = {
  organ: 'text-engine-organ shadow-[inset_0_0_0_1px_var(--engine-organ)]',
  piano: 'text-engine-piano shadow-[inset_0_0_0_1px_var(--engine-piano)]',
  synth: 'text-engine-synth shadow-[inset_0_0_0_1px_var(--engine-synth)]',
};

/**
 * Small uppercase pill for an engine/summary glimpse on a Library card.
 * `kind` colour-codes organ/piano/synth so a multi-engine patch reads apart at
 * a glance; omit it for a plain neutral label (e.g. Samples' "N samples" chip).
 */
export function EngineTag({ kind, children }: { kind?: EngineKind; children: ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.4px] text-dim',
        kind && COLOR[kind],
      )}
    >
      {children}
    </span>
  );
}
