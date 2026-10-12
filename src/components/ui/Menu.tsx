import type { ReactNode } from 'react';
import * as RM from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';

/**
 * A dropdown menu built on Radix: keyboard (arrows, Home/End, typeahead, Escape),
 * focus return and `role="menu"` come from the primitive. Styled with tokens
 * via utilities, like Dialog.
 *
 *   <Menu trigger={<Button>…</Button>} label="Your Nord">
 *     <MenuItem onSelect={…}>Back up Nord</MenuItem>
 *   </Menu>
 */
export function Menu({ trigger, label, children, align = 'end' }: {
  /** The element that opens the menu; it becomes the trigger (asChild). */
  trigger: ReactNode;
  /** The menu's accessible name. */
  label: string;
  children: ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <RM.Root modal={false}>
      <RM.Trigger asChild>{trigger}</RM.Trigger>
      <RM.Portal>
        <RM.Content
          aria-label={label}
          align={align}
          sideOffset={6}
          className="z-50 min-w-[220px] rounded-md border border-line bg-surface-2 p-1 elev-2"
        >
          {children}
        </RM.Content>
      </RM.Portal>
    </RM.Root>
  );
}

/** One action in a Menu. `hint` is a short second line (what it does, or why it's off). */
export function MenuItem({ children, onSelect, disabled, hint, tone }: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  hint?: string;
  /** `quiet`: an action that leaves (Disconnect), set apart from the keyboard's jobs. */
  tone?: 'quiet';
}) {
  return (
    <RM.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer flex-col rounded-sm px-2.5 py-2 text-[13px] font-semibold text-ink outline-none',
        'data-[highlighted]:bg-surface data-[disabled]:cursor-default data-[disabled]:text-muted',
        tone === 'quiet' && 'font-medium text-dim',
      )}
    >
      {children}
      {hint && <span className="mt-0.5 text-[11px] font-normal text-muted">{hint}</span>}
    </RM.Item>
  );
}

export function MenuSeparator() {
  return <RM.Separator className="my-1 h-px bg-line" />;
}

/** A small mono heading inside a Menu (the Nord's name). */
export function MenuLabel({ children }: { children: ReactNode }) {
  return <RM.Label className="px-2.5 pt-1.5 pb-1 font-mono text-[10px] uppercase tracking-[1px] text-muted">{children}</RM.Label>;
}
