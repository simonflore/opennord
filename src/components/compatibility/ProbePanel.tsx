import { useState } from 'react';
import { Button } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';
import { probeDevice, type ProbeReport } from '../../lib/device/probe';
import { probeIssueUrl } from '../../lib/device/report';
import { useAsyncAction } from '../../hooks/useAsyncAction';

/** "Check my Nord" — a read-only probe whose result an owner can share to help
 *  validate their model. Gated on a connected session (USB, desktop/iPad). */
export function ProbePanel() {
  const { session, deviceName, productId } = useDevice();
  const [report, setReport] = useState<ProbeReport | null>(null);
  const { busy, error, run: runProbe } = useAsyncAction();

  if (!session) {
    return (
      <p className="cmp__connect">
        Connect a Nord (desktop Chrome/Edge or the iPad app) to help validate it — the check is read-only.
      </p>
    );
  }

  async function run() {
    if (!session) return;
    await runProbe(async () => {
      setReport(await probeDevice(session, { deviceName: deviceName || 'Nord', productId, now: () => new Date() }));
    });
  }

  return (
    <div className="cmp__probe">
      <Button variant="primary" onClick={run} disabled={busy}>{busy ? 'Checking…' : 'Check my Nord'}</Button>
      {error && <p className="on-error">{error}</p>}
      {report && (
        <div className="cmp__probe-result">
          <p>Found {report.partitions.length} memory areas on {report.deviceName}.</p>
          <ul>{report.partitions.map((p) => <li key={p.index}>Area {p.index}: {p.fileCount} files</li>)}</ul>
          <a className="on-btn on-btn--secondary" href={probeIssueUrl(report)} target="_blank" rel="noreferrer">Share results to help</a>
        </div>
      )}
    </div>
  );
}
