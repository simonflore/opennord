import { cn } from '@/lib/cn';

/**
 * The instrument's status LED as a dot: dark when off (`--led-off`), lit in the
 * accent (selected, open) or in `--connected` (only ever "a Nord is connected").
 */
export function Led({ on, tone = 'accent', className }: { on: boolean; tone?: 'accent' | 'connected'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'h-[7px] w-[7px] flex-none rounded-full',
        !on && 'bg-[var(--led-off)]',
        on && tone === 'accent' && 'bg-accent shadow-[var(--led-on-glow)]',
        on && tone === 'connected' && 'bg-connected shadow-[0_0_7px_var(--connected)]',
        className,
      )}
    />
  );
}
