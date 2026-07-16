import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SEC_TIGHT } from './layout';
import { iconTile } from './styles';
import { IconCheck, IconUsb, IconLock } from './icons';

const PROOF: { icon: ReactNode; lead: string; body: string }[] = [
  {
    icon: <IconCheck />,
    lead: 'Matched, not guessed',
    body: 'Stage 4 programs are validated field-for-field against real exports from the keyboard — nothing invented.',
  },
  {
    icon: <IconUsb />,
    lead: 'Proven on hardware',
    body: 'Reading and writing over USB is tested live — enumerate, read and write, on a real Nord Stage 4.',
  },
  {
    icon: <IconLock />,
    lead: 'Stays on your device',
    body: 'Your files are read locally in your browser. No upload, no account, no tracking, no server.',
  },
];

export function Proof() {
  return (
    <section className={SEC_TIGHT}>
      <div className="grid grid-cols-3 gap-4 rounded-lg border border-line fill-raised elev-1 p-6 px-4 max-[860px]:grid-cols-1">
        {PROOF.map((p) => (
          <div className="flex items-start gap-3" key={p.lead}>
            <div className={cn(iconTile, 'mb-0 h-[34px] w-[34px] flex-none')} aria-hidden="true">{p.icon}</div>
            <div>
              <div className="text-[13px] font-bold text-ink">{p.lead}</div>
              <p className="mt-1 text-xs leading-[1.55] text-dim">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
