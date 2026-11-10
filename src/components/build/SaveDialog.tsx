import { useId, useRef, useState } from 'react';
import { Button, Dialog, selectClass } from '@/components/ui';
import { sendNameFor, useSendSample } from '@/components/device/useSendSample';
import { useSaveBytes } from '@/components/sample/useSaveBytes';
import { useSamplesState } from '@/lib/library/SamplesContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { buildProject } from '@/lib/sample-build/build';
import { writeOnsample } from '@/lib/sample-build/onsample';
import { writeNsmpproj, zipNsmpproj } from '@/lib/sample-build/nsmpproj';
import { VERSION_LABEL } from '@/lib/version';
import type { SampleProject } from '@/lib/sample-build/model';
import type { ReadAudio } from '@/lib/sample-build/render';
import { TARGETS } from '@/lib/sample-build/targets';
import { NOT_YET_TRIED } from '@/lib/device/write-guard';
import { NSMP4_ONLY } from '@/lib/device/library-file';
import { getErrorMessage } from '@/lib/errors';
import { fileNameStem } from '@/lib/ns4/nsp-write';
import { IssueRows } from './IssuesList';
import { useSampleSpace } from '@/components/device/useSampleSpace';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { LastBuild } from './useBuiltFile';

/**
 * Save the build (spec §7, canvas "Save & send"): the checks, then the file and the project, and
 * with a Nord connected, Send to Nord (spec §11). `built` is the last file Listen made; it is saved as is when it is of this project.
 */
export function SaveDialog({ project, read, built, onClose }: { project: SampleProject; read: ReadAudio; built?: LastBuild | null; onClose: () => void }) {
  const issues = TARGETS[project.target].check(project);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const piano = TARGETS[project.target].partition === 'piano';
  const samples = useSamplesState();
  const folder = useFolder();
  const saver = useSaveBytes({ failLabel: 'Couldn’t save' });
  // Saving into the Library isn't a file save, so its "done" is said here; failures go through the saver.
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // a double click lands before the re-render that disables the buttons
  const send = useSendSample();
  const space = useSampleSpace(send.connected && !piano);
  const [place, setPlace] = useState(''); // "bank:slot"; '' = the first empty place
  const chosen = space.places.find((x) => `${x.bank}:${x.slot}` === place);
  const sendReasonId = useId();
  // Pianos stay off until their hardware session; only .nsmp4 goes to a Stage 4.
  const sendReason = piano ? NOT_YET_TRIED.piano : project.target !== 'nsmp4' ? NSMP4_ONLY : send.refusal();
  const projectFileName = `${fileNameStem(project.name, 'Sample')}.onsample`;

  /** One save at a time; a failure is said as "Couldn’t save: …" (not the converter's wording). */
  async function run(work: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    setMessage(''); saver.clear();
    try { await work(); } catch (e) { saver.fail(e); } finally { busyRef.current = false; setBusy(false); }
  }

  // saver.save puts the file in the linked folder, or downloads it when there is none.
  const saveFile = () => run(async () => {
    const r = built?.project === project ? built.file : buildProject(project, read);
    if (folder.folderName || piano) {
      await saver.save(r.bytes, r.fileName, false, r.warnings);
    } else {
      await samples.importSample(new File([r.bytes as BlobPart], r.fileName));
      setMessage(`Added ${r.fileName} to your Library.`);
    }
  });

  const saveProjectFile = () => run(async () => {
    await saver.save(writeOnsample(project, read), projectFileName, false, []);
  });

  /** The build as a Nord Sample Editor project, zipped with its WAVs. Not held back by the checks: the editor has its own. */
  const saveEditorProject = () => run(async () => {
    const stem = fileNameStem(project.name, 'Sample');
    const written = writeNsmpproj(project, read, {
      builtFile: built?.project === project ? built.file.bytes : undefined,
      maker: { name: 'OpenNord', version: VERSION_LABEL },
    });
    await saver.save(zipNsmpproj(`${stem}.nsmpproj`, written), `${stem} (Nord Sample Editor).zip`, false, []);
  });

  /** Build (or reuse Listen's file) and send it; the hook says how it went. */
  async function sendNow() {
    if (busyRef.current || send.busy) return;
    busyRef.current = true; setBusy(true);
    setMessage(''); saver.clear();
    try {
      const r = built?.project === project ? built.file : buildProject(project, read);
      const name = sendNameFor(project.name); // trimmed, never empty
      await (chosen ? send.send(r.bytes, name, { bank: chosen.bank, slot: chosen.slot }) : send.send(r.bytes, name));
    } catch (e) {
      setMessage(`Couldn’t send: ${getErrorMessage(e)}`);
    } finally {
      busyRef.current = false; setBusy(false);
    }
  }

  const blocked = errors.length > 0 || saver.saving || busy;
  return (
    <Dialog open onClose={onClose} title="Save"
      footer={<Button variant="primary" className="min-h-11" disabled={blocked} onClick={() => void saveFile()}>{piano ? 'Save piano' : 'Save sample'}</Button>}>
      {saver.dialog ?? (
        <div className="flex min-w-0 flex-col gap-3">
          <div className="ps-lcd break-words">{project.name}</div>
          {errors.length > 0 && <p className="font-medium text-danger">Fix these before saving</p>}
          <ul className="flex flex-col gap-1">
            <IssueRows issues={[...errors, ...warnings]} />
            {!issues.length && <li className="text-dim">Ready to save.</li>}
          </ul>
          <p className="text-sm text-dim">{folder.folderName ? `Saves into ${folder.folderName}.` : piano ? 'Downloads the piano file.' : 'Adds the sample to your Library.'}</p>
          {piano && <p className="text-sm text-dim">{NOT_YET_TRIED.piano}</p>}
          {send.connected && !piano && (
            <div className="flex flex-col gap-2">
              {space.capacity && <SampleMemory capacity={space.capacity} adds={built?.project === project ? built.file.bytes.length : undefined} />}
              {space.places.length > 0 && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase tracking-wider text-dim">Location on the Nord</span>
                  <select className={cn(selectClass, 'min-h-11 self-start')} value={place} onChange={(e) => setPlace(e.target.value)} disabled={blocked || send.busy}>
                    <option value="">{space.places[0].label} · first empty</option>
                    {space.places.slice(1).map((x) => <option key={`${x.bank}:${x.slot}`} value={`${x.bank}:${x.slot}`}>{x.label} · empty</option>)}
                  </select>
                </label>
              )}
              <Button
                variant="secondary"
                className="min-h-11 self-start"
                disabled={blocked || send.busy || !!sendReason}
                aria-describedby={sendReason ? sendReasonId : undefined}
                onClick={() => void sendNow()}
              >
                {chosen ? `Send to Nord, ${chosen.label}` : 'Send to Nord'}
              </Button>
              <p className="m-0 text-sm text-dim">Goes to an empty place: nothing on the Nord is replaced.</p>
              {sendReason && <p id={sendReasonId} className="text-sm text-dim">{sendReason}</p>}
            </div>
          )}
          {/* The build itself, not a Nord file: saving it isn't held back by the checks. */}
          <details className="group rounded-md border border-line px-3.5 py-2">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm text-dim hover:text-ink">Other ways to save</summary>
            <div className="flex flex-col gap-3 pb-2 pt-1">
              <div className="flex flex-col gap-1">
                <Button variant="secondary" className="min-h-11 self-start" disabled={saver.saving || busy} onClick={() => void saveProjectFile()}>Save project file</Button>
                <p className="m-0 text-sm text-muted">The whole build (.onsample), to carry on later or on another computer.</p>
              </div>
              {!piano && (
                <div className="flex flex-col gap-1">
                  <Button variant="secondary" className="min-h-11 self-start" disabled={saver.saving || busy} onClick={() => void saveEditorProject()}>Save for Nord Sample Editor</Button>
                  <p className="m-0 text-sm text-muted">A .zip with a Nord Sample Editor project and its recordings: unzip it and open the .nsmpproj.</p>
                </div>
              )}
            </div>
          </details>
          {/* How the save went, announced: done, warnings, or why it failed. */}
          <div role="status" className="flex flex-col gap-1">
            {message && <p className="text-sm">{message}</p>}
            {saver.report}
            {/* Stays while the Nord is gone: a Nord that stopped answering says what to do. */}
            {send.status && <p className="text-sm">{send.status}</p>}
          </div>
        </div>
      )}
    </Dialog>
  );
}

/** The Nord's sample memory: what's free, and the sliver this sample takes when its size is known. */
function SampleMemory({ capacity, adds }: { capacity: NonNullable<ReturnType<typeof useSampleSpace>['capacity']>; adds?: number }) {
  const total = capacity.usedBlocks + capacity.freeBlocks;
  const block = capacity.blockSizeBytes;
  const usedPct = total ? (capacity.usedBlocks / total) * 100 : 0;
  const addPct = total && block && adds ? Math.max(0.3, (adds / (total * block)) * 100) : 0;
  const free = block ? `${formatBytes(capacity.freeBlocks * block)} free` : `${Math.round(100 - usedPct)}% free`;
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-line bg-surface-2 px-3.5 py-3">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-dim">Sample memory on the Nord</span>
        <span className="font-mono">{free}{block && total ? ` of ${formatBytes(total * block)}` : ''}</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-sm bg-sink" role="meter" aria-label="Sample memory used"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(usedPct)}>
        <div className="absolute inset-y-0 left-0 bg-line" style={{ width: `${usedPct}%` }} />
        {addPct > 0 && <div className="absolute inset-y-0 bg-accent" style={{ left: `${usedPct}%`, width: `${addPct}%` }} />}
      </div>
      {adds !== undefined && <div className="text-xs text-muted">This sample takes {formatBytes(adds)}{addPct > 0 ? ': the orange sliver' : ''}.</div>}
    </div>
  );
}
