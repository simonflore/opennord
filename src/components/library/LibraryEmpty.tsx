import type { ReactNode } from 'react';
import { Button } from '../ui';

/**
 * Consistent empty state for every Library category (Programs, Presets, User
 * Samples, Piano Samples). Each screen used to hand-write its own copy, which
 * drifted ("No samples match." vs "No pianos match your filter.") and, worse,
 * Programs showed its first-run onboarding even when a search had simply hidden
 * everything. This splits the two cases: when a filter is active and hiding all
 * entries, every category says the same thing with a Clear affordance; when the
 * category is genuinely empty, it falls back to onboarding `children`.
 */
export function LibraryEmpty({ noun, filtered, onClear, children }: {
  /** Singular category noun, e.g. "program", "preset", "sample", "piano". */
  noun: string;
  /** True when a query/facet is active and hiding every entry. */
  filtered: boolean;
  /** Resets the active filters; rendered as "Clear filters" when provided. */
  onClear?: () => void;
  /** Onboarding content for the truly-empty (unfiltered) case. */
  children?: ReactNode;
}) {
  if (filtered) {
    return (
      <div className="lib-empty">
        <p>No {noun}s match your filter.</p>
        {onClear && <Button variant="ghost" onClick={onClear}>Clear filters</Button>}
      </div>
    );
  }
  return <div className="lib-empty">{children ?? <p>Nothing here yet.</p>}</div>;
}
