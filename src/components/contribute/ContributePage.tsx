// src/components/contribute/ContributePage.tsx
import { useState } from 'react';
import { useDevice } from '../../lib/device/DeviceContext';
import { ConnectPanel } from '../device/ConnectPanel';
import { Button } from '../ui';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import type { NordSession } from '../../lib/device/session';
import type { ProgramEntry } from '../../lib/device/transfer';
import { slotCaptureSource } from '../../lib/contribute/source';
import { ContributionSession } from '../../lib/contribute/session';
import { vocabForTag } from '../../lib/contribute/vocab';
import { buildBundle, bundleToJson, bundleFilename } from '../../lib/contribute/export';
import { diffBytes, groupRanges } from '../../lib/clavia/diff';
import type { Capture, ContributionEntry } from '../../lib/contribute/types';
import { slotLabel } from '../../lib/clavia/slot';

const APP_VERSION = '0.1.0';
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function ContributePage() {
  const { session, entries, productId, setConnection } = useDevice();
  if (!session) {
    return (
      <section style={{ maxWidth: 720 }}>
        <h1>Help decode your Nord</h1>
        <p className="ps-sub">
          Plug in your Nord and change one control at a time, so OpenNord can learn how your
          model stores its sounds. A couple of minutes helps everyone with the same keyboard.
        </p>
        <ConnectPanel onConnected={(s, e, name, pid) => setConnection(s, e, name, pid)} />
      </section>
    );
  }
  return <CaptureWizard session={session} entries={entries} productId={productId} />;
}

function CaptureWizard({ session, entries, productId }: {
  session: NordSession;
  entries: ProgramEntry[];
  productId: number;
}) {
  const [contrib] = useState(() => new ContributionSession());
  const [picked, setPicked] = useState<ProgramEntry | null>(null);
  const [baseline, setBaseline] = useState<Capture | null>(null);
  const [pendingAfter, setPendingAfter] = useState<Capture | null>(null);
  const [pendingRanges, setPendingRanges] = useState<Array<{ start: number; end: number }>>([]);
  const [label, setLabel] = useState('');
  const [vocabId, setVocabId] = useState('');
  const [valueNote, setValueNote] = useState('');
  const [list, setList] = useState<ContributionEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const readSlot = (entry: ProgramEntry) =>
    session.withSession(PARTITION_PROGRAM, () => slotCaptureSource(session, entry).capture());

  async function captureBaseline(entry: ProgramEntry) {
    setBusy(true); setError('');
    try {
      const cap = await readSlot(entry);
      contrib.setBaseline(cap);
      setBaseline(cap);
      setPicked(entry);
    } catch (e) {
      setError(`Could not read that program: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function recapture() {
    if (!picked || !baseline) return;
    setBusy(true); setError('');
    try {
      const after = await readSlot(picked);
      setPendingAfter(after);
      setPendingRanges(groupRanges(diffBytes(baseline.body, after.body)));
    } catch (e) {
      setError(`Could not read that program: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function saveEntry() {
    if (!pendingAfter || !baseline) return;
    const chosenLabel = vocabId
      ? (vocabForTag(baseline.model.tag).find((v) => v.id === vocabId)?.label ?? label)
      : label;
    contrib.addEntry(pendingAfter, chosenLabel || 'unlabeled', valueNote, vocabId || undefined);
    setList([...contrib.entries]);
    setPendingAfter(null); setPendingRanges([]);
    setLabel(''); setVocabId(''); setValueNote('');
  }

  function discardPending() {
    setPendingAfter(null); setPendingRanges([]);
    setLabel(''); setVocabId(''); setValueNote('');
  }

  function download() {
    const bundle = buildBundle(contrib, {
      pid: '0x' + productId.toString(16).padStart(4, '0'),
      toolVersion: APP_VERSION,
      capturedAt: new Date().toISOString(),
    });
    const blob = new Blob([bundleToJson(bundle)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bundleFilename(bundle);
    a.click();
    URL.revokeObjectURL(url);
  }

  // Step 1: pick the program to edit (it becomes the baseline).
  if (!baseline) {
    return (
      <section style={{ maxWidth: 720 }}>
        <h1>Help decode your Nord</h1>
        <p className="ps-sub">Pick the program you'll edit — we read it now as the starting point.</p>
        {error && <p className="ps-sub on-error">{error}</p>}
        {busy && <p className="ps-sub">Reading the Nord…</p>}
        {entries.length === 0 && <p className="ps-sub">No programs found on this Nord yet.</p>}
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 4 }}>
          {entries.map((e) => (
            <li key={`${e.bank}-${e.slot}`}>
              <Button variant="secondary" disabled={busy} onClick={() => captureBaseline(e)}>
                {slotLabel(e.bank, e.slot)} — {e.name || '(empty)'}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const vocab = vocabForTag(baseline.model.tag);

  // Step 2+: the sweep loop.
  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Help decode your Nord</h1>
      <p className="ps-sub">
        Starting point: {slotLabel(picked!.bank, picked!.slot)} — {picked!.name || '(empty)'}.
        Change <strong>one</strong> control on the Nord, press <strong>Store</strong> to save it
        to the same spot, then capture the change.
      </p>
      {error && <p className="ps-sub on-error">{error}</p>}

      {!pendingAfter ? (
        <Button variant="primary" disabled={busy} onClick={recapture}>
          {busy ? 'Reading…' : 'Capture the change'}
        </Button>
      ) : (
        <div style={{ padding: 12, marginTop: 8 }}>
          {pendingRanges.length === 0 ? (
            <p className="ps-sub on-error">
              We didn't see a change. Did you press Store on the Nord after editing? Try again.
            </p>
          ) : (
            <>
              <p className="ps-sub">
                Captured a change{pendingRanges.length > 1
                  ? ' — heads up, more than one thing seems to have moved, so this one gets flagged.'
                  : '.'}
              </p>
              {vocab.length > 0 && (
                <label style={{ display: 'block', marginBottom: 6 }}>
                  What did you change?{' '}
                  <select value={vocabId} onChange={(ev) => setVocabId(ev.target.value)}>
                    <option value="">— pick a control —</option>
                    {vocab.map((v) => (
                      <option key={v.id} value={v.id}>{v.section}: {v.label}</option>
                    ))}
                  </select>
                </label>
              )}
              {!vocabId && (
                <label style={{ display: 'block', marginBottom: 6 }}>
                  {vocab.length > 0 ? 'Or describe it: ' : 'What did you change? '}
                  <input value={label} onChange={(ev) => setLabel(ev.target.value)} placeholder="e.g. filter cutoff" />
                </label>
              )}
              <label style={{ display: 'block', marginBottom: 6 }}>
                How did you change it?{' '}
                <input value={valueNote} onChange={(ev) => setValueNote(ev.target.value)} placeholder="e.g. min to max" />
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {pendingRanges.length > 0 && (
              <Button variant="primary" disabled={!vocabId && !label} onClick={saveEntry}>Save this change</Button>
            )}
            <Button variant="ghost" onClick={discardPending}>Discard</Button>
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2>Captured so far ({list.length})</h2>
          <ul style={{ paddingLeft: 18 }}>
            {list.map((e, i) => (
              <li key={i} className="ps-sub">
                {e.label}{e.valueNote ? ` (${e.valueNote})` : ''}{e.multiRegion ? ' — flagged: multiple regions' : ''}
              </li>
            ))}
          </ul>
          <Button variant="primary" onClick={download}>Download contribution</Button>
        </div>
      )}
    </section>
  );
}
