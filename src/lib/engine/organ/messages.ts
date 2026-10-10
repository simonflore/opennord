/** Main thread → audio thread messages for the organ AudioWorklet. */
import type { OrganParams } from './types';

export type OrganMessage =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'params'; params: OrganParams }
  | { type: 'allNotesOff' }
  /** Fade out over {@link DISPOSE_FADE_MS}, then let the processor be released. */
  | { type: 'dispose' };

/** Registered AudioWorkletProcessor name. */
export const ORGAN_PROCESSOR = 'opennord-organ';

/** Output fade before a disposed organ voice stops processing (ms). */
export const DISPOSE_FADE_MS = 10;
/**
 * How long dispose() waits before disconnecting the node: the fade plus
 * room for a 1024-frame ScriptProcessor buffer or two and timer slack.
 */
export const DISPOSE_DISCONNECT_MS = 100;

/** Anything with the organ core's control surface. */
export interface OrganControl {
  noteOn(note: number, velocity: number): void;
  noteOff(note: number): void;
  setParams(p: OrganParams): void;
  allNotesOff(): void;
}

/** Apply one message to a control surface (the core, on the audio thread). */
export function applyOrganMessage(target: OrganControl, msg: OrganMessage): void {
  switch (msg.type) {
    case 'noteOn': target.noteOn(msg.note, msg.velocity); break;
    case 'noteOff': target.noteOff(msg.note); break;
    case 'params': target.setParams(msg.params); break;
    case 'allNotesOff': target.allNotesOff(); break;
    case 'dispose': break; // handled by the host (worklet / fallback), not the control surface
  }
}
