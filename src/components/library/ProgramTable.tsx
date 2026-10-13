import { memo } from 'react';
import { cn } from '@/lib/cn';
import { SourceBadges } from '../ui';
import { Led } from '../shell/Led';
import { LibraryRow, FavoriteStar } from './LibraryCard';
import { ZoneStrip } from './ZoneStrip';
import { SlotTag, genTone } from './SlotTag';
import { CardRemoveButton } from './CardRemoveButton';
import { activeEngineKinds, LIBRARY_ENGINES as ENGINES, type EngineSummary } from '../../lib/clavia/engines';
import { isNs4Program, type NordProgram } from '../../lib/formats';
import { activeLayers } from '../../lib/ns4/view';
import { fxGroups } from '../../lib/ns4/fx-panel';
import { unitsOn } from '../../lib/clavia/fx-view';
import type { LibraryEntry } from '../../lib/library/types';
import { importedMember, isFavoriteRow, nordSlotOf } from '../../lib/library/found-on';

// One row's columns: favourite, slot, name, category, the P/O/S engine LEDs,
// zones, piano, effects, source. In a narrow container (the list beside an open
// program, a phone) it folds to favourite, slot, name and LEDs, keeping the
// remove button for an imported program.
const COLS = cn(
  'grid items-center gap-x-3 pr-3',
  // Fixed widths throughout (the name takes the rest), so every row lines up
  // whatever its last cell holds (a badge, or a badge and the remove button).
  'grid-cols-[36px_52px_minmax(0,1fr)_88px_52px_64px_84px_24px_96px]',
  '@max-[600px]:grid-cols-[36px_52px_minmax(0,1fr)_52px_44px]',
);
// The columns a narrow container drops.
const WIDE = '@max-[600px]:hidden';

const dash = <span className="text-muted">—</span>;
/** A cell's column name for screen readers (the header row is visual only). */
const Col = ({ children }: { children: string }) => <span className="sr-only">{children}: </span>;

/** The P/O/S LEDs: lit for each engine the program plays. */
function EngineLeds({ summary }: { summary?: EngineSummary }) {
  if (!summary) return dash;
  const on = activeEngineKinds(summary);
  const label = ENGINES.map((e) => `${e.name} ${on.has(e.kind) ? 'on' : 'off'}`).join(', ');
  return (
    <span className="flex items-center gap-[9px]" role="img" aria-label={label}>
      {ENGINES.map((e) => <Led key={e.kind} on={on.has(e.kind)} />)}
    </span>
  );
}

/**
 * The piano type a program plays and how many effects are on (a Stage 4
 * program; other formats show a dash). Memoised like ZoneStrip: a row's program
 * object is stable while the list re-renders on every search keystroke.
 */
const ProgramFacts = memo(function ProgramFacts({ program }: { program?: NordProgram }) {
  const ns4 = program && isNs4Program(program) ? program : undefined;
  // Stage 4 stacks up to two piano layers: both types, once each.
  const pianos = ns4 && [...new Set(activeLayers(ns4).filter((l) => l.kind === 'piano').map((l) => l.pianoType).filter(Boolean))];
  const piano = pianos && pianos.length ? pianos.join(' + ') : undefined;
  return (
    <>
      <span className={cn(WIDE, 'truncate')}>{piano ?? dash}</span>
      <span className={WIDE}>{ns4 ? unitsOn(fxGroups(ns4)) : dash}</span>
    </>
  );
});

type RowActions = {
  onOpen: (e: LibraryEntry) => void;
  onToggleFavorite: (entry: LibraryEntry) => void;
  /** Remove an imported program, by the id of the imported copy (a row may be found elsewhere too). */
  onRemove: (id: string) => void;
};

/**
 * One program row. Memoised on its entry, open and favourite state (the
 * handlers are stable): stepping with J/K or starring a program re-renders the
 * rows that changed, not the list.
 */
const ProgramRow = memo(function ProgramRow({ entry: e, selected, favorite, onOpen, onToggleFavorite, onRemove }: RowActions & {
  entry: LibraryEntry;
  selected: boolean;
  favorite: boolean;
}) {
  const importedId = importedMember(e);
  // A sound on the Nord shows its slot even when the row is shown as a file here;
  // the file's format still tints it, so the column says both.
  const onNord = nordSlotOf(e);
  return (
    <LibraryRow
      // content-visibility: a row off screen skips layout and paint (a folder
      // can hold thousands); 40px (a row's fixed height) stands in until it is
      // first shown. Its paint containment would clip the star's and remove
      // button's focus rings at the row edge, so it applies only where a clip
      // margin can let them through (not Safari yet).
      className={cn(
        COLS, 'min-h-10 font-mono text-[11px] text-dim',
        'supports-[overflow-clip-margin:8px]:[content-visibility:auto] [contain-intrinsic-block-size:auto_40px] [overflow-clip-margin:8px]',
      )}
      selected={selected}
      onOpen={() => onOpen(e)}
    >
      <FavoriteStar name={e.name} favorite={favorite} onToggle={() => onToggleFavorite(e)} />
      <span title={onNord && e.source !== 'nord' && e.typeLabel ? `${onNord} on your Nord · ${e.typeLabel} file` : undefined}>
        <SlotTag tone={e.source === 'nord' ? undefined : genTone(e.generation)}>{onNord ?? e.slot ?? e.typeLabel ?? 'file'}</SlotTag>
      </span>
      <span className="min-w-0 truncate font-sans text-[14px] font-semibold text-ink">{e.name}</span>
      <span className={cn(WIDE, 'truncate font-sans text-[12px]')}><Col>Category</Col>{e.category ?? dash}</span>
      <EngineLeds summary={e.engines} />
      <span className={WIDE}><ZoneStrip program={e.program} fallback={dash} /></span>
      <ProgramFacts program={e.program} />
      <span className="flex items-center gap-2">
        <span className={WIDE}><SourceBadges entry={e} /></span>
        {importedId && (
          <CardRemoveButton name={e.name} onRemove={() => onRemove(importedId)} />
        )}
      </span>
    </LibraryRow>
  );
});

/**
 * The program list as a console table (B×A): a header naming each column, then
 * one dense row per program, on the shared LibraryRow (Enter/Space open, the
 * favourite star, remove for an imported program). The J/K keys that step
 * through it are useStepKeys, on the program page (so they work with the
 * table folded away on a narrow screen too).
 */
export const ProgramTable = memo(function ProgramTable({
  entries, activeId, favorites, ...actions
}: RowActions & {
  entries: LibraryEntry[];
  activeId?: string | null;
  favorites: ReadonlySet<string>;
}) {
  return (
    <div className="@container">
      <div
        className={cn(
          COLS,
          'sticky top-[var(--sticky-top)] z-[1] border-b border-line bg-bg py-1.5',
          'font-mono text-[10px] uppercase tracking-[0.08em] text-muted',
        )}
        aria-hidden="true"
      >
        <span />
        <span>Slot</span>
        <span>Name</span>
        <span className={WIDE}>Cat</span>
        <span className="flex gap-[9px] [&>span]:w-[7px] [&>span]:text-center">
          {ENGINES.map((e) => <span key={e.kind}>{e.letter}</span>)}
        </span>
        <span className={WIDE}>Zones</span>
        <span className={WIDE}>Piano</span>
        <span className={WIDE}>FX</span>
        <span className={WIDE}>Source</span>
      </div>
      {entries.map((e) => (
        <ProgramRow key={e.id} entry={e} selected={e.id === activeId} favorite={isFavoriteRow(favorites, e)} {...actions} />
      ))}
      <p className="m-0 px-3 py-2 font-mono text-[10px] text-muted max-[720px]:hidden">
        <kbd>J</kbd> <kbd>K</kbd> next / previous · <kbd>↵</kbd> open
      </p>
    </div>
  );
});
