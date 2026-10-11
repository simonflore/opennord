/**
 * Stage 3 presenter: maps the {@link decodeNs3} output (+ header) into the shared
 * {@link DecodedProgram} shape that DecodedProgramView renders. The model→view
 * mapping only; the values come from the program map (decode.ts).
 */
import { identifyNordFile } from '../clavia/nord-file';
import type { DecodedProgram, DecodedSection, DecodedEngine } from '../clavia/decoded';
import { B3_FOOTAGE, drawbarViews } from '../clavia/drawbars';
import { transposeText } from '../clavia/fw-present';
import { decodeNs3, type Ns3Panel } from './decode';

function organDrawbars(panel: Ns3Panel) {
  return drawbarViews(panel.organ.drawbars, panel.organ.type === 'B3' ? B3_FOOTAGE : undefined);
}

/** B3 character chips (vib/chorus + percussion) followed by the active FX. */
function sectionChips(panel: Ns3Panel): string[] {
  const chips: string[] = [];
  const { vibChorus, percussion } = panel.organ;
  if (panel.organ.on && vibChorus.on) chips.push(`Vib/Chorus: ${vibChorus.mode}`);
  if (panel.organ.on && percussion.on) {
    const f = [percussion.third && '3rd', percussion.fast && 'Fast', percussion.soft && 'Soft'].filter(Boolean);
    chips.push(`Percussion${f.length ? ` · ${f.join(' / ')}` : ''}`);
  }
  for (const fx of panel.fx) chips.push(fx.type ? `${fx.name}: ${fx.type}` : fx.name);
  return chips;
}

function toSection(panel: Ns3Panel): DecodedSection {
  const engines: DecodedEngine[] = [];
  if (panel.organ.on) engines.push({ label: 'Organ', parts: [panel.organ.type, panel.organ.volume] });
  if (panel.piano.on) engines.push({ label: 'Piano', parts: [panel.piano.type, panel.piano.volume], nameSlot: 0 });
  if (panel.synth.on) {
    const isSample = panel.synth.osc === 'Sample';
    engines.push({
      label: 'Synth',
      parts: [panel.synth.osc, `${panel.synth.filter.type} ${panel.synth.filter.cutoff}`, panel.synth.volume],
      nameSlot: isSample ? 0 : undefined,
    });
  }
  const chips = sectionChips(panel);
  return {
    id: panel.id,
    label: `PANEL ${panel.id}`,
    engines,
    drawbars: panel.organ.on ? organDrawbars(panel) : undefined,
    chips: chips.length ? chips : undefined,
  };
}

export function ns3Decoded(bytes: Uint8Array): DecodedProgram {
  const info = identifyNordFile(bytes);
  const p = decodeNs3(bytes);
  const { panels } = p;

  const header: [string, string][] = [];
  if (info.slot) header.push(['Slot', info.slot]);
  if (info.categoryName) header.push(['Category', info.categoryName]);
  if (info.version) header.push(['Version', `v${info.version}`]);
  const transpose = transposeText(p.values['common.transposeEnable'], p.values['common.transposeValue']);
  if (transpose) header.push(['Transpose', transpose]);

  // Lazy: pull the ~1.3MB sample catalog only when a Stage 3 program is opened.
  const enrich = async (): Promise<Record<string, string>> => {
    const { resolveSample } = await import('./library/service');
    const out: Record<string, string> = {};
    for (const p of panels) {
      if (p.piano.on) {
        const r = resolveSample(p.piano.sampleId, p.piano.sampleVariation);
        if (r) out[`${p.id}-Piano`] = r.version ? `${r.name} ${r.version}` : r.name;
      }
      if (p.synth.on && p.synth.osc === 'Sample') {
        const r = resolveSample(p.synth.sampleId, 0);
        if (r) out[`${p.id}-Synth`] = r.name;
      }
    }
    return out;
  };

  return {
    title: 'Stage 3 · Program',
    header,
    sections: panels.map(toSection),
    note: p.layoutMatched
      ? 'Stage 3: engines, levels, organ drawbars, effects and B3 character, read with OpenNord’s Stage 3 program map. Factory sound names from the community ns3-program-viewer catalog.'
      : "Stage 3: this file's structure didn't match OpenNord’s Stage 3 program map, so only the file header is shown.",
    warnings: p.warnings,
    enrich,
  };
}
