import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Pick =
  | { multiple?: false; onFile: (file: File) => void; onFiles?: never }
  /** Several files at once; `onFiles` gets every picked file. */
  | { multiple: true; onFiles: (files: File[]) => void; onFile?: never };

/**
 * A file picker rendered as its `children` (typically a styled label/button).
 * Wraps the hidden-`<input>` mechanics — the change guard, and a value reset so
 * the *same* file can be re-picked (e.g. to retry after a read error). Callers
 * style it via `className`/`style`; it knows nothing about Nord files. Adds a
 * sensible baseline (pointer cursor, disabled treatment) so it behaves like a
 * button out of the box even before a caller's own classes land. The input is
 * visually hidden but stays in the tab order, so the picker opens from the keyboard.
 */
export function FileInput({ accept, disabled, title, className, style, children, ...pick }: Pick & {
  accept?: string;
  /** Tooltip; with `disabled`, why it's off. */
  title?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        'relative inline-flex cursor-pointer select-none items-center',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-focus)]',
        disabled && 'cursor-not-allowed opacity-55',
        className,
      )}
      style={style}
      title={title}
      aria-disabled={disabled || undefined}
    >
      {children}
      <input
        type="file"
        accept={accept}
        multiple={pick.multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = ''; // allow re-picking the same file
          if (pick.multiple) { if (files.length) pick.onFiles(files); }
          else if (files[0]) pick.onFile(files[0]);
        }}
      />
    </label>
  );
}
