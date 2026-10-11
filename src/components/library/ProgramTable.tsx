import { memo, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { SourceBadge, anyDialogOpen } from '../ui';
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
  'grid-cols-[36px_52px_minmax(0,1fr)_88px_52px_64px_84px_24px_auto]',
  '@max-[600px]:grid-cols-[36px_52px_minmax(0,1fr)_52px_auto]',
);
// The columns a narrow container drops.
const WIDE = '@max-[600px]:hidden';

const ENGINES: { kind: EngineKind; letter: string; name: string }[] = [
  { kind: 'piano', letter: 'P', name: 'Piano' },
  { kind: 'organ', letter: 'O', name: 'Organ' },
  { kind: 'synth', letter: 'S', name: 'Synth' },
];

const dash = <span className="text-muted">—</span>;

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
  const piano = ns4 && activeLayers(ns4).find((l) => l.kind === 'piano')?.pianoType;
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
 * favourite star, remove for an imported program). J/K open the next or
 * previous program, skipping Nord slots that haven't been read yet.
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
  useStepKeys(entries, activeId, onOpen);
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
        <span className={cn(WIDE, 'text-right')}>Source</span>
      </div>
      {entries.map((e) => (
        <LibraryRow
          key={e.id}
          className={cn(COLS, 'min-h-10 font-mono text-[11px] text-dim')}
          selected={e.id === activeId}
          onOpen={() => onOpen(e)}
          label={e.name}
        >
          <FavoriteStar name={e.name} favorite={favorites.has(e.id)} onToggle={() => onToggleFavorite(e.id)} />
          <span>
            <SlotTag tone={e.slot ? undefined : genTone(e.generation)}>{e.slot ?? e.typeLabel ?? 'file'}</SlotTag>
          </span>
          <span className="min-w-0 truncate font-sans text-[14px] font-semibold text-ink">{e.name}</span>
          <span className={cn(WIDE, 'truncate font-sans text-[12px]')}>{e.category ?? dash}</span>
          <EngineLeds summary={e.engines} />
          <span className={WIDE}><ZoneStrip program={e.program} /></span>
          <ProgramFacts program={e.program} />
          <span className="flex items-center justify-end gap-2">
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
 * J and K open the next and previous program in the list (from the open one, or
 * the first with none open). Left alone while typing, over a dialog, or with a
 * modifier held; Nord slots not read yet (no program) are stepped over, since
 * opening one leaves for the Device page. One listener for the table's
 * lifetime, reading the latest list through a ref.
 */
function useStepKeys(entries: LibraryEntry[], activeId: string | null | undefined, onOpen: (e: LibraryEntry) => void) {
  const latest = useRef({ entries, activeId, onOpen });
  useEffect(() => { latest.current = { entries, activeId, onOpen }; });
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const key = ev.key.toLowerCase();
      if ((key !== 'j' && key !== 'k') || ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey) return;
      const t = ev.target;
      if ((t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]')) || anyDialogOpen()) return;
      const { entries, activeId, onOpen } = latest.current;
      const readable = entries.filter((e) => e.program);
      if (!readable.length) return;
      const at = readable.findIndex((e) => e.id === activeId);
      const next = at < 0 ? readable[0] : readable[key === 'j' ? Math.min(at + 1, readable.length - 1) : Math.max(at - 1, 0)];
      if (next.id === activeId) return;
      ev.preventDefault();
      onOpen(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
