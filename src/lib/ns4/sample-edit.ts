/**
 * Sample editing model — derive an editable view from a decoded .nsmp and rebuild
 * a new .nsmp via the (hardware-proven) container writer. Pure: no DOM, no audio.
 *
 * v1 edits: name + per-zone root key / top key (split) / top velocity (layer).
 * Audio is preserved; per-note levels/detune reset to unity on rebuild; loop points
 * are not carried (writer limits). Zones pair with strokes BY POSITION (zone i ↔
 * decoded stroke i) — true for one-stroke-per-zone files and what writeNsmpMulti
 * produces.
 */
import type { NsmpFile, NsmpZone, DecodedStrokeResult } from './nsmp';
import { writeNsmpMulti, type WriteZone } from './nsmp-write';

export interface EditZone {
  rootKey: number;
  keyHigh: number;
  velTop: number;
}

export interface EditModel {
  name: string;
  zones: EditZone[];
}

/** Build the editable model from a loaded file + its zone map. */
export function editModel(file: NsmpFile, zones: NsmpZone[]): EditModel {
  return {
    name: file.name ?? 'Sample',
    zones: zones.map((z) => ({ rootKey: z.rootKey, keyHigh: z.keyHigh, velTop: z.velTop })),
  };
}

/**
 * Rebuild a `.nsmp` from the edited model + the original decoded audio. Zone i
 * uses decoded stroke i (positional). Throws if a zone has no matching stroke.
 */
export function buildEditedNsmp(model: EditModel, decoded: DecodedStrokeResult[], codec: 3 | 4): Uint8Array {
  const zones: WriteZone[] = model.zones.map((z, i) => {
    const stroke = decoded[i];
    if (!stroke) throw new Error(`no decoded audio for zone ${i}`);
    return { channels: stroke.channels, keyHigh: z.keyHigh, rootKey: z.rootKey, velTop: z.velTop };
  });
  return writeNsmpMulti({ name: model.name, zones, codec });
}
