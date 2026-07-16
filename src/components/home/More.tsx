import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { SectionLabel } from '@/components/ui';
import { cn } from '@/lib/cn';
import { SEC_TIGHT } from './layout';
import { roadmapTag } from './styles';
import { IconSearch, IconDownload, IconDesktop } from './icons';

const MORE: { icon: ReactNode; title: string; body: string; to?: string }[] = [
  {
    icon: <IconSearch />,
    title: 'Check my Nord',
    body: 'Connect over USB for a safe, read-only look at what’s on your keyboard — and exactly what OpenNord supports for it.',
    to: '/compatibility',
  },
  {
    icon: <IconDownload />,
    title: 'Find missing samples',
    body: 'When a program needs factory samples you don’t have, OpenNord points you straight to the official Nord downloads.',
  },
  {
    icon: <IconDesktop />,
    title: 'Reach older Nords',
    body: 'A desktop build talks to pre-WinUSB instruments — Stage 2-era Nords a browser can’t claim over USB.',
  },
];

const moreItem = 'flex items-start gap-3 rounded-md border border-transparent p-3 text-inherit no-underline';
const moreItemLink = cn(
  moreItem,
  'transition-[border-color,background] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
  'hover:border-[color-mix(in_srgb,var(--red)_40%,var(--line))] hover:bg-[color-mix(in_srgb,var(--lift)_3%,transparent)]',
);

export function More() {
  return (
    <section className={SEC_TIGHT}>
      <SectionLabel>Also in the app</SectionLabel>
      <div className="mt-3 grid grid-cols-3 gap-4 max-[860px]:grid-cols-1 max-[860px]:gap-3">
        {MORE.map((m) => {
          const inner = (
            <>
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-sm border border-line fill-raised text-ink edge-hi" aria-hidden="true">
                {m.icon}
              </div>
              <div>
                <div className="text-[13px] font-bold text-ink">{m.title}</div>
                <p className="mt-1 text-xs leading-[1.55] text-dim">{m.body}</p>
              </div>
            </>
          );
          return m.to ? (
            <Link to={m.to} className={moreItemLink} key={m.title}>
              {inner}
            </Link>
          ) : (
            <div className={moreItem} key={m.title}>{inner}</div>
          );
        })}
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-[1.5] text-muted">
        <span className={roadmapTag}>On the roadmap</span>
        Community patch sharing, AI-assisted search &amp; explanations, and USB
        transfer on iPad are designed — not shipped yet.
      </p>
    </section>
  );
}
