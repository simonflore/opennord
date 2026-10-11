import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Dialog } from '../ui';
import { cn } from '@/lib/cn';
import { READY_CATEGORIES } from '../../lib/library/categories';
import { SOURCE_LABEL, type LibrarySource } from '../../lib/library/types';
import { useLibraryState } from '../../lib/library/LibraryContext';
import { usePresetsState } from '../../lib/library/PresetsContext';
import { useSamplesState } from '../../lib/library/SamplesContext';
import { usePianosState } from '../../lib/library/PianosContext';
import { useOpenEntry } from '../library/openEntry';
import { rankCommands, type Command } from './commands';
import { ABOUT, COMMUNITY_SUB, COMMUNITY_TO, DEV_DESTS, useTools } from './nav';
import { groupLabel, rowActive } from './styles';

// The hint shows the slot, or where the entry lives; only the slot is searched
// (searching "Local" would match every local entry).
const hint = (e: { slot?: string; source: LibrarySource }) => e.slot ?? SOURCE_LABEL[e.source];

/** Everything the palette can jump to: the pages, then every program, preset, sample and piano. */
function useCommands(): Command[] {
  const navigate = useNavigate();
  const tools = useTools();
  const open = useOpenEntry();
  const { all: programs, ensureListed } = useLibraryState();
  const presets = usePresetsState();
  const samples = useSamplesState();
  const pianos = usePianosState();
  // Only the (memoised) lists and their stable callbacks go into the memo, so a
  // provider update that doesn't touch the lists keeps the same commands.
  const lists = useMemo(() => [
    { group: 'Presets' as const, all: presets.all, ensureListed: presets.ensureListed, open: open.preset },
    { group: 'Samples' as const, all: samples.all, ensureListed: samples.ensureListed, open: open.sample },
    { group: 'Pianos' as const, all: pianos.all, ensureListed: pianos.ensureListed, open: open.piano },
  ], [open, presets.all, presets.ensureListed, samples.all, samples.ensureListed, pianos.all, pianos.ensureListed]);

  return useMemo(() => {
    const pages: Command[] = [
      ...READY_CATEGORIES.map((c) => ({ to: c.path, label: c.label })),
      ...tools,
      // Community's own pages, reachable from here too (the phone has no rail).
      ...(tools.some((d) => d.to === COMMUNITY_TO) ? COMMUNITY_SUB.filter((d) => d.to !== COMMUNITY_TO) : []),
      ...(__RE__ ? DEV_DESTS : []),
      ABOUT,
    ].map((d) => ({ id: `page:${d.to}`, group: 'Pages', label: d.label, run: () => navigate({ to: d.to }) }));

    const programCommands = programs.map((e): Command => ({
      id: `program:${e.id}`, group: 'Programs', label: e.name, hint: hint(e), keywords: e.slot,
      // Only a program that opens beside the list needs its row shown (an unread
      // Nord slot goes to the Device page instead, leaving the list's filters alone).
      run: () => { if (e.program) ensureListed(e.id); open.program(e); },
    }));

    // Every entry opens on its own route, with its list showing its row.
    const entries = lists.flatMap(({ group, all, ensureListed: listed, open }) => all.map((e): Command => ({
      id: `${group}:${e.id}`, group, label: e.name, hint: hint(e), keywords: e.slot,
      run: () => { listed(e.id); open(e.id); },
    })));

    return [...pages, ...programCommands, ...entries];
  }, [navigate, open, tools, programs, ensureListed, lists]);
}

/**
 * ⌘K: jump to any page, program, preset, sample or piano by typing part of its
 * name. ↑/↓ move, Enter opens, Escape closes. With nothing typed it lists the
 * pages, so on a phone it doubles as the "more" menu.
 */
export function CommandPalette({ open, onClose, menu }: {
  open: boolean;
  onClose: () => void;
  /** Opened as the phone's More menu: no focus on the search, so no keyboard over the pages. */
  menu?: boolean;
}) {
  // ↑/↓/Enter are handled on the whole dialog, so they work before the search is
  // focused too (the More menu opens with the dialog itself focused).
  const keys = useRef<((e: KeyboardEvent<HTMLElement>) => void) | null>(null);
  return (
    <Dialog
      bare
      autoFocus={!menu}
      onKeyDown={(e) => keys.current?.(e)}
      open={open}
      onClose={onClose}
      title="Go to"
      className="left-1/2 top-[12vh] flex max-h-[70vh] w-[min(92vw,560px)] -translate-x-1/2 flex-col overflow-hidden"
    >
      {/* The dialog mounts its content only while open, so the command list is
          built when the palette opens and each opening starts fresh. */}
      <PaletteBody onClose={onClose} keys={keys} />
    </Dialog>
  );
}

function PaletteBody({ onClose, keys }: {
  onClose: () => void;
  keys: RefObject<((e: KeyboardEvent<HTMLElement>) => void) | null>;
}) {
  const commands = useCommands();
  const [query, setQuery] = useState('');
  // The highlighted command, by id, so results that change while open (a scan
  // adding entries) can't swap it for another; null means the top result.
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const results = useMemo(() => rankCommands(commands, query), [commands, query]);
  // Consecutive results of one group, each with its flat index (↑/↓ walk the flat list).
  const groups = useMemo(() => {
    const out: { group: Command['group']; items: { c: Command; i: number }[] }[] = [];
    results.forEach((c, i) => {
      const last = out[out.length - 1];
      if (last?.group === c.group) last.items.push({ c, i });
      else out.push({ group: c.group, items: [{ c, i }] });
    });
    return out;
  }, [results]);
  const found = results.findIndex((c) => c.id === activeId);
  const active = results.length === 0 ? -1 : found >= 0 ? found : 0;

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // Enter commits an IME composition, not a command (WebKit reports it as keyCode 229).
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (results.length) setActiveId(results[Math.min(active + 1, results.length - 1)].id); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (results.length) setActiveId(results[Math.max(active - 1, 0)].id); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
  };
  // Handed to the dialog after each render (the latest results and highlight).
  useEffect(() => {
    keys.current = onKeyDown;
    return () => { keys.current = null; };
  });

  return (
    <>
      <input
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-results"
        aria-activedescendant={active >= 0 ? `palette-${active}` : undefined}
        aria-label="Go to a program, sample or page"
        placeholder="Go to a program, sample or page…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveId(null);
          listRef.current?.scrollTo({ top: 0 }); // the new top result is the one Enter opens
        }}
        className="h-12 flex-none border-0 border-b border-line bg-transparent px-4 font-mono text-sm text-ink outline-none focus-visible:outline-none placeholder:text-muted"
      />
      <div ref={listRef} id="palette-results" role="listbox" aria-label="Results" className="overflow-y-auto py-1">
        {results.length === 0 && <div className="px-4 py-3 font-mono text-xs text-muted">Nothing matches “{query}”.</div>}
        {/* One role=group per section (results arrive grouped), options as its children. */}
        {groups.map(({ group, items }) => (
          <div key={group} role="group" aria-label={group}>
            <div className={cn(groupLabel, 'pt-2.5')} aria-hidden="true">{group}</div>
            {items.map(({ c, i }) => (
              <div
                key={c.id}
                id={`palette-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseMove={(e) => {
                  // Only a real pointer move picks a row: scrolling the list under a
                  // resting pointer (↑/↓) must not steal the keyboard's highlight.
                  // The first move only records where the pointer rests.
                  const last = pointer.current;
                  pointer.current = { x: e.clientX, y: e.clientY };
                  if (!last || (last.x === e.clientX && last.y === e.clientY)) return;
                  setActiveId(c.id);
                }}
                onClick={() => run(c)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-4 py-1.5 font-mono text-xs',
                  i === active ? rowActive : 'text-dim',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                {c.hint && <span className="flex-none text-muted">{c.hint}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-none gap-4 border-t border-line px-4 py-2 font-mono text-[10px] text-muted">
        <span>↑↓ move</span><span>↵ open</span><span>esc close</span>
      </div>
    </>
  );
}
