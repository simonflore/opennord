import type { NS4Program, NS4Layer, Morphable, Ns4SampleRef, Ns4FileKind, Ns4OrganFx } from './types';
import { hasCbinMagic, fileTypeTag, readCbinHeader } from '../clavia/cbin';
import { buildParamMap } from './maps';
import { decodeAllParams } from './coverage';
import { programCategoryName } from '../clavia/categories';
import { formatSlot } from '../clavia/slot';

/** Format a CBIN version word (×100) as "M.mm", e.g. 313 → "3.13". */
function formatVersion(raw: number): string {
  return (raw / 100).toFixed(2);
}

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

  // 'ns4p' is a standalone program; 'ns4l' is the same program extracted from a
  // bundle/library (identical body, only the type tag differs). Both decode the
  // full program model. 'nsmp' is a Nord Sample (audio content, NOT a program).
  // See docs/FORMAT.md.
  let kind: Ns4FileKind = 'preset-unknown';
  if (tag === 'ns4p' || tag === 'ns4l') kind = 'program';
  else if (tag === 'nsmp') kind = 'sample';
  else if (tag.startsWith('ns4')) kind = 'preset-unknown';

  if (!recognized) {
    warnings.push('No CBIN magic — not a recognized Nord file.');
    return { parsed: false, kind, bytes, warnings };
  }

  // Only Stage 4 *programs* have the flat bit-packed parameter body this decoder
  // understands. Samples (`nsmp`) and presets use different layouts — decoding
  // their bytes as program params would produce garbage, so stop here. For
  // sample metadata (name/version only, never audio) use `readNsmpHeader`.
  if (kind !== 'program') {
    warnings.push(`Recognized a '${tag}' file (kind: ${kind}); not a Stage 4 program, structured decode skipped.`);
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

  // ── Organ layers (group 'o', 2 layers: A / B) ────────────────────────────
  const organLayers: NS4Layer[] = [];
  for (const id of ['A', 'B'] as const) {
    const s = (n: string) => disp('o', `${n} [${id}]`);

    const enabledStr = s('layer on/off');
    if (enabledStr === null) continue;

    const octStr = s('octave shift');

    // Nine drawbars, each with wheel / A.T. / pedal morphs
    const drawbars: (Morphable<string> | undefined)[] = [];
    for (let db = 1; db <= 9; db++) {
      drawbars.push(morphStr('o',
        `drawbar ${db} [${id}]`,
        `drawbar ${db} with wheel [${id}]`,
        `drawbar ${db} with A.T. [${id}]`,
        `drawbar ${db} with ctrlped [${id}]`,
      ));
    }

    organLayers.push({
      id,
      kind: 'organ',
      enabled: enabledStr === 'on',
      enabledSceneII: s('layer on/off (scene II)') === 'on',
      volume: morphStr('o',
        `volume [${id}]`,
        `volume change with wheel [${id}]`,
        `volume change with A.T. [${id}]`,
        `volume change with ctrlped [${id}]`,
      ),
      kbZones: s('KB zones') ?? undefined,
      octaveShift: octStr !== null ? parseInt(octStr, 10) : undefined,
      sustainPedal: s('organ susped on/off') === 'on',
      organModel: s('organ model') ?? undefined,
      organPreset: s('preset on/off') === 'on',
      vibChorus: s('vib/chorus on/off') === 'on',
      percussion: {
        on: s('percussion on/off') === 'on',
        harm3rd: s('perc harm 3rd on/off') === 'on',
        decayFast: s('perc decay fast on/off') === 'on',
        volSoft: s('perc vol soft on/off') === 'on',
      },
      drawbars,
    });
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
      fxMod2: {
        on: s('FX mod 2 on/off') === 'on',
        mode: s('FX mod 2 mode') ?? undefined,
        rate: morphStr('p',
          `FX mod 2 rate [${id}]`,
          `FX mod 2 rate with wheel [${id}]`,
          `FX mod 2 rate with A.T. [${id}]`,
          `FX mod 2 rate with ctrlped [${id}]`,
        ),
        amount: morphStr('p',
          `FX mod 2 amount [${id}]`,
          `FX mod 2 amount with wheel [${id}]`,
          `FX mod 2 amount with A.T. [${id}]`,
          `FX mod 2 amount with ctrlped [${id}]`,
        ),
      },
      ampSimEq: {
        on: s('FX amp sim/EQ on/off') === 'on',
        treb: s('FX amp sim/EQ treb') ?? undefined,
        mid: s('FX amp sim/EQ mid') ?? undefined,
        bass: s('FX amp sim/EQ bass') ?? undefined,
        freq: morphStr('p',
          `FX amp sim/EQ freq [${id}]`,
          `FX amp sim/EQ freq with wheel [${id}]`,
          `FX amp sim/EQ freq with A.T. [${id}]`,
          `FX amp sim/EQ freq with ctrlped [${id}]`,
        ),
        drive: morphStr('p',
          `FX amp sim/EQ drive [${id}]`,
          `FX amp sim/EQ drive with wheel [${id}]`,
          `FX amp sim/EQ drive with A.T. [${id}]`,
          `FX amp sim/EQ drive with ctrlped [${id}]`,
        ),
        mode: s('FX amp sim/EQ mode') ?? undefined,
      },
      comp: {
        on: s('FX comp on/off') === 'on',
        amount: s('FX comp amount') ?? undefined,
        response: s('FX comp response') ?? undefined,
      },
      delay: {
        on: s('FX delay on/off') === 'on',
        masterClock: s('FX delay tempo MST CLK on/off') === 'on',
        tempo: morphStr('p',
          `FX delay tempo [${id}]`,
          `FX delay tempo with wheel [${id}]`,
          `FX delay tempo with A.T. [${id}]`,
          `FX delay tempo with ctrlped [${id}]`,
        ),
        mix: morphStr('p',
          `FX delay mix [${id}]`,
          `FX delay mix with wheel [${id}]`,
          `FX delay mix with A.T. [${id}]`,
          `FX delay mix with ctrlped [${id}]`,
        ),
        analog: s('FX delay normal/analog') === 'analog',
        pingPong: s('FX delay ping pong on/off') === 'on',
        filterType: s('FX delay filter type') ?? undefined,
        feedback: morphStr('p',
          `FX delay feedback [${id}]`,
          `FX delay feedback with wheel [${id}]`,
          `FX delay feedback with A.T. [${id}]`,
          `FX delay feedback with ctrlped [${id}]`,
        ),
        effects: s('FX delay effects') ?? undefined,
      },
      reverb: {
        on: s('FX reverb on/off') === 'on',
        amount: morphStr('p',
          `FX reverb amount [${id}]`,
          `FX reverb amount with wheel [${id}]`,
          `FX reverb amount with A.T. [${id}]`,
          `FX reverb amount with ctrlped [${id}]`,
        ),
        tone: s('FX reverb dark/bright') ?? undefined,
        type: s('FX reverb type') ?? undefined,
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
      rate: morphStr('y',
        `arp rate/time [${id}]`,
        `arp rate/time with wheel [${id}]`,
        `arp rate/time with A.T. [${id}]`,
        `arp rate/time with ctrlped [${id}]`,
      ),
      range: morphStr('y',
        `arp range/env [${id}]`,
        `arp range/env with wheel [${id}]`,
        `arp range/env with A.T. [${id}]`,
        `arp range/env with ctrlped [${id}]`,
      ),
      patternLength: r('arp pattern length'),
      pattern: s('arp pattern on/off') === 'on',
      kbSync: s('KB sync on/off') === 'on',
      kbHold: s('KB hold') === 'on',
      accent: s('arpeggiator accent') ?? undefined,
      gate: s('arpeggiator gate') ?? undefined,
      pan: s('arpeggiator pan') ?? undefined,
    } : undefined;

    // Osc envelope
    const oscEnv: NS4Layer['oscEnv'] = {
      attack: s('osc env attack') ?? undefined,
      decay: s('osc env decay') ?? undefined,
      release: s('osc env release') ?? undefined,
      amount: morphStr('y',
        `osc env amt [${id}]`,
        `osc env amt with wheel [${id}]`,
        `osc env amt with A.T. [${id}]`,
        `osc env amt with ctrlped [${id}]`,
      ),
      toPitch: s('osc env-to-pitch on/off') === 'on',
      velocity: s('osc env velocity on/off') === 'on',
    };

    // LFO
    const lfo: NS4Layer['lfo'] = {
      target: s('LFO target') ?? undefined,
      shape: s('LFO shape') ?? undefined,
      masterClock: s('LFO mst clk on/off') === 'on',
      rate: morphStr('y',
        `LFO rate/time [${id}]`,
        `LFO rate/time with wheel [${id}]`,
        `LFO rate/time with A.T. [${id}]`,
        `LFO rate/time with ctrlped [${id}]`,
      ),
      amount: morphStr('y',
        `LFO mod amt [${id}]`,
        `LFO mod amt with wheel [${id}]`,
        `LFO mod amt with A.T. [${id}]`,
        `LFO mod amt with ctrlped [${id}]`,
      ),
    };

    // Amp envelope
    const ampEnv: NS4Layer['ampEnv'] = {
      attack: s('amp env attack') ?? undefined,
      decay: s('amp env decay') ?? undefined,
      release: s('amp env release') ?? undefined,
      velocity: s('amp env velocity') ?? undefined,
    };

    // Filter
    const filter: NS4Layer['filter'] = {
      on: s('filter on/off') === 'on',
      type: s('filter type') ?? undefined,
      freq: morphStr('y',
        `filter freq [${id}]`,
        `filter freq with wheel [${id}]`,
        `filter freq with A.T. [${id}]`,
        `filter freq with ctrlped [${id}]`,
      ),
      resonance: morphStr('y',
        `filter resonance / freq HP [${id}]`,
        `filter res with wheel [${id}]`,
        `filter res with A.T. [${id}]`,
        `filter res with ctrlped [${id}]`,
      ),
      track: s('filter track') ?? undefined,
      drive: s('filter drive') ?? undefined,
      envAmount: morphStr('y',
        `filter env amt [${id}]`,
        `filter env amt with wheel [${id}]`,
        `filter env amt with A.T. [${id}]`,
        `filter env amt with ctrlped [${id}]`,
      ),
      env: {
        attack: s('filter env attack') ?? undefined,
        decay: s('filter env decay') ?? undefined,
        release: s('filter env release') ?? undefined,
      },
      velocity: s('filter velocity on/off') === 'on',
    };

    // Extern
    const externOnStr = s('extern on/off');
    const extern: NS4Layer['extern'] = externOnStr !== null ? {
      on: externOnStr === 'on',
      program: s('extern program') ?? undefined,
      cc1: morphStr('y',
        `extern CC VAL1 [${id}]`,
        `extern CC VAL1 with wheel [${id}]`,
        `extern CC VAL1 with A.T. [${id}]`,
        `extern CC VAL1 with ctrlped [${id}]`,
      ),
      cc2: morphStr('y',
        `extern CC VAL2 [${id}]`,
        `extern CC VAL2 with wheel [${id}]`,
        `extern CC VAL2 with A.T. [${id}]`,
        `extern CC VAL2 with ctrlped [${id}]`,
      ),
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
      oscType: s('analog type (knob 1)') ?? undefined,
      oscCategory: s('analog cat (knob 2)') ?? undefined,
      oscWave: s('analog wave/partial (knob 3)') ?? undefined,
      oscCtrl: morphStr('y',
        `osc ctrl [${id}]`,
        `osc ctrl with wheel [${id}]`,
        `osc ctrl with A.T. [${id}]`,
        `osc ctrl with ctrlped [${id}]`,
      ),
      pitchFine: s('pitch fine') ?? undefined,
      pitchCoarse: s('pitch coarse') ?? undefined,
      oscEnv,
      lfo,
      ampEnv,
      filter,
      unison: s('unison level') ?? undefined,
      extern,
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
      fxMod2: {
        on: s('FX mod 2 on/off') === 'on',
        mode: s('FX mod 2 mode') ?? undefined,
        rate: morphStr('y',
          `FX mod 2 rate [${id}]`,
          `FX mod 2 rate with wheel [${id}]`,
          `FX mod 2 rate with A.T. [${id}]`,
          `FX mod 2 rate with ctrlped [${id}]`,
        ),
        amount: morphStr('y',
          `FX mod 2 amount [${id}]`,
          `FX mod 2 amount with wheel [${id}]`,
          `FX mod 2 amount with A.T. [${id}]`,
          `FX mod 2 amount with ctrlped [${id}]`,
        ),
      },
      ampSimEq: {
        on: s('FX amp sim/EQ on/off') === 'on',
        treb: s('FX amp sim/EQ treb') ?? undefined,
        mid: s('FX amp sim/EQ mid') ?? undefined,
        bass: s('FX amp sim/EQ bass') ?? undefined,
        freq: morphStr('y',
          `FX amp sim/EQ freq [${id}]`,
          `FX amp sim/EQ freq with wheel [${id}]`,
          `FX amp sim/EQ freq with A.T. [${id}]`,
          `FX amp sim/EQ freq with ctrlped [${id}]`,
        ),
        drive: morphStr('y',
          `FX amp sim/EQ drive [${id}]`,
          `FX amp sim/EQ drive with wheel [${id}]`,
          `FX amp sim/EQ drive with A.T. [${id}]`,
          `FX amp sim/EQ drive with ctrlped [${id}]`,
        ),
        mode: s('FX amp sim/EQ mode') ?? undefined,
      },
      comp: {
        on: s('FX comp on/off') === 'on',
        amount: s('FX comp amount') ?? undefined,
        response: s('FX comp response') ?? undefined,
      },
      delay: {
        on: s('FX delay on/off') === 'on',
        masterClock: s('FX delay tempo MST CLK on/off') === 'on',
        tempo: morphStr('y',
          `FX delay tempo [${id}]`,
          `FX delay tempo with wheel [${id}]`,
          `FX delay tempo with A.T. [${id}]`,
          `FX delay tempo with ctrlped [${id}]`,
        ),
        mix: morphStr('y',
          `FX delay mix [${id}]`,
          `FX delay mix with wheel [${id}]`,
          `FX delay mix with A.T. [${id}]`,
          `FX delay mix with ctrlped [${id}]`,
        ),
        analog: s('FX delay normal/analog') === 'analog',
        pingPong: s('FX delay ping pong on/off') === 'on',
        filterType: s('FX delay filter type') ?? undefined,
        feedback: morphStr('y',
          `FX delay feedback [${id}]`,
          `FX delay feedback with wheel [${id}]`,
          `FX delay feedback with A.T. [${id}]`,
          `FX delay feedback with ctrlped [${id}]`,
        ),
        effects: s('FX delay effects') ?? undefined,
      },
      reverb: {
        on: s('FX reverb on/off') === 'on',
        amount: morphStr('y',
          `FX reverb amount [${id}]`,
          `FX reverb amount with wheel [${id}]`,
          `FX reverb amount with A.T. [${id}]`,
          `FX reverb amount with ctrlped [${id}]`,
        ),
        tone: s('FX reverb dark/bright') ?? undefined,
        type: s('FX reverb type') ?? undefined,
      },
    });
  }

  // ── Organ FX (master group 'm') — global, not per organ layer ────────────
  const m = (n: string) => disp('m', n);
  const organFx: Ns4OrganFx = {
    mod1: {
      on: m('organ FX mod 1 on/off') === 'on',
      masterClock: m('organ FX mod 1 MST CLK on/off') === 'on',
      mode: m('organ FX mod 1 mode') ?? undefined,
      rate: morphStr('m', 'organ FX mod 1 rate', 'organ FX mod 1 rate with wheel', 'organ FX mod 1 rate with A.T.', 'organ FX mod 1 rate with ctrlped'),
      amount: morphStr('m', 'organ FX mod 1 amount', 'organ FX mod 1 amount with wheel', 'organ FX mod 1 amount with A.T.', 'organ FX mod 1 amount with ctrlped'),
    },
    mod2: {
      on: m('organ FX mod 2 on/off') === 'on',
      mode: m('organ FX mod 2 mode') ?? undefined,
      rate: morphStr('m', 'organ FX mod 2 rate', 'organ FX mod 2 rate with wheel', 'organ FX mod 2 rate with A.T.', 'organ FX mod 2 rate with ctrlped'),
      amount: morphStr('m', 'organ FX mod 2 amount', 'organ FX mod 2 amount with wheel', 'organ FX mod 2 amount with A.T.', 'organ FX mod 2 amount with ctrlped'),
    },
    ampSimEq: {
      on: m('organ FX amp sim/EQ on/off') === 'on',
      treb: m('organ FX amp sim/EQ treb') ?? undefined,
      mid: m('organ FX amp sim/EQ mid') ?? undefined,
      bass: m('organ FX amp sim/EQ bass') ?? undefined,
      freq: morphStr('m', 'organ FX amp sim/EQ freq', 'organ FX amp sim/EQ freq with wheel', 'organ FX amp sim/EQ freq with A.T.', 'organ FX amp sim/EQ freq with ctrlped'),
      drive: morphStr('m', 'organ FX amp sim/EQ drive', 'organ FX amp sim/EQ drive with wheel', 'organ FX amp sim/EQ drive with A.T.', 'organ FX amp sim/EQ drive with ctrlped'),
      mode: m('organ FX amp sim/EQ mode') ?? undefined,
    },
    comp: {
      on: m('organ FX comp on/off') === 'on',
      amount: m('organ FX comp amount') ?? undefined,
      response: m('organ FX comp response') ?? undefined,
    },
    delay: {
      on: m('organ FX delay on/off') === 'on',
      masterClock: m('organ FX delay tempo MST CLK on/off') === 'on',
      tempo: morphStr('m', 'organ FX delay tempo', 'organ FX delay tempo with wheel', 'organ FX delay tempo with A.T.', 'organ FX delay tempo with ctrlped'),
      mix: morphStr('m', 'organ FX delay mix', 'organ FX delay mix with wheel', 'organ FX delay mix with A.T.', 'organ FX delay mix with ctrlped'),
      analog: m('organ FX delay normal/analog') === 'analog',
      pingPong: m('organ FX delay ping pong on/off') === 'on',
      filterType: m('organ FX delay filter type') ?? undefined,
      feedback: morphStr('m', 'organ FX delay feedback', 'organ FX delay feedback with wheel', 'organ FX delay feedback with A.T.', 'organ FX delay feedback with ctrlped'),
      effects: m('organ FX delay effects') ?? undefined,
    },
    reverb: {
      on: m('organ FX reverb on/off') === 'on',
      amount: morphStr('m', 'organ FX reverb amount', 'organ FX reverb amount with wheel', 'organ FX reverb amount with A.T.', 'organ FX reverb amount with ctrlped'),
      tone: m('organ FX reverb dark/bright') ?? undefined,
      type: m('organ FX reverb type') ?? undefined,
    },
    rotary: {
      on: m('organ rotary spkr on/off') === 'on',
      drive: m('rotary spkr drive') ?? undefined,
      stopPosition: m('rotary spkr stop position') ?? undefined,
      stop: m('rotary spkr stop on/off') === 'on',
      fast: m('rotary spkr slow/fast') === 'fast',
      vibChorusType: m('organ vib/chorus type') ?? undefined,
    },
  };

  // ── CBIN header metadata (bytes 0x00–0x2B; verified, see docs/FORMAT.md) ──
  // bank/location/category/version sit in front of the bit-packed body. The
  // program *name* is not in the file — it's the filename, set on import.
  const header = readCbinHeader(bytes);

  return {
    parsed: true,
    kind,
    category: programCategoryName(header.category),
    categoryId: header.category,
    bank: header.bank,
    location: header.location,
    slot: formatSlot(header.bank, header.location),
    programVersion: formatVersion(header.versionRaw),
    activeScene: m('which layer scene is active') === 'II' ? 'II' : 'I',
    layers: [...organLayers, ...pianoLayers, ...synthLayers],
    organFx,
    bytes,
    warnings,
  };
}

function parseFloatOrUndef(s: string | null): number | undefined {
  if (!s) return undefined;
  const v = parseFloat(s);
  return Number.isNaN(v) ? undefined : v;
}
