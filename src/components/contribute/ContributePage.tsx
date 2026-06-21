// src/components/contribute/ContributePage.tsx
import { useEffect, useState } from 'react';
import { useDevice } from '../../lib/device/DeviceContext';
import { ConnectPanel } from '../device/ConnectPanel';
import { Button } from '../ui';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import type { NordSession } from '../../lib/device/session';
import { getFocusedSlot, type ProgramEntry } from '../../lib/device/transfer';
import { slotCaptureSource, fileCaptureSource } from '../../lib/contribute/source';
import { ContributionSession } from '../../lib/contribute/session';
import { vocabForTag } from '../../lib/contribute/vocab';
import { buildBundle, bundleToJson, bundleFilename } from '../../lib/contribute/export';
import type { Capture, ContributionEntry, ControlVocabItem } from '../../lib/contribute/types';
import { slotLabel } from '../../lib/clavia/slot';
import { useNordMidi } from './useNordMidi';
import { MidiProbe } from './MidiProbe';

const APP_VERSION = '0.1.0';
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Range = { start: number; end: number };

export function ContributePage() {
  const { session, entries, productId, setConnection } = useDevice();
  if (!session) {
    return (
      <section style={{ maxWidth: 720 }}>
        <h1>Help decode your Nord</h1>
        <p className="ps-sub">
          Change one control at a time on your Nord, and OpenNord learns how your model stores
          its sounds. Works for any Nord — a couple of minutes helps everyone with the same keyboard.
        </p>
        <ConnectPanel
          title="Connect your Nord"
          lead="OpenNord reads programs from any Nord over USB — Stage, Electro, Piano, Lead and the rest of the line. Connect yours to start capturing changes so we can learn how your model stores its sounds."
          onConnected={(s, e, name, pid) => setConnection(s, e, name, pid)}
        />
        <FileDropWizard />
      </section>
    );
  }
  return <CaptureWizard session={session} entries={entries} productId={productId} />;
}

// ── shared helpers ──────────────────────────────────────────────────────────

/** Serialize the session and trigger a download of the contribution bundle. */
function downloadBundle(contrib: ContributionSession, pid: string) {
  const bundle = buildBundle(contrib, {
    pid,
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

type LabelState = {
  label: string; setLabel: (v: string) => void;
  vocabId: string; setVocabId: (v: string) => void;
  valueNote: string; setValueNote: (v: string) => void;
  reset: () => void;
};

function useLabelState(): LabelState {
  const [label, setLabel] = useState('');
  const [vocabId, setVocabId] = useState('');
  const [valueNote, setValueNote] = useState('');
  return {
    label, setLabel, vocabId, setVocabId, valueNote, setValueNote,
    reset: () => { setLabel(''); setVocabId(''); setValueNote(''); },
  };
}

/** Resolve the human label from the vocab pick (falling back to free-form). */
function resolveLabel(vocab: ControlVocabItem[], ls: LabelState): string {
  if (ls.vocabId) return vocab.find((v) => v.id === ls.vocabId)?.label ?? ls.label ?? 'unlabeled';
  return ls.label || 'unlabeled';
}

/** The "what / how did you change it" labeling fields (vocab + free-form). */
function LabelFields({ vocab, ls }: { vocab: ControlVocabItem[]; ls: LabelState }) {
  return (
    <>
      {vocab.length > 0 && (
        <label style={{ display: 'block', marginBottom: 6 }}>
          What did you change?{' '}
          <select value={ls.vocabId} onChange={(e) => ls.setVocabId(e.target.value)}>
            <option value="">— pick a control —</option>
            {vocab.map((v) => (
              <option key={v.id} value={v.id}>{v.section}: {v.label}</option>
            ))}
          </select>
        </label>
      )}
      {!ls.vocabId && (
        <label style={{ display: 'block', marginBottom: 6 }}>
          {vocab.length > 0 ? 'Or describe it: ' : 'What did you change? '}
          <input value={ls.label} onChange={(e) => ls.setLabel(e.target.value)} placeholder="e.g. filter cutoff" />
        </label>
      )}
      <label style={{ display: 'block', marginBottom: 6 }}>
        How did you change it?{' '}
        <input value={ls.valueNote} onChange={(e) => ls.setValueNote(e.target.value)} placeholder="e.g. min to max" />
      </label>
    </>
  );
}

/** The "captured so far" review list + download button. */
function EntryReview({ list, onDownload }: { list: ContributionEntry[]; onDownload: () => void }) {
  if (list.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h2>Captured so far ({list.length})</h2>
      <ul style={{ paddingLeft: 18 }}>
        {list.map((e, i) => (
          <li key={i} className="ps-sub">
            {e.label}{e.valueNote ? ` (${e.valueNote})` : ''}{e.multiRegion ? ' — flagged: multiple regions' : ''}
          </li>
        ))}
      </ul>
      <Button variant="primary" onClick={onDownload}>Download contribution</Button>
    </div>
  );
}

// ── WebUSB path ─────────────────────────────────────────────────────────────

function CaptureWizard({ session, entries, productId }: {
  session: NordSession;
  entries: ProgramEntry[];
  productId: number;
}) {
  const [contrib] = useState(() => new ContributionSession());
  const [picked, setPicked] = useState<ProgramEntry | null>(null);
  const [baseline, setBaseline] = useState<Capture | null>(null);
  const [pendingAfter, setPendingAfter] = useState<Capture | null>(null);
  const [pendingRanges, setPendingRanges] = useState<Range[]>([]);
  const [list, setList] = useState<ContributionEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<ProgramEntry | null>(null);
  const [midiOn, setMidiOn] = useState(false);
  const midi = useNordMidi(midiOn);
  const ls = useLabelState();

  // Ask the device which program is currently selected, so the musician picks it
  // on the keyboard rather than in this list too. Best-effort: if GetFocus isn't
  // supported the slot list below is the fallback.
  useEffect(() => {
    let alive = true;
    session.withSession(PARTITION_PROGRAM, () => getFocusedSlot(session))
      .then((f) => {
        if (!alive || !f) return;
        const match = entries.find((e) => e.bank === f.bank && e.slot === f.slot);
        if (match) setFocused(match);
      })
      .catch(() => { /* fall back to the slot list */ });
    return () => { alive = false; };
  }, [session, entries]);

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
      setPendingRanges(contrib.pendingRanges(after));
      // Auto-label from the last control the Nord transmitted over MIDI, if any.
      if (midi.last && !ls.vocabId) ls.setLabel(`${midi.last.label} → ${midi.last.value}`);
    } catch (e) {
      setError(`Could not read that program: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function saveEntry() {
    if (!pendingAfter || !baseline) return;
    contrib.addEntry(pendingAfter, resolveLabel(vocab, ls), ls.valueNote, ls.vocabId || undefined);
    setList([...contrib.entries]);
    setPendingAfter(null); setPendingRanges([]); ls.reset();
  }

  function discardPending() {
    setPendingAfter(null); setPendingRanges([]); ls.reset();
  }

  // Step 1: pick the program to edit (it becomes the baseline).
  if (!baseline) {
    return (
      <section style={{ maxWidth: 720 }}>
        <h1>Help decode your Nord</h1>
        {error && <p className="ps-sub on-error">{error}</p>}
        {busy && <p className="ps-sub">Reading the Nord…</p>}
        {focused && (
          <div style={{ marginBottom: 12 }}>
            <p className="ps-sub">
              Loaded on your Nord now: <strong>{slotLabel(focused.bank, focused.slot)} — {focused.name || '(empty)'}</strong>.
            </p>
            <Button variant="primary" disabled={busy} onClick={() => captureBaseline(focused)}>Use this program</Button>
          </div>
        )}
        <p className="ps-sub">
          {focused ? 'Or pick another program to edit:' : "Pick the program you'll edit — we read it now as the starting point."}
        </p>
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
        to the same spot, then capture the change. Go straight to the next one — no need to undo.
      </p>
      <MidiProbe state={midi} enabled={midiOn} onToggle={() => setMidiOn((v) => !v)} />
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
              <LabelFields vocab={vocab} ls={ls} />
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {pendingRanges.length > 0 && (
              <Button variant="primary" disabled={!ls.vocabId && !ls.label} onClick={saveEntry}>Save this change</Button>
            )}
            <Button variant="ghost" onClick={discardPending}>Discard</Button>
          </div>
        </div>
      )}

      <EntryReview list={list} onDownload={() => downloadBundle(contrib, '0x' + productId.toString(16).padStart(4, '0'))} />
    </section>
  );
}

// ── File-drop path (universal fallback, no USB) ─────────────────────────────

function FileDropWizard() {
  const [contrib] = useState(() => new ContributionSession());
  const [baseline, setBaseline] = useState<Capture | null>(null);
  const [pendingAfter, setPendingAfter] = useState<Capture | null>(null);
  const [pendingRanges, setPendingRanges] = useState<Range[]>([]);
  const [list, setList] = useState<ContributionEntry[]>([]);
  const [error, setError] = useState('');
  const ls = useLabelState();

  const vocab = baseline ? vocabForTag(baseline.model.tag) : [];

  async function readFile(file: File): Promise<Capture> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return fileCaptureSource(bytes).capture();
  }

  async function onBaselineFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const cap = await readFile(file);
      if (!cap.model.recognized) {
        setError("That doesn't look like a Nord program file.");
        return;
      }
      contrib.setBaseline(cap);
      setBaseline(cap);
    } catch (e) {
      setError(`Could not read that file: ${msg(e)}`);
    }
  }

  async function onAfterFile(file: File | undefined) {
    if (!file || !baseline) return;
    setError('');
    try {
      const after = await readFile(file);
      if (after.model.tag !== baseline.model.tag) {
        setError('That file is a different model than your baseline — use two exports of the same program.');
        return;
      }
      setPendingAfter(after);
      setPendingRanges(contrib.pendingRanges(after));
    } catch (e) {
      setError(`Could not read that file: ${msg(e)}`);
    }
  }

  function saveEntry() {
    if (!pendingAfter) return;
    contrib.addEntry(pendingAfter, resolveLabel(vocab, ls), ls.valueNote, ls.vocabId || undefined);
    setList([...contrib.entries]);
    setPendingAfter(null); setPendingRanges([]); ls.reset();
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>No USB cable? Use exported files</h2>
      <p className="ps-sub">
        Export a program from Nord Sound Manager, change one control on the keyboard and export it
        again, then drop both files here. Works for any Nord model.
      </p>
      {error && <p className="ps-sub on-error">{error}</p>}

      {!baseline ? (
        <label className="ps-sub" style={{ display: 'block' }}>
          Starting-point program file:{' '}
          <input type="file" onChange={(e) => onBaselineFile(e.target.files?.[0])} />
        </label>
      ) : (
        <>
          <p className="ps-sub">
            Starting point: {baseline.model.modelName ?? baseline.model.tag}. Now add the changed export.
          </p>
          {!pendingAfter ? (
            <label className="ps-sub" style={{ display: 'block' }}>
              Changed program file:{' '}
              <input key={list.length} type="file" onChange={(e) => onAfterFile(e.target.files?.[0])} />
            </label>
          ) : (
            <div style={{ padding: 12, marginTop: 8 }}>
              {pendingRanges.length === 0 ? (
                <p className="ps-sub on-error">These two files are identical — did you change and re-export the program?</p>
              ) : (
                <>
                  <p className="ps-sub">
                    Found a change{pendingRanges.length > 1 ? ' — looks like more than one thing moved, so it gets flagged.' : '.'}
                  </p>
                  <LabelFields vocab={vocab} ls={ls} />
                </>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {pendingRanges.length > 0 && (
                  <Button variant="primary" disabled={!ls.vocabId && !ls.label} onClick={saveEntry}>Save this change</Button>
                )}
                <Button variant="ghost" onClick={() => { setPendingAfter(null); setPendingRanges([]); ls.reset(); }}>Discard</Button>
              </div>
            </div>
          )}
        </>
      )}

      <EntryReview list={list} onDownload={() => downloadBundle(contrib, '')} />
    </div>
  );
}
