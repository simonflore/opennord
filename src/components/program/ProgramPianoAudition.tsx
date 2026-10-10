import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { useFolderOptional } from '@/lib/folder/FolderContext';
import type { FolderLibrary } from '@/lib/folder/useFolderLibrary';
import { findProgramPiano, localPianos, type ProgramPianoMatch } from '@/lib/library/piano-match';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';
import { readNspZones } from '@/lib/ns4/nsp';
import { getSharedCtx } from '@/components/sample/audioPlayer';
import { usePianoVoice } from '@/components/piano/usePianoVoice';
import { auditionKeys } from '@/components/piano/auditionKeys';

/** How hard to play, in the words a player uses. */
const TOUCH = [
  { label: 'Soft', velocity: 40 },
  { label: 'Medium', velocity: 80 },
  { label: 'Hard', velocity: 120 },
] as const;

/**
 * "Hear the piano this program uses": when the user has the program's piano on this
 * machine (a `.npno` in the linked folder, or inside a backup there), a Listen control
 * on the piano card plays a few keys of it at a chosen touch. Decoded on demand, locally;
 * nothing is fetched or uploaded (`docs/LEGAL.md`). Renders nothing when there's no
 * folder or no matching piano — the card keeps its usual Nord download link.
 */
export function ProgramPianoAudition({ model }: { model: string }) {
  const folder = useFolderOptional();
  const result = folder?.result;
  const locals = useMemo(() => (result ? localPianos(result) : []), [result]);
  const match = useMemo(() => findProgramPiano(model, locals), [model, locals]);
  if (!folder || !match) return null;
  return <Audition key={match.piano.id} folder={folder} match={match} model={model} />;
}

function Audition({ folder, match, model }: { folder: FolderLibrary; match: ProgramPianoMatch; model: string }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(match.piano.bytes ?? null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [touch, setTouch] = useState<(typeof TOUCH)[number]>(TOUCH[1]);
  // Collapsing hands the voice no bytes, which stops whatever is sounding.
  const { dir, zoneCount, playing, error, toggle } = usePianoVoice(open ? bytes : null);
  const zones = useMemo(() => (bytes ? readNspZones(bytes) : []), [bytes]);
  const keys = useMemo(() => auditionKeys(zones, zoneCount), [zones, zoneCount]);

  async function onListen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    const ref = match.piano.backupRef;
    if (bytes || !ref) return;
    getSharedCtx(); // unlock audio inside this tap; opening the backup below is async
    setLoading(true); setLoadError('');
    try {
      setBytes(await extractBackupEntry(folder, ref));
    } catch {
      setLoadError(`Couldn't open ${model} from your backup.`);
    } finally {
      setLoading(false);
    }
  }

  const where = match.piano.source === 'backup' ? 'In your backup' : 'In your files';
  const note = 'text-[11px] leading-snug';

  return (
    <div className="mt-1 mb-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          className="min-h-11"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? `Hide ${model}` : `Listen to ${model}`}
          onClick={() => void onListen()}
        >
          {open ? 'Hide' : 'Listen'}
        </Button>
        <span className={`${note} text-dim`}>
          {where}{match.version ? ` · v${match.version}` : ''}
        </span>
      </div>
      {open && (
        <div id={panelId} className="mt-2.5 flex flex-col gap-2.5">
          {loading && <p className={`${note} text-dim`}>Opening your piano…</p>}
          {loadError && <p className="on-error">{loadError}</p>}
          {bytes && !dir && <p className={`${note} text-dim`}>This piano's sounds can't be played here.</p>}
          {dir && (
            <>
              <div role="group" aria-label="How hard to play" className="flex flex-wrap gap-1.5">
                {TOUCH.map((t) => (
                  <Button
                    key={t.label}
                    variant={touch === t ? 'outline' : 'ghost'}
                    className="min-h-11"
                    aria-pressed={touch === t}
                    onClick={() => setTouch(t)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              <div role="group" aria-label="Keys" className="flex flex-wrap gap-1.5">
                {keys.map((k) => (
                  <Button
                    key={k.id}
                    variant={playing === k.id ? 'primary' : 'secondary'}
                    className="min-h-11 min-w-12"
                    aria-label={`${playing === k.id ? 'Stop' : 'Play'} ${k.label}, ${touch.label.toLowerCase()}`}
                    onClick={() => toggle(k.id, k.zone, touch.velocity, k.semitones)}
                  >
                    {k.label}
                  </Button>
                ))}
              </div>
            </>
          )}
          {error && <p className="on-error">{error}</p>}
          {match.versionUncertain && (
            <p className={`${note} text-dim`}>
              Nord made more than one version of this piano — yours may sound slightly
              different from the one this program was saved with.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
