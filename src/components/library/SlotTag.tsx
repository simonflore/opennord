import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type SlotTone = 'nsmp' | 'nsmp3' | 'nsmp4' | 'npno' | 'ns2p' | 'ns3f' | 'ns4p';

const TONE_COLOR: Record<SlotTone, string> = {
  nsmp: 'text-muted',
  nsmp3: 'text-lcd-cyan',
  nsmp4: 'text-red',
  npno: 'text-warn',
  // Program generations mirror the sample-codec grey/blue/red, so a Stage 2/3/4
  // program badge reads apart at a glance the same way nsmp/nsmp3/nsmp4 do.
  ns2p: 'text-muted',
  ns3f: 'text-lcd-cyan',
  ns4p: 'text-red',
};

/**
 * Map a program file's generation to its badge tone — the grey/blue/red scheme
 * the sample codecs already use (Stage 2 → grey, Stage 3 → blue, Stage 4 → red).
 * Returns undefined for Nord-device rows (no generation), leaving them uncolored.
 */
export function genTone(generation?: 'Stage 2' | 'Stage 3' | 'Stage 4'): SlotTone | undefined {
  return generation === 'Stage 2' ? 'ns2p'
    : generation === 'Stage 3' ? 'ns3f'
    : generation === 'Stage 4' ? 'ns4p'
    : undefined;
}

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
