import type { NS4Program, NS4Layer, Morphable, Ns4SampleRef, Ns4FileKind } from './types';
import { hasCbinMagic, fileTypeTag } from './bits';
import { buildParamMap } from './maps';
import { decodeAllParams } from './coverage';

/** Read a fixed-length ASCII field, stopping at NUL and trimming trailing spaces. */
export function readAsciiFixed(bytes: Uint8Array, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const b = bytes[offset + i] ?? 0;
    if (b === 0) break;
    s += String.fromCharCode(b);
  }
  return s.trimEnd();
}

/**
 * Parse a Nord Stage 4 program/preset file into the OpenNord model.
 *
 * Uses the full offset map (all 406 params) + the interpret layer to populate
 * NS4Program section by section. Fields are filled as far as the current
 * interpretation tables reach; gaps remain undefined rather than guessed.
 * See docs/FORMAT.md and docs/ROADMAP.md.
 */
export function parseNs4Program(bytes: Uint8Array): NS4Program {
  const warnings: string[] = [];
  const recognized = hasCbinMagic(bytes);
  const tag = recognized ? fileTypeTag(bytes) : '';

  let kind: Ns4FileKind = 'preset-unknown';
  if (tag === 'ns4p') kind = 'program';
  else if (tag.startsWith('ns4')) kind = 'preset-unknown';

  if (!recognized) {
    warnings.push('No CBIN magic — not a recognized Nord file.');
    return { parsed: false, kind, bytes, warnings };
  }

  // Decode all params (two-pass: raw values then interpret + morph resolution).
  const decoded = decodeAllParams(bytes, buildParamMap());

  // Key = "group:name" to avoid collisions between piano ('p') and synth ('y') params
  // that share the same base name (e.g. both have "volume [A]", "layer on/off [A]").
  const byKey = new Map(decoded.map((d) => [`${d.group}:${d.name}`, d]));
  const disp = (group: string, name: string) => byKey.get(`${group}:${name}`)?.display ?? null;
  const rawNum = (group: string, name: string) => byKey.get(`${group}:${name}`)?.value;

  /** Morphable<string>: base value + any non-"none" morph assignments. */
  function morphStr(group: string, base: string, wheel: string, at: string, ped: string): Morphable<string> | undefined {
    const v = disp(group, base);
    if (v === null) return undefined;
    const m: Morphable<string> = { value: v };
    const w = disp(group, wheel), a = disp(group, at), p = disp(group, ped);
    if (w && w !== 'none') m.wheel = w;
    if (a && a !== 'none') m.aftertouch = a;
    if (p && p !== 'none') m.pedal = p;
    return m;
  }

  // ── Piano layers (group 'p', 2 layers: A / B) ────────────────────────────
  const pianoLayers: NS4Layer[] = [];
  for (const id of ['A', 'B'] as const) {
    const s = (n: string) => disp('p', `${n} [${id}]`);
    const r = (n: string) => rawNum('p', `${n} [${id}]`);

    const enabledStr = s('layer on/off');
    if (enabledStr === null) continue;

    // "NNNNNNNNNN (Model Name)" → extract name and raw id
    const modelStr = s('piano model ID/name');
    const modelName = modelStr?.match(/\((.+)\)$/)?.[1];

    // "+1" / "-2" / "0" → integer semitone offset
    const octStr = s('octave shift');
    const octaveShift = octStr !== null ? parseInt(octStr, 10) : undefined;

    // Piano model variation: "none" means no variation selected
    const varStr = s('piano model variation');

    pianoLayers.push({
      id,
      kind: 'piano',
      enabled: enabledStr === 'on',
      enabledSceneII: s('layer on/off (scene II)') === 'on',
      volume: morphStr('p',
        `volume [${id}]`,
        `volume change with wheel [${id}]`,
        `volume change with A.T. [${id}]`,
        `volume change with ctrlped [${id}]`,
      ),
      kbZones: s('KB zones') ?? undefined,
      octaveShift,
      pitchStick: { on: s('pstick on/off') === 'on' },
      sustainPedal: s('susped on/off') === 'on',
      pianoType: s('piano type') ?? undefined,
      pianoModelId: r('piano model ID/name'),
      pianoModelName: modelName,
      pianoModelSlot: r('piano model slot'),
      pianoModelVariation: varStr && varStr !== 'none' ? varStr : undefined,
      timbre: s('timbre') ?? undefined,
      touch: s('touch') ?? undefined,
      unisonLevel: r('unison level'),
      dynComp: r('dyn comp'),
      softRelease: s('soft rel on/off') === 'on',
      stringResonance: s('string res on/off') === 'on',
      pedalNoise: s('pedal noise on/off') === 'on',
      fxMod1: {
        on: s('FX mod 1 on/off') === 'on',
        masterClock: s('FX mod 1 MST CLK on/off') === 'on',
        mode: s('FX mod 1 mode') ?? undefined,
        rate: morphStr('p',
          `FX mod 1 rate [${id}]`,
          `FX mod 1 rate with wheel [${id}]`,
          `FX mod 1 rate with A.T. [${id}]`,
          `FX mod 1 rate with ctrlped [${id}]`,
        ),
        amount: morphStr('p',
          `FX mod 1 amount [${id}]`,
          `FX mod 1 amount with wheel [${id}]`,
          `FX mod 1 amount with A.T. [${id}]`,
          `FX mod 1 amount with ctrlped [${id}]`,
        ),
      },
    });
  }

  // ── Synth layers (group 'y', 3 layers: A / B / C) ────────────────────────
  const synthLayers: NS4Layer[] = [];
  for (const id of ['A', 'B', 'C'] as const) {
    const s = (n: string) => disp('y', `${n} [${id}]`);
    const r = (n: string) => rawNum('y', `${n} [${id}]`);

    const enabledStr = s('layer on/off');
    if (enabledStr === null) continue;

    // Sample info — always stored in the binary regardless of samples/analog mode.
    const slotStr = s('sample slot'); // "slot   2/100 in cat Strings Solo"
    const sampleIdRaw = r('sample ID/name');
    const sampleNameStr = s('sample ID/name'); // "NNNNNNNNNN (Sample Name)"

    let slot = 0, bankSize = 100, categoryName = '';
    if (slotStr) {
      const m = slotStr.match(/slot\s+(\d+)\/\s*(\d+)\s+in cat (.+)$/);
      if (m) { slot = parseInt(m[1]); bankSize = parseInt(m[2]); categoryName = m[3].trim(); }
    }
    const sampleName = sampleNameStr?.match(/\((.+)\)$/)?.[1] ?? '';
    const sample: Ns4SampleRef = {
      slot, bankSize, categoryName,
      id: sampleIdRaw ?? 0,
      name: sampleName,
      options: s('sample options') ?? undefined,
      bright: s('sample bright on/off') === 'on',
    };

    // Vibrato (omit the struct when mode is "none")
    const vibratoMode = s('vibrato mode');
    const vibrato = vibratoMode && vibratoMode !== 'none' ? {
      mode: vibratoMode,
      delay: parseFloatOrUndef(s('vibrato delay')),
      rate: parseFloatOrUndef(s('vibrato rate')),
      amount: parseFloatOrUndef(s('vibrato amount')),
    } : undefined;

    // Arpeggiator
    const arpRunStr = s('arpeggiator run on/off');
    const arp = arpRunStr !== null ? {
      run: arpRunStr === 'on',
      mode: s('arpeggiator mode') ?? undefined,
      direction: s('arp direction') ?? undefined,
      masterClock: s('arp MST CLK on/off') === 'on',
      zigzag: s('arp zigzag on/off') === 'on',
      rate: s('arp rate/time') ?? undefined,
      patternLength: r('arp pattern length'),
    } : undefined;

    const octStr = s('octave shift');

    synthLayers.push({
      id,
      kind: 'synth',
      enabled: enabledStr === 'on',
      enabledSceneII: s('layer on/off (scene II)') === 'on',
      volume: morphStr('y',
        `volume [${id}]`,
        `volume change with wheel [${id}]`,
        `volume change with A.T. [${id}]`,
        `volume change with ctrlped [${id}]`,
      ),
      pan: (() => { const v = s('pan'); return v ? { value: v } : undefined; })(),
      source: s('samples/analog') === 'analog' ? 'analog' : 'samples',
      sample,
      kbZones: s('KB zones') ?? undefined,
      octaveShift: octStr !== null ? parseInt(octStr, 10) : undefined,
      pitchStick: { on: s('pstick on/off') === 'on', range: s('pstick rng') ?? undefined },
      sustainPedal: s('susped on/off') === 'on',
      vibrato,
      mono: s('mono on/off') === 'on',
      legato: s('legato on/off') === 'on',
      voicePriority: s('voice priority') ?? undefined,
      glide: parseFloatOrUndef(s('glide')),
      arp,
      fxMod1: {
        on: s('FX mod 1 on/off') === 'on',
        masterClock: s('FX mod 1 MST CLK on/off') === 'on',
        mode: s('FX mod 1 mode') ?? undefined,
        rate: morphStr('y',
          `FX mod 1 rate [${id}]`,
          `FX mod 1 rate with wheel [${id}]`,
          `FX mod 1 rate with A.T. [${id}]`,
          `FX mod 1 rate with ctrlped [${id}]`,
        ),
        amount: morphStr('y',
          `FX mod 1 amount [${id}]`,
          `FX mod 1 amount with wheel [${id}]`,
          `FX mod 1 amount with A.T. [${id}]`,
          `FX mod 1 amount with ctrlped [${id}]`,
        ),
      },
    });
  }

  return {
    parsed: true,
    kind,
    layers: [...pianoLayers, ...synthLayers],
    bytes,
    warnings,
  };
}

function parseFloatOrUndef(s: string | null): number | undefined {
  if (!s) return undefined;
  const v = parseFloat(s);
  return Number.isNaN(v) ? undefined : v;
}
