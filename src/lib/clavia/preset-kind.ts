/** Organ/Piano/Synth preset partition kinds (the Stage-line preset banks). */
export type PresetKind = 'organ-preset' | 'piano-preset' | 'synth-preset';

/** Map a CBIN tag to its preset kind, or undefined if the tag isn't a preset.
 *  organ = ns4o; piano = ns4n; synth = ns4y/ns3y/ns2y. nl4s (Lead programs) is
 *  intentionally NOT a preset. Recognition only — no decode. */
export function presetKindForTag(tag: string): PresetKind | undefined {
  switch (tag.toLowerCase()) {
    case 'ns4o': return 'organ-preset';
    case 'ns4n': return 'piano-preset';
    case 'ns4y':
    case 'ns3y':
    case 'ns2y': return 'synth-preset';
    default: return undefined;
  }
}
