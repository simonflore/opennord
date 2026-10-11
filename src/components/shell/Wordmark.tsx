import { cn } from '@/lib/cn';

/**
 * The OpenNord wordmark: lowercase mono "open" with "nord" in the accent, as it
 * would print on a panel. Size it with a text-* class; everything else is fixed
 * so every surface (app header, site header, footer) shows the same mark.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-mono font-semibold tracking-[-0.02em] text-ink', className)}>
      open<span className="text-accent">nord</span>
    </span>
  );
}
