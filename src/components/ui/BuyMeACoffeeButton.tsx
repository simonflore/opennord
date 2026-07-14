import { cn } from '@/lib/cn';

/**
 * The Buy Me a Coffee CTA — styled natively to match buymeacoffee.com's own
 * button (no third-party embed script, so the app's client-only privacy
 * posture holds). `--bmc-*` are documented brand-color exceptions in
 * tokens.css, like the LCD blues. Shared by the About screen and the landing
 * page's open-source CTA — give it its own spacing via `className` per call
 * site rather than baking in a margin here.
 */
export function BuyMeACoffeeButton({ className }: { className?: string }) {
  return (
    <a
      className={cn(
        'inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[13px] font-semibold no-underline',
        'bg-[var(--bmc-yellow)] text-[var(--bmc-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.4)]',
        'transition-[background,transform] duration-[120ms] ease-[var(--ease)]',
        'hover:-translate-y-px hover:bg-[var(--bmc-yellow-hi)] active:translate-y-0',
        className,
      )}
      href="https://buymeacoffee.com/simonflore"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Buy me a coffee on Buy Me a Coffee"
    >
      <span className="text-[15px] leading-none" aria-hidden="true">☕</span>
      Buy me a coffee
    </a>
  );
}
