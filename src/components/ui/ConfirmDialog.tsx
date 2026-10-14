import type { ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

/** "Do this?" with Cancel and the action named on its button; `children` says what it does. */
export function ConfirmDialog({ title, confirmLabel, onCancel, onConfirm, portal, children }: {
  title: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** See `Dialog`'s `portal`: for a dialog opened from inside a list row. */
  portal?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog
      open
      portal={portal}
      onClose={onCancel}
      title={title}
      footer={(
        <>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      <p className="m-0 text-[13px] text-dim">{children}</p>
    </Dialog>
  );
}
