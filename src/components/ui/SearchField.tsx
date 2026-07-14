import { cn } from '@/lib/cn';

/**
 * A sunken search input (`fill-sink` + `inset-1` for the recessed look). Adds a
 * visible focus-within ring — the old CSS only nudged the border color on
 * focus, no ring — so keyboard users can see where they landed.
 */
export function SearchField(
  { value, onChange, placeholder }:
  { value: string; onChange: (v: string) => void; placeholder?: string },
) {
  return (
    <div
      className={cn(
        'flex flex-1 min-w-[240px] items-center gap-2 rounded-md border border-line px-3 py-2 fill-sink inset-1',
        'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
        'focus-within:border-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]',
      )}
    >
      <span className="text-[13px] text-muted" aria-hidden="true">⌕</span>
      <input
        className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-muted"
        type="search"
        aria-label={placeholder ?? 'Search'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
