/**
 * Nord Stage Classic / Stage EX → DecodedProgram. While the record's start in
 * a `.nspg` file is unconfirmed (types.ts) a file presents its header only,
 * with that reason. Given a located record (`recordStart`), each panel shows
 * its organ — model, preset, B3 drawbars with footage, Vox drawbar levels or
 * the Farfisa tabs that are on — and the organ, piano, synth and extern levels.
 * The organ-model order (B3, Vox, Farfisa) is inferred from the Stage 2 (medium).
 */
import { decodeNs1, NS1_RECORD_START } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { fwHeader, label, legacyHeaderOnly, levelPart, parts } from '../clavia/fw-present';
import type { Ns1FieldKey } from './layout.generated';

const TITLE = 'Nord Stage Classic / EX · Program';

const UNLOCATED_NOTE =
  'Stage Classic / EX: the program layout is known from the instrument firmware (OS 5.08 / 6.08), but not yet where it starts inside a .nspg file, so only the file header is shown until a real file confirms it.';

/** Organ Model (common, 0–2): order inferred from the Stage 2 (medium). */
export const NS1_ORGAN_MODELS = ['B3', 'Vox', 'Farfisa'] as const;

/** Per preset: the nine B3 drawbars (16′ … 1′), the nine Vox drawbars, the nine Farfisa tabs. */
const B3 = [['b3Sub', 'b3Sub3', 'b3Fund', 'b32nd', 'b33rd', 'b34th', 'b35th', 'b36th', 'b38th'],
  ['b3Sub46', 'b3Sub347', 'b3Fund48', 'b32nd49', 'b33rd50', 'b34th51', 'b35th52', 'b36th53', 'b38th54']] as const;
const VOX = [['vTypeSub', 'vTypeSub3', 'vTypeFund', 'vType2nd', 'vType5th', 'vType348th', 'param25', 'vTypeMix1', 'vTypeMix2'],
  ['vTypeSub28', 'vTypeSub329', 'vTypeFund30', 'vType2nd31', 'vType5th32', 'vType348th33', 'param34', 'vTypeMix135', 'vTypeMix236']] as const;
const FARF = [['fTypeBas16', 'fTypeStr16', 'fTypeFlute8', 'fTypeOboe8', 'fTypeTrmp8', 'fTypeStr8', 'fTypeFlute4', 'fTypeStr4', 'fType223'],
  ['fTypeBas1610', 'fTypeStr1611', 'fTypeFlute812', 'fTypeOboe813', 'fTypeTrmp814', 'fTypeStr815', 'fTypeFlute416', 'fTypeStr417', 'fType22318']] as const;
const FARF_TABS = ['Bass 16′', 'Strings 16′', 'Flute 8′', 'Oboe 8′', 'Trumpet 8′', 'Strings 8′', 'Flute 4′', 'Strings 4′', '2⅔′'];

type Get = (key: Ns1FieldKey) => number;

function panel(g: Get, model: number, p: 'A' | 'B'): DecodedSection[] {
  const k = (name: string) => g(`panel${p}.${name}` as Ns1FieldKey);
  const preset = k('organPreset') === 1 ? 1 : 0;
  const organName = label(NS1_ORGAN_MODELS, model) ?? 'Organ';
  const organ: DecodedSection = {
    id: `O${p}`, label: `PANEL ${p} · ORGAN`,
    engines: [{ label: 'Organ', parts: parts(organName, preset ? 'Preset 2' : 'Preset 1', levelPart(k('organLevel'))) }],
  };
  if (model === 0) {
    organ.drawbars = drawbarViews(B3[preset].map(k), B3_FOOTAGE);
    organ.chips = parts(k(preset ? 'b3VibratoMode56' : 'b3VibratoMode') ? 'Vibrato/Chorus' : undefined,
      k(preset ? 'b3PercussionMode58' : 'b3PercussionMode') ? 'Percussion' : undefined);
  } else if (model === 1) {
    organ.drawbars = drawbarViews(VOX[preset].map(k));
  } else if (model === 2) {
    const on = FARF[preset].flatMap((name, i) => (k(name) ? [FARF_TABS[i]] : []));
    organ.engines.push({ label: 'Tabs', parts: on.length ? on : ['none'] });
  }
  const level = (id: string, title: string, key: string): DecodedSection => ({
    id: `${id}${p}`, label: `PANEL ${p} · ${title}`, engines: [{ label: title[0] + title.slice(1).toLowerCase(), parts: parts(levelPart(k(key))) }],
  });
  return [organ, level('P', 'PIANO', 'pianoLevel'), level('S', 'SYNTH', 'synthLevel'), level('X', 'EXTERN', 'externLevel')];
}

export function ns1Decoded(bytes: Uint8Array, recordStart: number | null = NS1_RECORD_START): DecodedProgram {
  const p = decodeNs1(bytes, recordStart);
  if (!p.layoutMatched && recordStart !== null) return legacyHeaderOnly(TITLE, p, 'Stage Classic / EX');
  // Not a read failure: the layout is known, its place in the file is not.
  if (!p.layoutMatched) return { title: TITLE, header: fwHeader(p), sections: [], note: UNLOCATED_NOTE, warnings: p.warnings };
  const g: Get = (key) => p.values[key] ?? 0;
  const model = g('common.organModel');
  return {
    title: TITLE,
    header: [...fwHeader(p), ['Record version', String(p.recordVersion)]],
    sections: [...panel(g, model, 'A'), ...panel(g, model, 'B')],
    note: 'Stage Classic / EX: layout from the instrument firmware (OS 5.08 / 6.08), read at a record start given by hand — not yet confirmed on a real file. The organ-model order is inferred.',
    warnings: p.warnings,
  };
}
