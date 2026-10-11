import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Dialog } from '../ui';
import { cn } from '@/lib/cn';
import { READY_CATEGORIES } from '../../lib/library/categories';
import { SOURCE_LABEL, type LibrarySource } from '../../lib/library/types';
import { useLibraryState } from '../../lib/library/LibraryContext';
import { usePresetsState } from '../../lib/library/PresetsContext';
import { useSamplesState } from '../../lib/library/SamplesContext';
import { usePianosState } from '../../lib/library/PianosContext';
import { openProgram } from '../library/openProgram';
import { rankCommands, type Command } from './commands';
import { ABOUT, DEV_DESTS, useTools } from './nav';
import { groupLabel, rowActive } from './styles';

const hint = (e: { slot?: string; source: LibrarySource }) => e.slot ?? SOURCE_LABEL[e.source];

/** Everything the palette can jump to: the pages, then every program, preset, sample and piano. */
function useCommands(): Command[] {
  const navigate = useNavigate();
  const tools = useTools();
  const programs = useLibraryState().all;
  const presets = usePresetsState();
  const samples = useSamplesState();
  const pianos = usePianosState();
  // Only the (memoised) lists and the stable reveal() go into the memo, so typing
  // or a provider update that doesn't touch the lists keeps the same commands.
  const lists = useMemo(() => [
    { group: 'Presets' as const, to: '/library/presets' as const, all: presets.all, reveal: presets.reveal },
    { group: 'Samples' as const, to: '/library/samples' as const, all: samples.all, reveal: samples.reveal },
    { group: 'Pianos' as const, to: '/library/pianos' as const, all: pianos.all, reveal: pianos.reveal },
  ], [presets.all, presets.reveal, samples.all, samples.reveal, pianos.all, pianos.reveal]);

  return useMemo(() => {
    const pages: Command[] = [
      ...READY_CATEGORIES.map((c) => ({ to: c.path, label: c.label })),
      // A tool that can't be used here (Device without USB) is left out, as the rail greys it out.
      ...tools.filter((d) => !d.disabled),
      ...(__RE__ ? DEV_DESTS : []),
      ABOUT,
    ].map((d) => ({ id: `page:${d.to}`, group: 'Pages', label: d.label, run: () => navigate({ to: d.to }) }));

    const programCommands = programs.map((e): Command => ({
      id: `program:${e.id}`, group: 'Programs', label: e.name, hint: hint(e),
      run: () => openProgram(navigate, e),
    }));

    // Presets, samples and pianos have no page of their own: jumping to one opens
    // its list with every filter off, searched down to that name.
    const entries = lists.flatMap(({ group, to, all, reveal }) => all.map((e): Command => ({
      id: `${group}:${e.id}`, group, label: e.name, hint: hint(e),
      run: () => { reveal(e.name); navigate({ to }); },
    })));

    return [...pages, ...programCommands, ...entries];
  }, [navigate, tools, programs, lists]);
}

/**
 * ⌘K: jump to any page, program, preset, sample or piano by typing part of its
 * name. ↑/↓ move, Enter opens, Escape closes. With nothing typed it lists the
 * pages, so on a phone it doubles as the "more" menu.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      bare
      open={open}
      onClose={onClose}
      title="Go to"
      className="left-1/2 top-[12vh] flex max-h-[70vh] w-[min(92vw,560px)] -translate-x-1/2 flex-col overflow-hidden"
    >
      {/* The dialog mounts its content only while open, so the command list is
          built when the palette opens and each opening starts fresh. */}
      <PaletteBody onClose={onClose} />
    </Dialog>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const commands = useCommands();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => rankCommands(commands, query), [commands, query]);
  // The highlighted row, kept inside the results (they can shrink while open).
  const active = results.length === 0 ? -1 : Math.min(Math.max(index, 0), results.length - 1);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(Math.min(active + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(Math.max(active - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
  };

  return (
    <>
      <input
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-results"
        aria-activedescendant={active >= 0 ? `palette-${active}` : undefined}
        aria-label="Go to a program, sample or page"
        placeholder="Go to a program, sample or page…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
        onKeyDown={onKeyDown}
        className="h-12 flex-none border-0 border-b border-line bg-transparent px-4 font-mono text-sm text-ink outline-none focus-visible:outline-none placeholder:text-muted"
      />
      <div ref={listRef} id="palette-results" role="listbox" aria-label="Results" className="overflow-y-auto py-1">
        {results.length === 0 && <div className="px-4 py-3 font-mono text-xs text-muted">Nothing matches “{query}”.</div>}
        {results.map((c, i) => (
          <div key={c.id}>
            {(i === 0 || results[i - 1].group !== c.group) && (
              <div className={cn(groupLabel, 'pt-2.5')}>{c.group}</div>
            )}
            <div
              id={`palette-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setIndex(i)}
              onClick={() => run(c)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-1.5 font-mono text-xs',
                i === active ? rowActive : 'text-dim',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              {c.hint && <span className="flex-none text-muted">{c.hint}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-none gap-4 border-t border-line px-4 py-2 font-mono text-[10px] text-muted">
        <span>↑↓ move</span><span>↵ open</span><span>esc close</span>
      </div>
    </>
  );
}
