import type { ReactNode } from 'react';
import { Button } from '../ui';

/**
 * A plain-language confirm used for destructive device actions. No protocol
 * vocabulary; the caller supplies a human title/message. Optional `children`
 * render extra controls (e.g. a name field) above the buttons.
 */
export function ConfirmPanel({ title, message, confirmLabel, onConfirm, onCancel, busy, children }: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="ps" style={{ maxWidth: 480 }}>
      <div className="ps-nm">{title}</div>
      <p className="ps-sub" style={{ marginTop: 6 }}>{message}</p>
      {children}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="primary" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
