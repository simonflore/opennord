import type { NordSession } from '../../lib/device/session';
import type { ProgramEntry } from '../../lib/device/transfer';
import { Button, SectionLabel } from '../ui';
import { cn } from '@/lib/cn';
import { useConnectNord } from './useConnectNord';

const connectTitle = 'mx-0 mt-2 mb-3 text-[22px] font-extrabold text-ink';
const connectLead = 'm-0 mb-4 text-[13px] leading-[1.55] text-dim';

const DEFAULT_TITLE = 'Bring your Nord in';
const DEFAULT_LEAD =
  'Plug your Stage 4 into this computer over USB to back up your sounds, browse every ' +
  'program in one place, and move patches between the keyboard and OpenNord.';

export function ConnectPanel({ onConnected, onOpenBackup, title = DEFAULT_TITLE, lead = DEFAULT_LEAD, inline = false }: {
  onConnected: (session: NordSession, entries: ProgramEntry[], deviceName: string, productId: number) => void;
  /** Callback when the user clicks "open a backup offline" (optional). */
  onOpenBackup?: () => void;
  /** Override the connect-card heading (e.g. for line-wide tools, not Stage-4 framing). */
  title?: string;
  /** Override the connect-card lead copy. */
  lead?: string;
  /** Just the button and its notes, for a page that already frames the step (no card,
   *  heading or lead). */
  inline?: boolean;
}) {
  const { status, message, connect, reach, reachable, needsUsbDk } = useConnectNord(onConnected);

  // Info cards: a browser without WebUSB, the iPhone app, or an iPad whose DEXT isn't ready.
  if (!reachable) {
    const ipad = reach === 'ipad-dext-pending';
    const infoTitle = ipad ? 'Plug your Nord into this iPad'
      : reach === 'iphone' ? "USB transfer isn't available on iPhone"
      : 'Open this in Chrome or Edge to connect';
    // Inline: the host page already frames the step, so no nested card or heading.
    if (inline) return <p className={cn(connectLead, 'mt-2')}>{infoTitle}.</p>;
    return (
      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-[460px] rounded-lg border border-line bg-surface p-6">
          <SectionLabel>Your Nord</SectionLabel>
          <h2 className={connectTitle}>{infoTitle}</h2>
          <p className={connectLead}>
            {ipad
              ? "Connect your Nord with a USB cable and switch it on — this screen picks it up by itself. The first time, also open Settings → Apps → OpenNord → Drivers and switch the Nord driver on. This needs an iPad with an M1 chip or newer."
              : reach === 'iphone'
              ? 'An iPhone has no way to talk to the Nord over USB. Use the iPad app, or Chrome or Edge on a computer, to move programs; everything else — browsing, samples, sharing — works right here.'
              : "Talking to your Nord over USB needs Chrome or Edge on a computer. Everything else in OpenNord — browsing, samples, sharing — works in any browser; switch over when you're ready to move programs to and from the keyboard."}
          </p>
        </div>
      </div>
    );
  }

  const body = (
    <>
      {needsUsbDk && (
        <div
          className="mb-4 rounded-md border border-[color-mix(in_srgb,var(--warn)_35%,var(--line))] bg-[color-mix(in_srgb,var(--warn)_6%,transparent)] p-3"
          role="note"
        >
          <p className="m-0 mb-1 text-xs font-bold text-ink">Connecting an older Nord, like the Stage 2?</p>
          <p className="m-0 text-xs leading-[1.55] text-dim">
            This app can already reach newer Nords (Stage 3 and 4) — no extra steps. An older
            Nord needs one more thing first: a free, one-time driver called <strong>UsbDk</strong>.
            It won’t stop Nord Sound Manager from working, and you only install it once.
          </p>
          <a
            className="mt-2 inline-block text-xs font-bold text-warn underline hover:text-red-bright"
            href="https://github.com/daynix/UsbDk/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get UsbDk →
          </a>
        </div>
      )}
      <Button
        variant="primary"
        size="md"
        onClick={connect}
        disabled={status === 'connecting'}
      >
        {status === 'connecting' ? 'Connecting…' : 'Connect your Nord'}
      </Button>
      {status === 'error' && <p className="on-error mt-3">{message}</p>}
      <p className="mt-4 border-t border-line pt-3 text-xs leading-[1.5] text-muted">
        Using Nord Sound Manager? Quit it first — it keeps the USB connection to itself, so only
        one app can talk to the Nord at a time.
      </p>
      {onOpenBackup && (
        <p className="mt-4 border-t border-line pt-3 text-xs leading-[1.5] text-muted">
          No Nord handy?{' '}
          <button
            type="button"
            onClick={onOpenBackup}
            className={cn('cursor-pointer border-0 bg-transparent p-0 underline [font:inherit]', 'text-[var(--deps-ink)]')}
          >
            Open a backup to organize offline
          </button>
        </p>
      )}
    </>
  );
  if (inline) return <div className="mt-2" aria-live="polite">{body}</div>;
  return (
    <div className="flex justify-center px-4 py-6" aria-live="polite">
      <div className="w-full max-w-[460px] rounded-lg border border-line bg-surface p-6">
        <SectionLabel>Your Nord</SectionLabel>
        <h2 className={connectTitle}>{title}</h2>
        <p className={connectLead}>{lead}</p>
        {body}
      </div>
    </div>
  );
}
