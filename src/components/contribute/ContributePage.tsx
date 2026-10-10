// src/components/contribute/ContributePage.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { useDevice } from '../../lib/device/DeviceContext';
import { ConnectPanel } from '../device/ConnectPanel';
import { Button, Card } from '../ui';
import { ProbePanel } from '../compatibility/ProbePanel';
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
import { getErrorMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/file';
import { measureIssueUrl, programsIssueUrl } from '../../lib/contribute/asks';

const APP_VERSION = '0.1.0';

type Range = { start: number; end: number };

export function ContributePage() {
  const { session, entries, productId, deviceName, setConnection } = useDevice();
  const name = deviceName || undefined;
  return (
    <section className="max-w-[720px]">
      <h1 className="m-0 text-[18px] font-extrabold text-ink">Help confirm OpenNord on your Nord</h1>
      <p className="ps-sub">
        OpenNord learns how each Nord works from the instrument&rsquo;s own software. What we can&rsquo;t
        do on our own is check it on every model. That&rsquo;s where you come in: a few small things,
        about 10 minutes, no technical skills needed.
      </p>

      <ol className="m-0 mt-4 grid list-none gap-3 p-0">
        <Ask n={1} title="Check your Nord" time="2 min">
          <p className="ps-sub">
            Connect it (Chrome or Edge on a computer, or the iPad app) and run the check. It only
            reads; nothing on your keyboard changes. Then share the result in one click.
          </p>
          {session ? <ProbePanel /> : (
            <ConnectPanel inline onConnected={(s, e, n, pid) => setConnection(s, e, n, pid)} />
          )}
        </Ask>
        <Ask n={2} title="Share two or three of your programs" time="5 min">
          <p className="ps-sub">
            Programs you made hold only settings, never Nord sounds, so they&rsquo;re yours to share.
            Note what your Nord shows for them (organ, amp, effects, rotary speed), and we check that
            OpenNord shows the same.
          </p>
          <a className="on-btn on-btn--secondary" href={programsIssueUrl(name)} target="_blank" rel="noreferrer">
            Share programs
          </a>
        </Ask>
        <Ask n={3} title="Measure a few sounds" time="10 min, optional">
          <p className="ps-sub">
            Have an audio interface? Measuring a few notes helps OpenNord&rsquo;s organ, piano and
            effects sound like your model. Tell us which Nord you have and we&rsquo;ll send a short
            list. Your recordings stay on your computer; you only share the numbers.
          </p>
          <a className="on-btn on-btn--secondary" href={measureIssueUrl(name)} target="_blank" rel="noreferrer">
            Offer to measure
          </a>
        </Ask>
      </ol>

      <details className="mt-6">
        <summary className="cursor-pointer text-[13px] font-semibold text-dim">
          Advanced: show us which settings a control changes
        </summary>
        {session
          ? <CaptureWizard session={session} entries={entries} productId={productId} />
          : <FileDropWizard />}
      </details>
    </section>
  );
}

/** One numbered ask on the page. */
function Ask({ n, title, time, children }: { n: number; title: string; time: string; children: ReactNode }) {
  return (
    <li>
      <Card>
        <h2 className="m-0 text-[15px] font-bold text-ink">
          {n}. {title} <span className="text-[12px] font-medium text-dim">· {time}</span>
        </h2>
        {children}
      </Card>
    </li>
  );
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
    session.withSession(session.programPartition, () => getFocusedSlot(session))
      .then((f) => {
        if (!alive || !f) return;
        const match = entries.find((e) => e.bank === f.bank && e.slot === f.slot);
        if (match) setFocused(match);
      })
      .catch(() => { /* fall back to the slot list */ });
    return () => { alive = false; };
  }, [session, entries]);

  const readSlot = (entry: ProgramEntry) =>
    session.withSession(session.programPartition, () => slotCaptureSource(session, entry).capture());

  async function captureBaseline(entry: ProgramEntry) {
    setBusy(true); setError('');
    try {
      const cap = await readSlot(entry);
      contrib.setBaseline(cap);
      setBaseline(cap);
      setPicked(entry);
    } catch (e) {
      setError(`Could not read that program: ${getErrorMessage(e)}`);
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
      setError(`Could not read that program: ${getErrorMessage(e)}`);
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
      <div style={{ marginTop: 12 }}>
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
      </div>
    );
  }

  const vocab = vocabForTag(baseline.model.tag);

  // Step 2+: the sweep loop.
  return (
    <div style={{ marginTop: 12 }}>
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
    </div>
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
    const bytes = await readFileBytes(file);
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
      setError(`Could not read that file: ${getErrorMessage(e)}`);
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
      setError(`Could not read that file: ${getErrorMessage(e)}`);
    }
  }

  function saveEntry() {
    if (!pendingAfter) return;
    contrib.addEntry(pendingAfter, resolveLabel(vocab, ls), ls.valueNote, ls.vocabId || undefined);
    setList([...contrib.entries]);
    setPendingAfter(null); setPendingRanges([]); ls.reset();
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p className="ps-sub">
        Export a program from Nord Sound Manager, change one control on the keyboard and export it
        again, then drop both files here. Works for any Nord model. (With your Nord connected in step
        1, you can do this straight over USB instead.)
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
