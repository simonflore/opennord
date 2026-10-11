import '../../styles/nord.css';
import { cn } from '@/lib/cn';
import { LIBRARY_ENGINES, type EngineKind } from '../../lib/clavia/engines';

/**
 * The LED filter keys above the program table, as on the instrument: lit engine
 * keys narrow the list to programs that play every lit engine, and Split to
 * programs that split the keyboard (a Stage 4 program read in full: a Nord slot
 * not pulled yet, or another model's program, has no zones to check). Press a
 * lit key to let it go.
 */
export function TraitKeys({ engines, onToggleEngine, splitOnly, onSplitOnly }: {
  engines: ReadonlySet<EngineKind>;
  onToggleEngine: (k: EngineKind) => void;
  splitOnly: boolean;
  onSplitOnly: (on: boolean) => void;
}) {
  return (
    <div className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter programs">
      {LIBRARY_ENGINES.map((e) => (
        <button
          key={e.kind}
          type="button"
          className={cn('ps-key', engines.has(e.kind) && 'on')}
          aria-pressed={engines.has(e.kind)}
          title={`Programs that play ${e.name.toLowerCase()}`}
          onClick={() => onToggleEngine(e.kind)}
        >{e.name}</button>
      ))}
      <button
        type="button"
        className={cn('ps-key', splitOnly && 'on')}
        aria-pressed={splitOnly}
        title="Programs that split the keyboard (Stage 4 programs read in full)"
        onClick={() => onSplitOnly(!splitOnly)}
      >Split</button>
    </div>
  );
}
