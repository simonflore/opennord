import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SlotTone = 'nsmp' | 'nsmp3' | 'nsmp4' | 'npno';

const TONE_COLOR: Record<SlotTone, string> = {
  nsmp: 'text-muted',
  nsmp3: 'text-lcd-cyan',
  nsmp4: 'text-red',
  npno: 'text-warn',
};

/**
 * Small mono-font metadata label (slot, file type, byte size) on a Library
 * card. `tone` recolors it for the sample-codec badge so nsmp/nsmp3/nsmp4/
 * piano read apart at a glance; omit it for the plain muted look.
 */
export function SlotTag({ tone, children }: { tone?: SlotTone; children: ReactNode }) {
  return (
    <span className={cn('flex-none font-mono text-[9px] text-muted', tone && TONE_COLOR[tone])}>
      {children}
    </span>
  );
}
