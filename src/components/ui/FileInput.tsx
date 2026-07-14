import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A file picker rendered as its `children` (typically a styled label/button).
 * Wraps the hidden-`<input>` mechanics — the change guard, and a value reset so
 * the *same* file can be re-picked (e.g. to retry after a read error). Callers
 * style it via `className`/`style`; it knows nothing about Nord files. Adds a
 * sensible baseline (pointer cursor, disabled treatment) so it behaves like a
 * button out of the box even before a caller's own classes land.
 */
export function FileInput({ accept, onFile, disabled, className, style, children }: {
  accept?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center',
        disabled && 'cursor-not-allowed opacity-55',
        className,
      )}
      style={style}
      aria-disabled={disabled || undefined}
    >
      {children}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow re-picking the same file
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
