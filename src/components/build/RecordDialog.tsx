import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, selectClass } from '@/components/ui';
import { cn } from '@/lib/cn';
import { createRecorder, type Recorder } from '@/lib/sample-build/record';
import type { ClipAudio } from '@/lib/sample-build/render';
import { noteName } from '@/lib/ns4/sample-view';
import { formatDuration } from '@/lib/duration';
import { useAudioInput } from './useAudioInput';

export type RecordInto = 'take' | 'split' | 'zone';
const fmtDb = (db: number) => (Number.isFinite(db) ? `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(Math.round(db))} dB` : '−∞ dB');
/** A meter's fill, 0–100 %, from −60 dB to 0. */
const meterPct = (db: number) => (Number.isFinite(db) ? Math.max(0, Math.min(100, ((db + 60) / 60) * 100)) : 0);

/**
 * Record into the build (spec §7, canvas "Record"): pick the input and channels, record a new
 * take on the selected zone or one long take of several notes to split, and start when the
 * sound gets louder than a level so no silence is kept in front. `onRecorded` stores the
 * recording and places it; it resolves to a line saying where it went.
 */
export function RecordDialog({ zoneRoot, onClose, onRecorded }: {
  /** The selected zone's root, for "a new take on zone …"; undefined with no zone. */
  zoneRoot?: number;
  onClose: () => void;
  onRecorded: (audio: ClipAudio, into: RecordInto, label: string) => Promise<string>;
}) {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [into, setInto] = useState<RecordInto>(zoneRoot === undefined ? 'zone' : 'take');
  const [startDb, setStartDb] = useState(-42);
  const [stopOnSilence, setStopOnSilence] = useState(true);
  const input = useAudioInput(deviceId, channels);
  const recorder = useRef<Recorder | null>(null);
  const [state, setState] = useState<'idle' | 'armed' | 'recording' | 'saving'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [session, setSession] = useState<{ label: string; len: string; note: string }[]>([]);
  const [problem, setProblem] = useState('');

  const finish = async () => {
    const r = recorder.current;
    recorder.current = null;
    input.setRecorder(null);
    const audio = r?.finish();
    if (!audio) { setState('idle'); setProblem('Nothing was louder than the start level, so nothing was recorded.'); return; }
    setState('saving');
    const label = `Recording ${new Date().toTimeString().slice(0, 5)}`;
    try {
      const where = await onRecorded(audio, into, label);
      setSession((s) => [{ label, len: formatDuration(audio.channels[0].length / audio.sampleRate), note: where }, ...s]);
      setProblem('');
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    }
    setState('idle');
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const toggle = () => {
    if (state === 'armed' || state === 'recording') { void finish(); return; }
    if (!input.rate) return;
    const r = createRecorder({ sampleRate: input.rate, channels, startDb, stopAfterSilenceS: stopOnSilence ? 2 : null });
    recorder.current = r;
    setProblem(''); setSeconds(0); setState('armed');
    input.setRecorder(r, () => {
      setSeconds(r.seconds);
      if (r.state === 'recording') setState('recording');
      if (r.state === 'done') void finishRef.current();
    });
  };
  // Closing stops a recording without keeping it.
  const { setRecorder } = input;
  useEffect(() => () => setRecorder(null), [setRecorder]);

  const busy = state !== 'idle';
  const status = state === 'armed' ? 'Armed: waiting for you to play'
    : state === 'recording' ? `Recording · ${formatDuration(seconds)}`
    : state === 'saving' ? 'Adding the recording…'
    : 'Ready';
  const hint = state === 'armed' ? `Recording starts when the sound is louder than ${fmtDb(startDb)}.`
    : state === 'recording' ? (stopOnSilence ? 'Stops after 2 s of silence, or press Stop.' : 'Press Stop when you’re done.')
    : 'Press Record, then play.';

  return (
    <Dialog open onClose={onClose} title="Record" className="max-w-[960px]">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {(input.problem || problem) && <p role="alert" className="m-0 text-sm text-warn">{input.problem || problem}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-dim">Input</span>
              <select className={cn(selectClass, 'min-h-11')} value={deviceId ?? ''} disabled={busy} onChange={(e) => setDeviceId(e.target.value || undefined)}>
                <option value="">The browser’s default</option>
                {input.devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-dim">Channels</span>
              <select className={cn(selectClass, 'min-h-11')} value={channels} disabled={busy} onChange={(e) => setChannels(Number(e.target.value) as 1 | 2)}>
                <option value={2}>Stereo{input.rate ? ` · ${input.rate / 1000} kHz` : ''}</option>
                <option value={1}>Mono{input.rate ? ` · ${input.rate / 1000} kHz` : ''}</option>
              </select>
            </label>
          </div>

          <fieldset className="m-0 flex flex-col gap-2.5 rounded-md border border-line px-3.5 py-3" disabled={busy}>
            <legend className="px-1.5 text-xs uppercase tracking-wider text-dim">Record into</legend>
            {zoneRoot !== undefined ? (
              <label className="flex items-start gap-2.5">
                <input type="radio" name="into" className="mt-1 accent-accent" checked={into === 'take'} onChange={() => setInto('take')} />
                <span>A new take on <strong className="font-medium">zone {noteName(zoneRoot)}</strong><br /><span className="text-sm text-muted">Each recording becomes a take you can pick.</span></span>
              </label>
            ) : (
              <label className="flex items-start gap-2.5">
                <input type="radio" name="into" className="mt-1 accent-accent" checked={into === 'zone'} onChange={() => setInto('zone')} />
                <span>A new zone on the note you play<br /><span className="text-sm text-muted">OpenNord hears the pitch and puts it on that key.</span></span>
              </label>
            )}
            <label className="flex items-start gap-2.5">
              <input type="radio" name="into" className="mt-1 accent-accent" checked={into === 'split'} onChange={() => setInto('split')} />
              <span>One long take to split into notes<br /><span className="text-sm text-muted">Play C2, D#2, F#2 … with a pause between; split afterwards.</span></span>
            </label>
          </fieldset>

          <div className="flex flex-col gap-2.5 rounded-md border border-line bg-surface-2 px-4 py-3.5">
            <div className="flex justify-between text-xs uppercase tracking-wider text-dim">
              <span>Level</span><span className="font-mono normal-case">peak {fmtDb(Math.max(...input.levelsDb, -Infinity))}</span>
            </div>
            {(input.levelsDb.length ? input.levelsDb : [-Infinity]).map((db, i, all) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-3 font-mono text-[11px] text-muted">{all.length > 1 ? (i ? 'R' : 'L') : ''}</span>
                <div className="relative h-3.5 flex-1 overflow-hidden rounded-sm bg-sink" role="meter" aria-label={`Input level${all.length > 1 ? (i ? ', right' : ', left') : ''}`}
                  aria-valuemin={-60} aria-valuemax={0} aria-valuenow={Number.isFinite(db) ? Math.round(db) : -60} aria-valuetext={fmtDb(db)}>
                  <div className={cn('absolute inset-y-0 left-0', db > -1 ? 'bg-warn' : 'bg-ink')} style={{ width: `${meterPct(db)}%` }} />
                  <div aria-hidden="true" className="absolute -inset-y-0.5 border-l-2 border-dashed border-accent" style={{ left: `${meterPct(startDb)}%` }} />
                </div>
              </div>
            ))}
            <label className="flex items-center gap-3">
              <span className="whitespace-nowrap text-sm text-dim">Start when louder than</span>
              <input type="range" min={-60} max={0} value={startDb} disabled={busy} onChange={(e) => setStartDb(Number(e.target.value))} className="flex-1 accent-accent" aria-label="Start level" />
              <span className="w-14 text-right font-mono text-[13px]">{fmtDb(startDb)}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={stopOnSilence} disabled={busy} onChange={(e) => setStopOnSilence(e.target.checked)} className="accent-accent" />
              Stop after 2 s of silence
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={toggle} disabled={!input.rate || state === 'saving'} aria-label={busy && state !== 'saving' ? 'Stop recording' : 'Start recording'}
              className="flex size-16 flex-none items-center justify-center rounded-full border-2 border-danger bg-surface-2 disabled:opacity-40">
              {state === 'armed' || state === 'recording'
                ? <span aria-hidden="true" className="size-6 rounded-sm bg-danger" />
                : <span aria-hidden="true" className="size-6 rounded-full bg-danger" />}
            </button>
            <div role="status">
              <div className="text-[17px] font-medium">{status}</div>
              <div className="text-sm text-muted">{hint}</div>
            </div>
          </div>
        </div>

        <aside aria-label="This session" className="flex flex-col gap-2.5 rounded-md border border-line bg-surface px-3.5 py-3.5 md:w-[300px] md:flex-none">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-dim">This session</h3>
          {session.length === 0 && <p className="m-0 text-sm text-muted">Your recordings show here.</p>}
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {session.map((s, i) => (
              <li key={`${s.label}-${i}`} className="rounded-md border border-line bg-sink p-2.5">
                <div className="flex justify-between"><span>{s.label}</span><span className="font-mono text-xs text-muted">{s.len}</span></div>
                <div className="mt-1 text-xs text-muted">{s.note}</div>
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-auto min-h-11" onClick={onClose}>Done</Button>
        </aside>
      </div>
    </Dialog>
  );
}
