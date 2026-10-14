import { useState } from 'react';
import { Button, selectClass } from '@/components/ui';
import { EmptyNote } from '@/components/library/EmptyNote';
import { useSampleProject } from '@/lib/library/useSampleProject';
import { describeFailure } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { emptyProject, setName, setPiano, setTarget, takeOf, type TargetId } from '@/lib/sample-build/model';
import { NPNO_PIANO_TYPE } from '@/lib/ns4/nsp-write';
import type { ReadAudio } from '@/lib/sample-build/render';
import { TARGETS } from '@/lib/sample-build/targets';
import { ClipsPanel } from './ClipsPanel';
import { ZoneList } from './ZoneList';
import { ZonePanel } from './ZonePanel';
import { BuildKeyboard } from './BuildKeyboard';
import { IssuesList } from './IssuesList';
import { useBuiltFile } from './useBuiltFile';
import { PianoListen } from '@/components/piano/PianoListen';
import { SplitDialog } from './SplitDialog';
import { SaveDialog } from './SaveDialog';
import { autoMap, placeTakes } from '@/lib/sample-build/analysis/automap';
import { useApplyError } from './useApplyError';

const EMPTY = emptyProject('', 'nsmp4', '');
/** The Nord's piano types, as a player names them (`NPNO_PIANO_TYPE`). */
const PIANO_TYPES: [string, number][] = [
  ['Grand', NPNO_PIANO_TYPE.grand], ['Upright', NPNO_PIANO_TYPE.upright], ['Electric piano', NPNO_PIANO_TYPE.electric],
  ['Electric grand', NPNO_PIANO_TYPE.electricGrand], ['Wurlitzer', NPNO_PIANO_TYPE.wurlitzer], ['Clavinet', NPNO_PIANO_TYPE.clav],
  ['Harpsichord', NPNO_PIANO_TYPE.harpsichord], ['Digital & FM', NPNO_PIANO_TYPE.digital], ['Other electric', NPNO_PIANO_TYPE.misc],
  ['Mallets', NPNO_PIANO_TYPE.mallets],
];
const NO_AUDIO: ReadAudio = () => undefined;

/** One open build (spec §7, canvas "Build sample"). */
export function BuildScreen({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const s = useSampleProject(projectId);
  const built = useBuiltFile(s.state === 'open' ? s.project : EMPTY, s.state === 'open' ? s.read : NO_AUDIO); // the file the Nord gets: played, and reused by Save
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [notice, setNotice] = useState(''); // informational: announced politely
  // Something failed or was refused: an alert. Name and format edits can be refused (e.g. a name that cannot be used).
  const [edit, problem, setProblem] = useApplyError(s.apply);
  const [splitClipId, setSplitClipId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (s.state === 'loading') return <EmptyNote>Opening the build…</EmptyNote>;
  if (s.state === 'missing') return <EmptyNote>This build isn’t here any more.</EmptyNote>;
  const p = s.project;
  // A removed or not yet chosen zone falls back to the first.
  const zone = p.zones.find((z) => z.id === selectedZoneId) ?? p.zones[0];

  async function addFiles(files: File[]) {
    try {
      const r = await s.addFiles(files);
      setProblem(r.unreadable.map((u) => `“${u.fileName}”: ${u.reason}`).join(' '));
      setNotice(r.unclear.length
        ? `No clear pitch in ${r.unclear.map((n) => `“${n}”`).join(', ')}, so ${r.unclear.length === 1 ? 'it isn’t' : 'they aren’t'} on the keys yet: use Place… in Clips to give ${r.unclear.length === 1 ? 'it' : 'each'} a key, or to split a recording of several notes.`
        : '');
    } catch (e) {
      setNotice('');
      setProblem(describeFailure('Couldn’t store the recordings', e));
    }
  }

  const formatButton = (t: TargetId, label: string) => (
    <button key={t} type="button" role="radio" aria-checked={p.target === t} title={TARGETS[t].label} onClick={() => switchTo(t)}
      className={cn('min-h-11 px-3 font-mono text-[13px]', p.target === t ? 'bg-accent font-medium text-text-on-accent' : 'bg-sink text-dim hover:text-ink')}>
      {label}
    </button>
  );
  const activeClipId = zone ? takeOf(zone, zone.layers[0])?.clipId : undefined;
  /** Switch format, and say what changes for a piano (canvas "Build a piano"). */
  function switchTo(t: TargetId) {
    if (t === p.target) return;
    const from = TARGETS[p.target].partition;
    edit((x) => setTarget(x, t));
    if (t === 'npno' && from === 'sample') {
      const copies = TARGETS.npno.check(setTarget(p, 'npno')).filter((i) => i.message.includes('re-pitched copies')).length;
      setNotice(`Switched from sample: each zone’s playing take is now its loudest layer.${copies ? ` Keys above some recordings are played by re-pitched copies (hatched on the keyboard).` : ''}`);
    } else if (from === 'piano' && t !== 'npno') {
      setNotice('Switched to a sample: each zone plays its loudest layer; the softer layers wait as takes.');
    } else setNotice('');
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Two rows: where you are and saving on top; what you're building below, wrapping as it must. */}
      <header className="flex flex-col gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-wide text-muted">
            <a href="#/library/samples" className="text-muted hover:text-ink">Samples</a>
            <span aria-hidden="true"> / </span>
            <button type="button" onClick={onClose} className="uppercase hover:text-ink">Builds</button>
          </nav>
          {/* On a phone the badge takes its own line under this row. */}
          {TARGETS[p.target].hardware === 'untested' && (
            <span className="rounded-sm border border-warn/40 px-2 py-1 text-xs text-warn max-md:order-last md:ml-auto">Not yet tried on a Nord</span>
          )}
          <div className={cn('flex items-center gap-1 md:gap-2', TARGETS[p.target].hardware === 'untested' ? 'max-md:ml-auto' : 'ml-auto')}>
            {s.saveError
              ? <span role="alert" className="text-xs text-warn">{s.saveError}</span>
              : <span className="mr-1 text-xs text-muted">{s.saved ? 'Saved' : 'Saving…'}</span>}
            <Button variant="ghost" className="min-h-11 min-w-11 px-0" aria-label="Undo" title="Undo" onClick={s.undo} disabled={!s.canUndo}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 3 L2 6 L5 9" /><path d="M2 6 H10 A4 4 0 0 1 10 14 H7" /></svg>
            </Button>
            <Button variant="ghost" className="min-h-11 min-w-11 px-0" aria-label="Redo" title="Redo" onClick={s.redo} disabled={!s.canRedo}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M11 3 L14 6 L11 9" /><path d="M14 6 H6 A4 4 0 0 0 6 14 H9" /></svg>
            </Button>
            <Button variant="primary" className="min-h-11 px-[18px] max-md:hidden" onClick={() => setSaving(true)}>Save…</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <label className="flex min-w-0 items-center gap-2.5 max-md:basis-full">
            <span className="text-xs uppercase tracking-wider text-dim max-md:sr-only">Name</span>
            <input className="ps-lcd !mb-0 min-h-11 w-56 min-w-0 max-md:w-full" value={p.name} aria-label="Name"
              onChange={(e) => edit((x) => setName(x, e.target.value), 'name')} />
          </label>
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="text-xs uppercase tracking-wider text-dim">For</span>
            <div role="radiogroup" aria-label="Format" className="flex overflow-hidden rounded-md border border-line">
              {formatButton('nsmp4', 'Stage 4')}
              {formatButton('nsmp3', 'Stage 3')}
              {formatButton('npno', 'Piano')}
            </div>
          </div>
          {p.target === 'npno' && (
            <>
              <label className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider text-dim">Piano type</span>
                <select value={p.piano?.type ?? NPNO_PIANO_TYPE.electric} onChange={(e) => edit((x) => setPiano(x, { type: Number(e.target.value) }))}
                  className={cn(selectClass, 'min-h-11')}>
                  {PIANO_TYPES.map(([label, type]) => <option key={type} value={type}>{label}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider text-dim">Variant</span>
                <input value={p.piano?.variant ?? ''} placeholder="optional" maxLength={20}
                  onChange={(e) => edit((x) => setPiano(x, { variant: e.target.value }), 'variant')}
                  className="min-h-11 w-24 rounded-sm border border-line bg-sink px-2.5 placeholder:text-muted" />
              </label>
            </>
          )}
        </div>
      </header>
      {problem && <p role="alert" className="px-6 py-2 text-sm text-warn">{problem}</p>}
      {notice && <p role="status" className="px-6 py-2 text-sm text-dim">{notice}</p>}
      {/* Clips beside the zone from tablet width up; on a phone they come after the zone and keyboard. */}
      <div className="flex flex-auto flex-col md:grid md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-w-0 border-line bg-surface p-[18px] max-md:order-last md:border-r">
          <ClipsPanel project={p} activeClipId={activeClipId} onAddFiles={(f) => void addFiles(f)} onSplit={setSplitClipId} apply={s.apply} />
        </div>
        <main className="flex min-w-0 flex-col gap-4 px-4 py-5 sm:px-6">
          {zone && <ZonePanel key={zone.id} project={p} zoneId={zone.id} read={s.read} apply={s.apply} />}
          <div className="md:hidden"><ZoneList project={p} selectedZoneId={zone?.id ?? null} onSelect={setSelectedZoneId} /></div>
          <BuildKeyboard project={p} selectedZoneId={zone?.id ?? null} onSelect={setSelectedZoneId} apply={s.apply} built={built} />
          <IssuesList project={p} onSelectZone={setSelectedZoneId} />
          {/* A piano isn't played on the keyboard above yet; its own player stays for now. */}
          {p.target === 'npno' && built && 'file' in built && <PianoListen bytes={built.file.bytes} />}
        </main>
      </div>
      {/* A phone saves from a bar at the foot of the screen, above the app's tabs. */}
      {/* Above the app's tab bar where it shows (--tabs-room, shell.css). */}
      <div className="sticky bottom-[var(--tabs-room)] z-10 border-t border-line bg-surface px-4 pb-4 pt-3 md:hidden">
        <Button variant="primary" className="min-h-12 w-full" onClick={() => setSaving(true)}>Save…</Button>
      </div>
      {splitClipId && (() => {
        const clip = p.clips.find((c) => c.id === splitClipId);
        const audio = clip && s.read(clip.id);
        return audio ? (
          <SplitDialog project={p} clipId={splitClipId} audio={audio} onClose={() => setSplitClipId(null)}
            onApply={(candidates) => { edit((latest) => autoMap(placeTakes(latest, candidates).project)); setSplitClipId(null); setNotice(''); }} />
        ) : null;
      })()}
      {/* Mounted only while open: it needs the Samples and Folder providers, and a closed dialog has nothing to show. */}
      {saving && <SaveDialog project={p} read={s.read} built={built && 'file' in built ? built : null} onClose={() => setSaving(false)} />}
    </div>
  );
}
