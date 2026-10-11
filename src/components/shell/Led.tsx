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
        !on && 'bg-led-off',
        on && tone === 'accent' && 'bg-accent led-glow',
        on && tone === 'connected' && 'bg-connected led-glow-connected',
        className,
      )}
    />
  );
}
