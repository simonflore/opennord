import { useId, type ReactNode } from 'react';
import { Button, Menu, MenuItem } from '../ui';

export interface MoreAction { label: string; onSelect: () => void }

/**
 * The open item's actions, in the same order on every kind of item:
 * **Send to Nord** · **Save to computer** · **More**.
 *
 * One orange button: Send to Nord when it can go (a Nord is connected and takes
 * it), else Save to computer. Send to Nord shows even when it can't go, greyed
 * with the reason beside it ("Connect your Nord to send it"), so the page says
 * what's possible instead of hiding it. Kinds the app can't send yet (presets,
 * samples, pianos) pass no `send`. `children` are a kind's own actions, after
 * Save and before More (a sample's Convert menu).
 */
export function ItemActions({ send, save, more = [], children }: {
  send?: { onSend: () => void; disabledReason?: string };
  save?: { onSave: () => void; busy?: boolean; busyLabel?: string };
  more?: MoreAction[];
  children?: ReactNode;
}) {
  const reasonId = useId();
  const canSend = !!send && !send.disabledReason;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {send && (
        <Button
          variant={canSend ? 'primary' : 'secondary'}
          disabled={!canSend}
          onClick={send.onSend}
          aria-describedby={canSend ? undefined : reasonId}
        >
          Send to Nord
        </Button>
      )}
      {save && (
        <Button
          variant={canSend ? 'secondary' : 'primary'}
          onClick={save.onSave}
          disabled={save.busy}
        >
          {save.busy ? (save.busyLabel ?? 'Saving…') : 'Save to computer'}
        </Button>
      )}
      {children}
      {more.length > 0 && (
        <Menu label="More actions" trigger={<Button variant="ghost" aria-label="More actions">More ▾</Button>}>
          {more.map((a) => <MenuItem key={a.label} onSelect={a.onSelect}>{a.label}</MenuItem>)}
        </Menu>
      )}
      {send?.disabledReason && <span id={reasonId} className="text-[11px] text-muted">{send.disabledReason}</span>}
    </div>
  );
}
