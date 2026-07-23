/**
 * The shared vocabulary for "which engines are active".
 *
 * Nord generations nest this differently and this union refuses to flatten them:
 * on Stage 2/3 a Slot/Panel holds its own organ+piano+synth, so the container
 * leads; on Stage 4 the engine leads and layers stack within it (up to 2 organ,
 * 2 piano, 3 synth — ns4/types.ts:93), with Scene I/II only muting. "Organ A"
 * therefore means a different axis on each, which is why neither shape is
 * expressible as the other.
 *
 * Lives in clavia/ because both the model folders and the library consume it —
 * the dependency direction stays model → clavia.
 */
export type EngineKind = 'organ' | 'piano' | 'synth';

export type EngineSummary =
  /** Stage 2/3 — the container leads. `id` is the bare letter ('A'); `term` is the instrument's word. */
  | { axis: 'container'; term: 'Slot' | 'Panel'; groups: { id: string; engines: EngineKind[] }[] }
  /** Stage 4 — the engine leads; `layers` are the active layer ids ('A'|'B'|'C'). */
  | { axis: 'engine'; engines: { kind: EngineKind; layers: string[] }[] };

/** Flattened text for Library search only — no UI consumes a string. */
export function engineSearchText(s: EngineSummary): string {
  return s.axis === 'container'
    ? s.groups.map((g) => `${s.term} ${g.id}: ${g.engines.join(' + ')}`).join(' · ')
    : s.engines.map((e) => `${e.kind} ${e.layers.join(' ')}`).join(' + ');
}
