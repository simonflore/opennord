import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import * as RD from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * A bare dialog keeps only the modal shell (scrim, surface, focus trap): its
   * title is for screen readers only, there's no padding or footer, and
   * `className` places and sizes it (the ⌘K palette).
   */
  bare?: boolean;
  className?: string;
  /** Move focus into the dialog on open (default). Off keeps a phone's keyboard down. */
  autoFocus?: boolean;
  /** Keys pressed anywhere in the dialog, the dialog itself included (the palette's ↑/↓/Enter). */
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  /**
   * Render at the end of <body> instead of in place. Needed when the dialog sits
   * inside something that contains its fixed children — a list row with
   * `content-visibility` or a `@container` clips and repositions an inline one.
   */
  portal?: boolean;
  /** Where focus goes on close, when where it was on open is gone (a menu item that opened it). */
  returnFocus?: RefObject<HTMLElement | null>;
}

/**
 * A modal dialog built on Radix — focus trap, scroll lock, Escape/backdrop
 * close, and correct `role="dialog"` + `aria-modal` come from the primitive.
 * Styled entirely with tokens via utilities. Drop-in for the previous
 * hand-rolled Dialog (same props: open / onClose / title / children / footer?).
 *
 * Rendered inline (no Radix Portal) to match the previous dialog: it keeps the
 * content in the SSR/static markup that several callers assert against, and the
 * fixed-position overlay still stacks correctly. Focus trap / scroll lock / aria
 * live on the Content and are unaffected by skipping the portal.
 */
// How many Dialogs are open right now, for shortcuts that must not open over one.
let openDialogs = 0;
/** True while any Dialog is open (the app's ⌘K stays shut over another dialog). */
export function anyDialogOpen(): boolean {
  return openDialogs > 0;
}

export function Dialog({ open, onClose, title, children, footer, bare, className, autoFocus = true, onKeyDown, portal = false, returnFocus }: DialogProps) {
  const content = useRef<HTMLDivElement>(null);
  // Where focus was when the dialog opened, to put it back on close. Radix returns
  // focus to its own Trigger, which no caller here uses, so focus fell to <body>
  // and Tab restarted at the top of the page. A layout effect runs before Radix
  // moves focus into the dialog.
  const returnTo = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open) returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open]);
  useEffect(() => {
    if (!open) return;
    openDialogs++;
    return () => { openDialogs--; };
  }, [open]);
  const body = (
    <>
      <RD.Overlay
        data-testid="dialog-backdrop"
        className="fixed inset-0 z-40 bg-[var(--scrim)]"
      />
      <RD.Content
        aria-describedby={undefined}
        ref={content}
        onKeyDown={onKeyDown}
        // Without autoFocus, focus still moves into the dialog — onto the dialog itself,
        // not its first field (so a phone's keyboard stays down).
        onOpenAutoFocus={autoFocus ? undefined : (e) => { e.preventDefault(); content.current?.focus(); }}
        onCloseAutoFocus={(e) => {
          const el = returnTo.current?.isConnected ? returnTo.current : returnFocus?.current;
          if (el?.isConnected) { e.preventDefault(); el.focus(); }
        }}
        className={cn(
          'fixed z-50 rounded-lg border border-line bg-surface shadow-[var(--shadow-3)] focus:outline-none',
          !bare && 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,480px)] max-h-[85vh] overflow-auto p-4',
          className,
        )}
      >
        <RD.Title className={bare ? 'sr-only' : 'mb-3 text-lg font-semibold text-ink'}>{title}</RD.Title>
        {bare ? children : <div className="text-ink">{children}</div>}
        {!bare && footer && <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div>}
      </RD.Content>
    </>
  );
  return (
    <RD.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      {portal ? <RD.Portal>{body}</RD.Portal> : body}
    </RD.Root>
  );
}
