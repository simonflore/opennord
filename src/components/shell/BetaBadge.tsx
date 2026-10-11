import { BUILD, COMMIT, VERSION_FULL } from '../../lib/version';

const BUILD_LABEL = String(BUILD ?? COMMIT ?? 'dev');

/**
 * The beta label and build number a player quotes in a bug report, with the
 * no-warranty notice as its tooltip. The rail shows it at its foot (with the
 * short "use at your own risk" note); at phone width, where the rail is gone,
 * the top bar shows it instead.
 */
export function BetaBadge({ withNote }: { withNote?: boolean }) {
  return (
    <div
      className="flex flex-col gap-[3px]"
      title={`${VERSION_FULL}. OpenNord is beta software, provided as-is with no warranty. Features may break, and device transfer writes to real hardware — back up your keyboard first. Use at your own risk.`}
    >
      <span className="flex items-center gap-1.5">
        <span className="rounded-sm border border-warn px-[5px] py-px text-[8px] font-bold tracking-[1px] text-warn">BETA</span>
        <span className="font-mono text-[10px] text-dim" aria-label={`build ${BUILD_LABEL}`}>{BUILD_LABEL}</span>
      </span>
      {withNote && <span className="text-[9px] leading-[1.4] text-muted">use at your own risk</span>}
    </div>
  );
}
