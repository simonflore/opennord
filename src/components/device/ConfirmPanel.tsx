import type { ReactNode } from 'react';

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
        <button
          onClick={onConfirm}
          disabled={busy}
          style={{
            padding: '8px 14px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 700,
            border: '1px solid var(--red)', background: 'var(--red)', color: 'var(--text-on-accent)',
          }}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          style={{ padding: '8px 14px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer', border: '1px solid var(--line)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
