/**
 * Synth filter cutoff: 7-bit knob value (0-127) -> displayed frequency
 * (14 Hz .. 21 kHz). Vendored from ns3-program-viewer's
 * ns3SynthFilterCutoffFrequencyMap (Chris55; ATTRIBUTION.md) — a factual table.
 */
export const NS3_FILTER_FREQ: readonly string[] = [
  "14 Hz","15 Hz","15 Hz","16 Hz","17 Hz","18 Hz","19 Hz","21 Hz",
  "22 Hz","23 Hz","24 Hz","26 Hz","28 Hz","29 Hz","31 Hz","33 Hz",
  "35 Hz","37 Hz","39 Hz","41 Hz","44 Hz","46 Hz","49 Hz","52 Hz",
  "55 Hz","58 Hz","62 Hz","65 Hz","69 Hz","73 Hz","78 Hz","82 Hz",
  "87 Hz","92 Hz","98 Hz","104 Hz","110 Hz","117 Hz","123 Hz","131 Hz",
  "139 Hz","147 Hz","156 Hz","165 Hz","175 Hz","185 Hz","196 Hz","208 Hz",
  "220 Hz","233 Hz","247 Hz","262 Hz","277 Hz","294 Hz","311 Hz","330 Hz",
  "349 Hz","370 Hz","392 Hz","415 Hz","440 Hz","466 Hz","494 Hz","523 Hz",
  "554 Hz","587 Hz","622 Hz","659 Hz","698 Hz","740 Hz","784 Hz","831 Hz",
  "880 Hz","932 Hz","988 Hz","1.0 kHz","1.1 kHz","1.2 kHz","1.2 kHz","1.3 kHz",
  "1.4 kHz","1.5 kHz","1.6 kHz","1.7 kHz","1.8 kHz","1.9 kHz","2.0 kHz","2.1 kHz",
  "2.2 kHz","2.3 kHz","2.5 kHz","2.6 kHz","2.8 kHz","3.0 kHz","3.1 kHz","3.3 kHz",
  "3.5 kHz","3.7 kHz","4.0 kHz","4.2 kHz","4.4 kHz","4.7 kHz","5.0 kHz","5.3 kHz",
  "5.6 kHz","5.9 kHz","6.3 kHz","6.6 kHz","7.0 kHz","7.5 kHz","7.9 kHz","8.4 kHz",
  "8.9 kHz","9.4 kHz","10 kHz","11 kHz","11 kHz","12 kHz","13 kHz","13 kHz",
  "14 kHz","15 kHz","16 kHz","17 kHz","18 kHz","19 kHz","20 kHz","21 kHz",
];
