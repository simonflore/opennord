import { memo } from 'react';
import '../../styles/nord.css';
import { cn } from '@/lib/cn';
import { SourceBadge } from '../ui';
import { Led } from '../shell/Led';
import { LibraryRow, FavoriteStar } from './LibraryCard';
import { ZoneStrip } from './ZoneStrip';
import { SlotTag, genTone } from './SlotTag';
import { CardRemoveButton } from './CardRemoveButton';
import { activeEngineKinds, type EngineKind, type EngineSummary } from '../../lib/clavia/engines';
import { isNs4Program, type NordProgram } from '../../lib/formats';
import { activeLayers, fxChips } from '../../lib/ns4/view';
import type { LibraryEntry } from '../../lib/library/types';

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

const ENGINES: { kind: EngineKind; letter: string; name: string }[] = [
  { kind: 'piano', letter: 'P', name: 'Piano' },
  { kind: 'organ', letter: 'O', name: 'Organ' },
  { kind: 'synth', letter: 'S', name: 'Synth' },
];

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
      <span className={WIDE}>{ns4 ? fxChips(ns4).length : dash}</span>
    </>
  );
});

/**
 * The program list as a console table (B×A): a header naming each column, then
 * one dense row per program, on the shared LibraryRow (Enter/Space open, the
 * favourite star, remove for an imported program). The J/K keys that step
 * through it are useStepKeys, on the program page (so they work with the
 * table folded away on a narrow screen too).
 */
export function ProgramTable({
  entries, activeId, favorites, onToggleFavorite, onOpen, onRemove,
}: {
  entries: LibraryEntry[];
  activeId?: string | null;
  favorites: ReadonlySet<string>;
  onToggleFavorite: (id: string) => void;
  onOpen: (e: LibraryEntry) => void;
  onRemove: (id: string) => void;
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
        <LibraryRow
          key={e.id}
          className={cn(COLS, 'min-h-10 font-mono text-[11px] text-dim')}
          selected={e.id === activeId}
          onOpen={() => onOpen(e)}
        >
          <FavoriteStar name={e.name} favorite={favorites.has(e.id)} onToggle={() => onToggleFavorite(e.id)} />
          <span>
            <SlotTag tone={e.slot ? undefined : genTone(e.generation)}>{e.slot ?? e.typeLabel ?? 'file'}</SlotTag>
          </span>
          <span className="min-w-0 truncate font-sans text-[14px] font-semibold text-ink">{e.name}</span>
          <span className={cn(WIDE, 'truncate font-sans text-[12px]')}><Col>Category</Col>{e.category ?? dash}</span>
          <EngineLeds summary={e.engines} />
          <span className={WIDE}><ZoneStrip program={e.program} fallback={dash} /></span>
          <ProgramFacts program={e.program} />
          <span className="flex items-center gap-2">
            <span className={WIDE}><SourceBadge source={e.source} /></span>
            {e.source === 'local' && (
              <CardRemoveButton name={e.name} onRemove={(ev) => { ev.stopPropagation(); onRemove(e.id); }} />
            )}
          </span>
        </LibraryRow>
      ))}
      <p className="m-0 px-3 py-2 font-mono text-[10px] text-muted max-[720px]:hidden">
        <kbd>J</kbd> <kbd>K</kbd> next / previous · <kbd>↵</kbd> open
      </p>
    </div>
  );
}

/**
 * The LED filter keys above the table, as on the instrument: lit keys narrow the
 * list to programs that play every lit engine, and Split to programs that split
 * the keyboard. Press a lit key to let it go.
 */
export function TraitKeys({ engines, onToggleEngine, splitOnly, onSplitOnly }: {
  engines: ReadonlySet<EngineKind>;
  onToggleEngine: (k: EngineKind) => void;
  splitOnly: boolean;
  onSplitOnly: (on: boolean) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Show programs that play">
      {ENGINES.map((e) => (
        <button
          key={e.kind}
          className={cn('ps-key', engines.has(e.kind) && 'on')}
          aria-pressed={engines.has(e.kind)}
          onClick={() => onToggleEngine(e.kind)}
        >{e.name}</button>
      ))}
      <button className={cn('ps-key', splitOnly && 'on')} aria-pressed={splitOnly} onClick={() => onSplitOnly(!splitOnly)}>
        Split
      </button>
    </div>
  );
}
