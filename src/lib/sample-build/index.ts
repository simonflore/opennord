export * from './model';
export * from './targets';
export * from './render';
export * from './build';
export { rootFromFileName } from './analysis/note-name';
export { estimatePitch, PITCH_CONFIDENCE_FLOOR } from './analysis/pitch';
export { splitOnSilence, type SplitOptions, type Region } from './analysis/split';
export { autoMap, keyGaps, placeTakes, type Candidate, type PlaceReport } from './analysis/automap';
