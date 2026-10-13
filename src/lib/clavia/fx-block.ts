/**
 * One decoded block of an effect section, as the Stage 2 and Stage 3 decoders
 * report it: every block of the panel, on or off, with its settings in panel
 * order. A setting holds its display text, the stored knob position when it has
 * one, and where the morph sources take it. Pure types and helpers: no model
 * imports.
 */
import { parseHz, type EqShape } from './curves';
import type { KeyItem, MorphMarkView } from './engine-view';
import { fxFill } from './fw-present';
import { EFFECT_SRC } from './fx-tables';
import type { FxParamView, FxUnitView } from './fx-view';

/** One setting of an effect block. */
export interface FxSetting {
  /** The setting's name within its block: 'rate', 'amount', 'mix', 'drive' … */
  id: string;
  /** What the instrument's display shows for it. */
  text: string;
  /** The stored 0–127 knob position, for a setting that is a knob with one. */
  midi?: number;
  /** The display value each morph source takes it to, when it is morphed. */
  morph?: MorphMarkView;
}

/** One block of an effect section. */
export interface FxBlock {
  name: string;
  /** Whether the block is switched on; every block is listed, on or off. */
  on: boolean;
  type?: string;
  /** The engine the block acts on (Organ / Piano / Synth), when it has a source selector. */
  source?: string;
  /** The block's settings, in panel order. */
  settings: FxSetting[];
  /** The block's own switches (master clock, ping pong, bright …). */
  switches?: Record<string, boolean>;
}

/** A setting with only the parts it has: no `midi` or `morph` key when there is none. */
export function setting(id: string, text: string, midi?: number, morph?: MorphMarkView): FxSetting {
  return { id, text, ...(midi !== undefined ? { midi } : {}), ...(morph ? { morph } : {}) };
}

/** A block's setting by id. */
export function settingOf(block: FxBlock, id: string): FxSetting | undefined {
  return block.settings.find((s) => s.id === id);
}

/** A setting's name as the instrument's panel prints it. */
const SETTING_LABEL: Record<string, string> = {
  rate: 'Rate', amount: 'Amount', mix: 'Mix', feedback: 'Feedback', tempo: 'Tempo', filter: 'Filter',
  drive: 'Drive', treble: 'Treble', mid: 'Mid', bass: 'Bass', midFreq: 'Mid Freq',
  frequency: 'Frequency', resonance: 'Resonance', dryWet: 'Dry/Wet', speed: 'Speed',
};

/** A switch's name as the instrument's panel prints it. */
const SWITCH_LABEL: Record<string, string> = {
  masterClock: 'Mst Clk', pingPong: 'Ping Pong', analog: 'Analog', bright: 'Bright', fast: 'Fast', stopMode: 'Stop Mode',
};

function paramOf(s: FxSetting): FxParamView {
  return {
    label: SETTING_LABEL[s.id] ?? s.id,
    value: s.text,
    fill: fxFill(s.midi, 0, 127),
    morph: s.morph,
  };
}

/** The EQ curve of a block that has all three bands and a readable mid frequency. */
function eqOf(block: FxBlock): EqShape | undefined {
  const db = (id: string) => {
    const s = settingOf(block, id);
    return s ? parseFloat(s.text) : undefined;
  };
  const [bassDb, midDb, trebDb] = [db('bass'), db('mid'), db('treble')];
  const midHz = parseHz(settingOf(block, 'midFreq')?.text);
  if (bassDb === undefined || midDb === undefined || trebDb === undefined || midHz === undefined) return undefined;
  if ([bassDb, midDb, trebDb].some(Number.isNaN)) return undefined;
  return { bassDb, midDb, trebDb, midHz };
}

/**
 * A decoded block as the effects panel draws it: its settings as knobs (where a
 * position is stored) or readouts, its switches and source selector as LEDs,
 * and the EQ curve when it has the three bands.
 */
export function fxUnitOf(block: FxBlock, key: string): FxUnitView {
  const switches: KeyItem[] | undefined = block.switches
    && Object.entries(block.switches).map(([id, on]) => ({ label: SWITCH_LABEL[id] ?? id, on }));
  return {
    key, label: block.name, on: block.on, type: block.type,
    params: block.settings.map(paramOf),
    switches,
    eq: eqOf(block),
    source: block.source === undefined ? undefined : EFFECT_SRC.map((label) => ({ label, on: label === block.source })),
  };
}
