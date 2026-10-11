import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { useFileSupportOptIn } from '../../lib/diagnostics/file-support-pref';
import { cn } from '../../lib/cn';

/** Plain-language summary of what a file-support report holds — shared by every place the toggle shows. */
export const FILE_SUPPORT_COPY =
  'When this is on, each program you open sends one short report on how well OpenNord could read it: ' +
  'the file type and size, which Nord it comes from, its format version, a few format markers from the ' +
  'start of the file (not enough to rebuild a sound), whether OpenNord read the whole program or only ' +
  'its header, and your browser and OpenNord version. Your sounds and settings, program names and file ' +
  'names are never sent. One report per file ' +
  'per visit. Off unless you turn it on; the choice is saved on this device only.';

/**
 * The "Help improve file support" opt-in (lib/diagnostics/file-read.ts). Off by
 * default, per device. Says where reports go: a build without a diagnostics
 * server only logs to the browser console, and the copy says so.
 */
export function FileSupportToggle({ className, showTitle = true }: { className?: string; showTitle?: boolean }) {
  const [on, setOn] = useFileSupportOptIn();
  const { diagnostics } = useCapabilities();
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        {showTitle && <div className="text-[13px] font-bold text-ink">Help improve file support</div>}
        <label className={cn('inline-flex cursor-pointer items-center gap-2', !showTitle && 'ml-auto')}>
          <span className="font-mono text-[12px] text-dim">{on ? 'On' : 'Off'}</span>
          <input
            type="checkbox"
            role="switch"
            checked={on}
            aria-label="Help improve file support"
            onChange={(e) => setOn(e.currentTarget.checked)}
            className="size-[18px] cursor-pointer accent-accent"
          />
        </label>
      </div>
      <p className="m-0 mt-1 text-[13px] leading-[1.55] text-dim">{FILE_SUPPORT_COPY}</p>
      {!diagnostics.remote && (
        <p className="m-0 mt-1 text-[12px] leading-[1.5] text-muted">
          This copy of OpenNord isn’t connected to a server, so reports stay in your browser’s developer console.
        </p>
      )}
    </div>
  );
}
