import { useId, useRef, useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { sendNameFor, useSendSample } from '@/components/device/useSendSample';
import { useSaveBytes } from '@/components/sample/useSaveBytes';
import { useSamplesState } from '@/lib/library/SamplesContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { buildProject } from '@/lib/sample-build/build';
import { writeOnsample } from '@/lib/sample-build/onsample';
import type { SampleProject } from '@/lib/sample-build/model';
import type { ReadAudio } from '@/lib/sample-build/render';
import { TARGETS } from '@/lib/sample-build/targets';
import { NOT_YET_TRIED } from '@/lib/device/write-guard';
import { NSMP4_ONLY } from '@/lib/device/library-file';
import { getErrorMessage } from '@/lib/errors';
import { fileNameStem } from '@/lib/ns4/nsp-write';
import { IssueRows } from './IssuesList';
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

  /** Build (or reuse Listen's file) and send it; the hook says how it went. */
  async function sendNow() {
    if (busyRef.current || send.busy) return;
    busyRef.current = true; setBusy(true);
    setMessage(''); saver.clear();
    try {
      const r = built?.project === project ? built.file : buildProject(project, read);
      await send.send(r.bytes, sendNameFor(project.name)); // trimmed, never empty
    } catch (e) {
      setMessage(`Couldn’t send: ${getErrorMessage(e)}`);
    } finally {
      busyRef.current = false; setBusy(false);
    }
  }

  const blocked = errors.length > 0 || saver.saving || busy;
  return (
    <Dialog open onClose={onClose} title="Save"
      footer={(
        <>
          <Button variant="secondary" className="min-h-11" disabled={blocked} onClick={() => void saveProjectFile()}>Save project file</Button>
          <Button variant="primary" className="min-h-11" disabled={blocked} onClick={() => void saveFile()}>{piano ? 'Save piano' : 'Save sample'}</Button>
        </>
      )}>
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
            <div className="flex flex-col gap-1">
              <Button
                variant="secondary"
                className="min-h-11 self-start"
                disabled={blocked || send.busy || !!sendReason}
                aria-describedby={sendReason ? sendReasonId : undefined}
                onClick={() => void sendNow()}
              >
                Send to Nord
              </Button>
              {sendReason && <p id={sendReasonId} className="text-sm text-dim">{sendReason}</p>}
            </div>
          )}
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
