import type { CSSProperties, ReactNode } from 'react';

/**
 * A file picker rendered as its `children` (typically a styled label/button).
 * Wraps the hidden-`<input>` mechanics — the change guard, and a value reset so
 * the *same* file can be re-picked (e.g. to retry after a read error). Callers
 * style it via `className`/`style`; it knows nothing about Nord files.
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
    <label className={className} style={style} aria-disabled={disabled || undefined}>
      {children}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow re-picking the same file
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
