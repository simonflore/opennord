import { useState } from 'react';
import { WebUsbTransport } from '../../lib/device/webusb';
import { NordSession } from '../../lib/device/session';
import { enumeratePrograms, type ProgramEntry } from '../../lib/device/transfer';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';

const NORD_FILTER: USBDeviceFilter = { vendorId: 0x0ffc, productId: 0x002e };

type Status = 'idle' | 'connecting' | 'connected' | 'error';

/** Maps low-level errors to friendly guidance. Empty string = user cancelled (no error). */
function describeError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/no device selected|cancel/i.test(m)) return '';
  if (/claim|interface|access|busy/i.test(m)) {
    return 'Could not connect — quit Nord Sound Manager (it holds the Nord), then try again.';
  }
  return `Could not connect: ${m}`;
}

export function ConnectPanel({ onConnected }: {
  onConnected: (session: NordSession, entries: ProgramEntry[], deviceName: string) => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const supported = typeof navigator !== 'undefined' && 'usb' in navigator;
  if (!supported) {
    return (
      <p className="ps-sub">
        Connecting to your Nord needs <b>Chrome or Edge on desktop</b> (WebUSB). The rest of
        OpenNord works in any browser — open this page in Chrome/Edge to transfer.
      </p>
    );
  }

  async function connect() {
    setStatus('connecting');
    setMessage('');
    let transport: WebUsbTransport | undefined;
    try {
      const device = await navigator.usb.requestDevice({ filters: [NORD_FILTER] });
      transport = new WebUsbTransport(device);
      await transport.open();
      const session = new NordSession(transport);
      const begin = await session.begin(PARTITION_PROGRAM);
      if (begin.status !== 0) throw new Error('the Nord refused a transfer session');
      const entries = await enumeratePrograms(session);
      setStatus('connected');
      const name = device.productName ?? 'Nord Stage 4';
      onConnected(session, entries, name);
    } catch (e) {
      // Release the interface on any failure so a retry isn't blocked by a stale claim.
      if (transport) await transport.close().catch(() => {});
      const friendly = describeError(e);
      if (!friendly) {
        setStatus('idle'); // user cancelled the picker
        return;
      }
      setStatus('error');
      setMessage(friendly);
    }
  }

  return (
    <div style={{ marginBottom: 16 }} aria-live="polite">
      <button
        onClick={connect}
        disabled={status === 'connecting'}
        style={{
          padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
          border: '1px solid #c8102e', background: '#c8102e', color: '#fff',
        }}
      >
        {status === 'connecting' ? 'Connecting…' : 'Connect your Nord'}
      </button>
      {status === 'error' && <p className="ps-sub" style={{ color: '#ffb454', marginTop: 8 }}>{message}</p>}
      <p className="ps-sub" style={{ marginTop: 8 }}>
        Quit Nord Sound Manager first — it holds the connection while it's open.
      </p>
    </div>
  );
}
