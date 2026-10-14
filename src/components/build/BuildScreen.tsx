import { useState } from 'react';
import { Button, selectClass } from '@/components/ui';
import { EmptyNote } from '@/components/library/EmptyNote';
import { useSampleProject } from '@/lib/library/useSampleProject';
import { describeFailure } from '@/lib/errors';
import { plural } from '@/lib/plural';
import { setName, setTarget, type TargetId } from '@/lib/sample-build/model';
import { TARGETS } from '@/lib/sample-build/targets';
import { ClipsPanel } from './ClipsPanel';
import { ZonePanel } from './ZonePanel';
import { BuildKeyboard } from './BuildKeyboard';
import { IssuesList } from './IssuesList';
import { ListenPanel, type LastBuild } from './ListenPanel';
import { SplitDialog } from './SplitDialog';
import { SaveDialog } from './SaveDialog';
import { autoMap, placeTakes } from '@/lib/sample-build/analysis/automap';
import { useApplyError } from './useApplyError';

/** One open build (spec §7, canvas "Build sample"). */
export function BuildScreen({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const s = useSampleProject(projectId);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [notice, setNotice] = useState(''); // informational: announced politely
  // Something failed or was refused: an alert. Name and format edits can be refused (e.g. a name that cannot be used).
  const [edit, problem, setProblem] = useApplyError(s.apply);
  const [splitClipId, setSplitClipId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastBuild, setLastBuild] = useState<LastBuild | null>(null); // Listen's file, reused by Save while the project is unchanged

  if (s.state === 'loading') return <EmptyNote>Opening the build…</EmptyNote>;
  if (s.state === 'missing') return <EmptyNote>This build isn’t here any more.</EmptyNote>;
  const p = s.project;
  // A removed or not yet chosen zone falls back to the first.
  const zone = p.zones.find((z) => z.id === selectedZoneId) ?? p.zones[0];

  async function addFiles(files: File[]) {
    try {
      const r = await s.addFiles(files);
      setProblem(r.unreadable.map((u) => `“${u.fileName}”: ${u.reason}`).join(' '));
      setNotice(r.unclear.length ? `No clear pitch in ${r.unclear.map((n) => `“${n}”`).join(', ')}; set its key by hand.` : '');
    } catch (e) {
      setNotice('');
      setProblem(describeFailure('Couldn’t store the recordings', e));
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Button variant="ghost" className="min-h-11" onClick={onClose}>← Builds</Button>
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-dim">Name</span>
          <input className="ps-lcd !mb-0 min-h-11 min-w-0 max-w-64" value={p.name} aria-label="Name"
            onChange={(e) => edit((x) => setName(x, e.target.value), 'name')} />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-dim">Format</span>
          <select aria-label="Format" value={p.target} onChange={(e) => edit((x) => setTarget(x, e.target.value as TargetId))}
            className={`${selectClass} min-h-11`}>
            {Object.values(TARGETS).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        {TARGETS[p.target].hardware === 'untested' && <span className="rounded-sm border border-warn px-2 py-1 text-xs text-warn">Not yet tried on a Nord</span>}
        {s.saveError
          ? <span role="alert" className="text-xs text-warn">{s.saveError}</span>
          : <span className="text-xs text-dim">{s.saved ? 'Saved' : 'Saving…'}</span>}
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" className="min-h-11" onClick={s.undo} disabled={!s.canUndo}>Undo</Button>
          <Button variant="secondary" className="min-h-11" onClick={s.redo} disabled={!s.canRedo}>Redo</Button>
          <Button variant="primary" className="min-h-11" onClick={() => setSaving(true)}>Save…</Button>
        </div>
      </header>
      {problem && <p role="alert" className="px-4 py-2 text-sm text-warn">{problem}</p>}
      {notice && <p role="status" className="px-4 py-2 text-sm text-dim">{notice}</p>}
      <div className="flex flex-wrap gap-4 p-4">
        <div className="min-w-0 flex-[1_1_260px] md:max-w-80">
          <ClipsPanel project={p} onAddFiles={(f) => void addFiles(f)} onSplit={setSplitClipId} apply={s.apply} />
        </div>
        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {zone && <ZonePanel key={zone.id} project={p} zoneId={zone.id} read={s.read} apply={s.apply} />}
          <BuildKeyboard project={p} selectedZoneId={zone?.id ?? null} onSelect={setSelectedZoneId} apply={s.apply} />
          <IssuesList project={p} onSelectZone={setSelectedZoneId} />
          <ListenPanel project={p} read={s.read} onBuilt={setLastBuild} />
          <p className="text-sm text-muted">{p.zones.length ? plural(p.zones.length, 'zone') : 'Add recordings to start.'}</p>
        </main>
      </div>
      {splitClipId && (() => {
        const clip = p.clips.find((c) => c.id === splitClipId);
        const audio = clip && s.read(clip.id);
        return audio ? (
          <SplitDialog project={p} clipId={splitClipId} audio={audio} onClose={() => setSplitClipId(null)}
            onApply={(candidates) => { edit((latest) => autoMap(placeTakes(latest, candidates).project)); setSplitClipId(null); }} />
        ) : null;
      })()}
      {/* Mounted only while open: it needs the Samples and Folder providers, and a closed dialog has nothing to show. */}
      {saving && <SaveDialog project={p} read={s.read} built={lastBuild} onClose={() => setSaving(false)} />}
    </div>
  );
}
