/**
 * Program Studio view-model — pure derivations from NS4Program to display data.
 *
 * No React, no I/O. Components render these plain objects; the Community Library
 * will reuse the same derivations to render any shared patch. Everything here is
 * unit-testable against the regression fixture.
 */
import type { NS4Program, NS4Layer } from './types';

export interface HeaderView {
  name: string;
  slot: string;
  category: string;
  version: string;
  sizeBytes: number;
  /** e.g. "organ + piano + synth · 6 layers". */
  summary: string;
}

const KIND_ORDER: NonNullable<NS4Layer['kind']>[] = ['organ', 'piano', 'synth'];

/** Layers present in the program AND switched on. */
export function activeLayers(p: NS4Program): NS4Layer[] {
  return (p.layers ?? []).filter((l) => l.enabled);
}

/** Organ drawbar positions as integers 0–8, for the LED ladder. Non-numeric (e.g. VOX combos) or missing → 0. */
export function drawbarLevels(layer: NS4Layer): number[] {
  return (layer.drawbars ?? []).map((d) => {
    if (!d) return 0;
    const n = parseInt(d.value, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, Math.min(8, n));
  });
}

/** Map a "-4.7 dB" style volume to a 0–100 meter fill, clamped to a -40..+6 dB window. */
export function volumeFill(volume?: string): number {
  if (!volume) return 0;
  const db = parseFloat(volume);
  if (Number.isNaN(db)) return 0;
  const lo = -40, hi = 6;
  const pct = ((db - lo) / (hi - lo)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function headerView(p: NS4Program): HeaderView {
  const active = activeLayers(p);
  const kinds = KIND_ORDER.filter((k) => active.some((l) => l.kind === k));
  const summary = `${kinds.join(' + ')} · ${active.length} layer${active.length === 1 ? '' : 's'}`;
  return {
    name: p.name ?? 'Unnamed',
    slot: p.slot ?? '—',
    category: p.category ?? (p.categoryId != null ? `#${p.categoryId}` : '—'),
    version: p.programVersion ? `v${p.programVersion}` : '—',
    sizeBytes: p.bytes.length,
    summary,
  };
}

export interface OrganCardModel { id: string; model: string; drawbars: number[]; vibChorus: boolean; perc: boolean; }
export interface PianoCardModel { id: string; type: string; model: string; timbre: string; touch: string; }
export interface SynthCardModel { id: string; source: string; osc: string; oscDetail: string; filterType: string; cutoff: string; res: string; }

export function organCard(l: NS4Layer): OrganCardModel {
  return {
    id: l.id,
    model: l.organModel ?? '—',
    drawbars: drawbarLevels(l),
    vibChorus: !!l.vibChorus,
    perc: !!l.percussion?.on,
  };
}

export function pianoCard(l: NS4Layer): PianoCardModel {
  return {
    id: l.id,
    type: l.pianoType ?? '—',
    model: l.pianoModelName ?? '—',
    timbre: l.timbre ?? '—',
    touch: l.touch ?? '—',
  };
}

export function synthCard(l: NS4Layer): SynthCardModel {
  const osc = l.source === 'analog' ? (l.oscType ?? 'analog') : (l.sample?.name ?? 'sample');
  const oscDetail = l.oscWave ? `wave ${l.oscWave}` : (l.oscCategory ? `cat ${l.oscCategory}` : '');
  return {
    id: l.id,
    source: l.source ?? 'samples',
    osc,
    oscDetail,
    filterType: l.filter?.type ?? '—',
    cutoff: l.filter?.freq?.value ?? '—',
    res: l.filter?.resonance?.value ?? '—',
  };
}
