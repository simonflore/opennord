/**
 * The Stage 4's effect codes in words, for display. The decoded values keep the
 * codes (`values.generated.ts`, from ns4decode's tables: "A-PAN", "CHOR
 * variation", "1/8D"); a player reads the effect's name instead. Each type has
 * a second setting on the panel, which the tables call its "variation".
 */
const NAMES: Record<string, string> = {
  // Effect 1 (FX mod 1 mode)
  'A-PAN': 'Auto-pan', TREM: 'Tremolo', RM: 'Ring mod', 'A-WAH': 'Auto-wah', WAH: 'Wah', PUMP: 'Pump',
  // Effect 2 (FX mod 2 mode)
  PHAS: 'Phaser', FLANG: 'Flanger', CHOR: 'Chorus', VIBE: 'Vibe', ENS: 'Ensemble', SPIN: 'Spin',
  // Amp sim / EQ mode
  TWIN: 'Twin', JC: 'JC', SMALL: 'Small', 'TO ROTARY': 'To rotary', 'LP FILTER': 'Low-pass', 'HP FILTER': 'High-pass',
  // Reverb type
  SPRING: 'Spring', BOOTH: 'Booth', ROOM: 'Room', STAGE: 'Stage', HALL: 'Hall', CATH: 'Cathedral',
};

/** An effect type code in words ("CHOR variation" → "Chorus, variation"); an unknown value passes through. */
export function fxTypeName(code: string | undefined): string | undefined {
  if (!code) return code;
  const variation = code.endsWith(' variation');
  const base = variation ? code.slice(0, -' variation'.length) : code;
  const name = NAMES[base];
  if (!name) return code;
  return variation ? `${name}, variation` : name;
}

const NOTE_KIND: Record<string, string> = {
  D: 'dotted', T: 'triplet',
  // A swing division: docs/EFFECTS-ENGINE.md (delay, MST CLK on) reads the 0.29
  // family in the division table as probably swing.
  S: 'swing',
};

/** A tempo-synced note value in words ("1/8D" → "1/8 dotted", "1/4T" → "1/4 triplet"); other values pass through. */
export function noteValueName(v: string | undefined): string | undefined {
  const m = v?.match(/^(\d+\/\d+)([DTS])$/);
  if (!m) return v;
  return `${m[1]} ${NOTE_KIND[m[2]]}`;
}
