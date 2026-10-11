import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import * as RD from '@radix-ui/react-dialog';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { LIBRARY_CATEGORIES } from '../../lib/library/categories';
import type { LibrarySource } from '../../lib/library/types';
import { useLibraryState } from '../../lib/library/LibraryContext';
import { usePresetsState } from '../../lib/library/PresetsContext';
import { useSamplesState } from '../../lib/library/SamplesContext';
import { usePianosState } from '../../lib/library/PianosContext';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { rankCommands, type Command } from './commands';
import { CLOUD_TO, COMMUNITY_TO, DEV_DESTS, RE_DESTS, TOOLS, type NavTo } from './nav';

const SOURCE_LABEL: Record<LibrarySource, string> = { nord: 'on the Nord', local: 'local', backup: 'backup', cloud: 'cloud' };

/** Everything the palette can jump to: the pages, then every program, preset, sample and piano. */
function useCommands(): Command[] {
  const navigate = useNavigate();
  const caps = useCapabilities();
  const library = useLibraryState();
  const presets = usePresetsState();
  const samples = useSamplesState();
  const pianos = usePianosState();

  return useMemo(() => {
    const go = (to: NavTo) => () => navigate({ to });
    const page = (to: NavTo, label: string): Command => ({ id: `page:${to}`, group: 'Pages', label, run: go(to) });
    const pages: Command[] = [
      ...LIBRARY_CATEGORIES.filter((c) => c.ready).map((c) => page(c.path as NavTo, c.label)),
      ...TOOLS.map((d) => page(d.to, d.label)),
      ...(caps.cloud.available ? [page(CLOUD_TO, 'Cloud')] : []),
      ...(caps.community.available ? [page(COMMUNITY_TO, 'Community')] : []),
      ...(__RE__ ? [...RE_DESTS, ...DEV_DESTS].map((d) => page(d.to, d.label)) : []),
      page('/about', 'About & legal'),
    ];
    // Presets, samples and pianos have no page of their own: jumping to one opens
    // its list searched down to that name.
    const find = (to: NavTo, setQuery: (q: string) => void, setSource: (s: 'all') => void, name: string) => () => {
      setSource('all');
      setQuery(name);
      navigate({ to });
    };
    return [
      ...pages,
      ...library.all.map((e): Command => ({
        id: `program:${e.id}`, group: 'Programs', label: e.name, hint: e.slot ?? SOURCE_LABEL[e.source],
        run: () => {
          library.setSource('all');
          if (e.program) navigate({ to: '/library/programs/$programId', params: { programId: e.id } });
          else navigate({ to: '/device' });
        },
      })),
      ...presets.all.map((e): Command => ({
        id: `preset:${e.id}`, group: 'Presets', label: e.name, hint: e.slot ?? SOURCE_LABEL[e.source],
        run: find('/library/presets', presets.setQuery, presets.setSource, e.name),
      })),
      ...samples.all.map((e): Command => ({
        id: `sample:${e.id}`, group: 'Samples', label: e.name, hint: e.slot ?? SOURCE_LABEL[e.source],
        run: find('/library/samples', samples.setQuery, samples.setSource, e.name),
      })),
      ...pianos.all.map((e): Command => ({
        id: `piano:${e.id}`, group: 'Pianos', label: e.name, hint: e.slot ?? SOURCE_LABEL[e.source],
        run: find('/library/pianos', pianos.setQuery, pianos.setSource, e.name),
      })),
    ];
  }, [navigate, caps, library, presets, samples, pianos]);
}

/**
 * ⌘K: jump to any page, program, preset, sample or piano by typing part of its
 * name. ↑/↓ move, Enter opens, Escape closes. With nothing typed it lists the
 * pages, so on a phone it doubles as the "more" menu.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <RD.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-40 bg-[var(--scrim)]" />
        <RD.Content
          aria-describedby={undefined}
          className={cn(
            'fixed left-1/2 top-[12vh] z-50 flex max-h-[70vh] w-[min(92vw,560px)] -translate-x-1/2 flex-col',
            'overflow-hidden rounded-md border border-line bg-surface shadow-[var(--shadow-3)] focus:outline-none',
          )}
        >
          <RD.Title className="sr-only">Go to</RD.Title>
          {/* Radix mounts the content only while open, so the command list is
              built when the palette opens and each opening starts fresh. */}
          <PaletteBody onClose={onClose} />
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const commands = useCommands();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => rankCommands(commands, query), [commands, query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[index]); }
  };

  return (
    <>
      <input
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-results"
        aria-activedescendant={results[index] ? `palette-${index}` : undefined}
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
              <div className="px-4 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{c.group}</div>
            )}
            <div
              id={`palette-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === index}
              onMouseMove={() => setIndex(i)}
              onClick={() => run(c)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-1.5 font-mono text-xs',
                i === index ? 'fill-raised text-ink shadow-[inset_3px_0_0_var(--accent)]' : 'text-dim',
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
