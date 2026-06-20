/**
 * The shared, model-agnostic **decoded-program presentation model**. Every simple
 * Nord model (Stage 2/3 today; Electro/Wave/Lead next) decodes into this one shape,
 * and a single `DecodedProgramView` renders it — so adding a model is a per-model
 * presenter (offsets → this shape), not a new decoder + view fork.
 *
 * The rich Stage 4 keeps its bespoke view (morphs, 3 layers, full param drawer);
 * this is for the leaner models that share engine/level/drawbar/FX structure.
 *
 * Dependency direction stays model → clavia: this file is pure types, no model deps.
 */
import type { DrawbarView } from '../ns4/view';

export interface DecodedEngine {
  /** Row label, e.g. 'Organ' | 'Piano' | 'Synth' (unique within a section). */
  label: string;
  /** Detail fragments, joined by ' · ' in the view (e.g. ['Grand', '-2.0 dB']). */
  parts: string[];
  /** If set, the index in `parts` a lazily-resolved factory name replaces (see `enrich`). */
  nameSlot?: number;
}

export interface DecodedSection {
  /** Stable id within the program, e.g. 'A' | 'B'. */
  id: string;
  /** Card heading, e.g. 'PANEL A' | 'SLOT A'. */
  label: string;
  engines: DecodedEngine[];
  /** Organ drawbar stack, when this section has an active drawbar organ. */
  drawbars?: DrawbarView[];
  /** Extra pills shown under the engines (FX, B3 character, …). */
  chips?: string[];
}

export interface DecodedProgram {
  /** Card title, e.g. 'Stage 3 · Program'. */
  title: string;
  /** Header key/value rows (Slot, Category, Version…). */
  header: [string, string][];
  sections: DecodedSection[];
  /** Footer status note describing what's decoded. */
  note: string;
  /**
   * Optional lazy enrichment: resolves factory model/sample names off-thread
   * (typically a dynamic import of a large catalog). Resolves to a map of
   * `${section.id}-${engine.label}` → resolved name, which the view substitutes
   * into that engine's `nameSlot` part once it arrives.
   */
  enrich?: () => Promise<Record<string, string>>;
}
