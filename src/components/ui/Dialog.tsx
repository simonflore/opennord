import { useEffect, useRef, type ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * A modal dialog: dark scrim, centered panel, `role="dialog"` + `aria-modal`.
 * Escape and backdrop click call `onClose`; focus moves into the panel on open
 * and returns to the previously focused element on close. All color/space/radius
 * via tokens (tokens.css).
 */
export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="on-dialog-backdrop" data-testid="dialog-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="on-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="on-dialog__title">{title}</h2>
        <div className="on-dialog__body">{children}</div>
        {footer && <div className="on-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}
