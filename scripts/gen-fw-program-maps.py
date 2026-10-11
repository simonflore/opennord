#!/usr/bin/env python3
"""Generate the firmware-derived program layouts (`<model>/layout.generated.ts`).

Input: the per-model offset CSVs produced by static analysis of each model's
firmware parameter registry (one row per field: name, block, body bit, width,
min, max, default, notes). The CSVs hold *knowledge* only — names, positions,
ranges and defaults — never firmware bytes or tables (docs/LEGAL.md). They are
kept out of the repo with the rest of the firmware workspace; this script turns
them into small TypeScript layouts the shared block-chain reader
(src/lib/clavia/block-chain.ts) applies.

Four CSV dialects are accepted:
  pianos: name,block,file_byte,body_byte,bit,body_bitpos,width,min,max,default,notes
  keys:   name,block,param_id,file_byte,body_byte,bit,bit_offset,width,min,max,default,morph,midi_cc,notes
          (bit_offset is a FILE bit; body bit = bit_offset - 352)
  e7:     name,block,param_id,body_bit_offset,body_byte,bit_in_byte_msb7,width,signed,min,max,default,
          kind,slot,buffer_mode,midi_cc,notes
  ns3:    name,section,param_id,byte,bit,bit_offset,width,min,max,default,morph,midi_cc,notes
          (`section` names the block, e.g. `A:Piano`; bit_offset is a FILE bit as in the
          keys dialect; one `[Slot B]` row stands for slot A's blocks repeated at its offset)
A model whose registry builder sets the signed mode to 0 declares `negatives: 'twos'`:
its negative-min fields are two's complement in their width, not `value - min`.
The Stage 3 keeps the registry's signed mode 1, so it takes the default: every
negative-min field is stored as `value - min` (encoding 'offset').

What is kept (only high/medium-confidence fields):
  - every registry parameter with a known position and range;
  - NOT the structural rows (format version, [block length], [reserved]);
  - NOT the "@kind3" rows of the older keys CSVs (unnamed bits; the e7 dialect
    names them, e.g. `Edt_Org_kLevel.pedalAssign`, and those are kept);
  - the "@Wheel" / "@AfterTouch" / "@CtrlPedal" morph deltas only for a model that
    sets `morphs` (the Stage 3; the Wave 2 with its own `morphSources`, below): each
    becomes `<block>.<param>.morph<Source>`. A delta
    is one bit wider than its parameter and stored as `delta + (max - min)`, which is
    `value - min` with min = -(max - min), so it reads with the 'offset' encoding;
  - NOT parameters the firmware itself marks obsolete, shadow, requested or
    dirty (editor state, not sound).

Usage (from packages/core):
    python3 scripts/gen-fw-program-maps.py grand    <grand-offsets.csv>        src/lib/ng/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-6  <piano-6-offsets.csv>      src/lib/np6/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-7 <electro-7-offsets.csv>   src/lib/ne7/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py organ-3  <organ-3-offsets.csv>      src/lib/no3/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-4  <piano-4-offsets.csv>      src/lib/np4/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-5  <piano-5-offsets.csv>      src/lib/np5/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py grand-2  <grand-2-offsets.csv>      src/lib/ng2/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-6 <electro-6-offsets.csv>   src/lib/ne6/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py wave-2   <wave-2-offsets.csv>       src/lib/nw2/layout.generated.ts
        (the morph-corrected CSV: named "@Impulse".."@Velocity" buffer rows, see below)
    python3 scripts/gen-fw-program-maps.py lead-4   <lead-4-offsets.csv>       src/lib/nl4/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py lead-a1  <lead-a1-offsets.csv>      src/lib/nla/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-4 <electro-4-offsets.csv>   src/lib/ne4/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-3 <electro-3-offsets.csv>   src/lib/ne3/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-3-hp <electro-3-hp-offsets.csv> src/lib/ne3/layout-hp.generated.ts
    python3 scripts/gen-fw-program-maps.py c2d      <c2d-offsets.csv>          src/lib/nc2/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py wave     <wave-offsets.csv>         src/lib/nw1/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py stage-3  <ns3-offsets.csv>          src/lib/ns3/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py stage-2  <stage-2-offsets.csv>      src/lib/ns2/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-5 <electro-5-offsets.csv>   src/lib/ne5/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-3  <piano-3-offsets.csv>      src/lib/np3/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-2  <piano-2-offsets.csv>      src/lib/np2/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-1  <piano-1-offsets.csv>      src/lib/np1/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py stage-classic <stage-classic-offsets.csv> src/lib/ns1/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py c2       <c2-offsets.csv>           src/lib/nc/layout.generated.ts
    # Cross-check only: the Stage EX OS 6.08 descriptors give the Stage Classic layout field for field.
    python3 scripts/gen-fw-program-maps.py stage-ex <stage-ex-offsets.csv>     /tmp/ns1-ex.generated.ts

Wave 2 morphs (the keys dialect's "@Impulse".."@Velocity" rows of the corrected CSV,
which renames the older CSV's "@m1".."@m5" by morph buffer): `morphSources` maps
them to `<block>.<param>.morph<Source>`. A parameter of registry kind 6 stores its
base value and morph buffers 1-5 (Impulse, Wheel, Pedal, After Touch, Velocity),
kind 2 the base and buffer 1, kind 1 the base only; each buffer one bit wider than
the base (FUN_c00a5ed0). Buffer 1 (Impulse) is an absolute target, unsigned: 0 = no
Impulse morph, else target = raw + min - 1. Buffers 2-5 are continuous deltas
stored as delta + (max - min), read with the 'offset' encoding even though the
Wave 2's base values are two's complement (`negatives: 'twos'` would misread them).

Legacy records (Lead 4, Lead A1, Electro 3 / 3 HP / 4, C2D, Wave; `kind: 'legacy'`)
are not block chains: the formatType-0 file holds the record at file 0x18 — a
record version (u16, or the Wave's u8: `versionBytes`) then the data, one
MSB-first bitstream of descriptor parameters stored raw (minimum 0), then any
padding (`padBytes`). Their output is a LegacyLayout (src/lib/clavia/legacy-record.ts):
  lead:      name,block,param_id,bit_offset,byte,bit_msb,bit_width,min,max,default,midi_cc,morph,...,notes
             (bit_offset relative to the record data; morph = "delta" for a Lead A1 inline delta)
  electro-4: name,block,param_index,stream_bit_offset,...,bit_width,min,max,default,ctl_id,notes
             (not-stored rows have no stream_bit_offset; the Electro 3 / 3 HP, C2D,
             Wave and Stage 2 CSVs use the same columns)
Reserved rows are dropped; the Lead 4 sparse morph lists become `morphLists`.
A config's `names` (field key -> display name) names fields the CSV leaves as
"param N", from the firmware's own display tables; keys don't change.

The Stage 2 (`stage-2`) is a descriptor-container record in the electro-4 dialect,
with two differences. Its data starts at file 0x2E behind the NSM-era header (0x1A
behind the legacy one), which the reader handles; the layout's bits are relative
to the record data either way. And its morphable parameters carry inline deltas
that the CSV describes in the notes ("morphable: 3 signed deltas of N bits ... at
stream bits a..b precede the value"), not as rows. With `morphNotes` set, each
becomes `<parameter key>.morph<Source>` (deltaOf the parameter): one per source in
the descriptor's mask, one bit wider than the parameter, two's complement (the
record reader FUN_30032CCE reads deltas with the sign-extending FUN_301EDBE6 and
keeps them within +/-max).

The later ColdFire records (Electro 5, Piano 3, Piano 2, Nord Piano, Stage Classic,
Stage EX, C2) use the electro-4 dialect with a `block.key` name per row. Their configs
add `labels` (a field's `name` is the "label: ..." text of its notes, where there
is one) and, on the Stage models, `morphRows`: a `<param>.morphN` row is one of the
three morph deltas stored before its parameter, one bit wider and two's complement
(`negatives: 'twos'`), and gets `deltaOf` like a Lead A1 inline delta. The Stage
record opens with a u8 version (its Header row) at record bit 0, so its `bit`s
count from the record start, wherever that sits in the file (`recordNote`).

In the electro-4 dialect a morphable parameter's inline deltas come from its
note, "morphable: N signed deltas of W bits (sources ...) at stream bits X..Y
precede the value": one delta per morph source, one bit wider than the
parameter, two's complement within +/-(max - min), each `deltaOf` the
parameter (the Stage 2 record reader FUN_30032CCE reads them with the
sign-extending FUN_301EDBE6). Named sources (the Stage 2's "0/1/2 =
Wheel/After Touch/Ctrl Pedal") become `<key>.morph<Source>`, numbered ones
(the Wave's "0/5/6 in that order") `<key>MorphDeltaSrc<n>`, as on the Lead A1.
A "second copy" row (the C2D's firmware list repeats some containers) becomes a
field with `copyOf` naming the first copy, which the firmware reader
overwrites. `sets` names the parameter sets a record stores more than once
(presets, manuals, slots), so the coverage count takes each parameter once.
"""
import csv
import re
import sys

# Display names from the firmware's own tables where the descriptor CSVs only number the
# parameters (`names` in a config; keys stay the CSV's).
# Wave OS 2.14 morph-display table 0x300b4b2a (slot, high) and FUN_30005b64 / FUN_30005bbe (common, medium-high).
WAVE_SLOT_NAMES = [
    'Octave Shift', 'Mono Mode', 'Glide', 'Vibrato Mode', 'LFO 1 Waveform', 'LFO 1 Dest',
    'LFO 1 Polyphonic', 'LFO 1 Rate', 'LFO 1 Amount', 'LFO 2 Waveform', 'LFO 2 Dest', 'LFO 2 Single Mode',
    'LFO 2 Rate', 'LFO 2 Amount', 'Mod Envelope Attack', 'Mod Envelope Decay', 'Mod Envelope Amount', 'Mod Envelope Dest',
    'Mod Envelope Mode', 'Osc 1 Waveform', 'Osc 1 FM', 'Osc 1 Etc', 'Osc 1 Table', 'Osc 1 Shape',
    'Osc 2 Waveform', 'Osc 2 FM', 'Osc 2 Etc', 'Osc 2 Smp', 'Osc 2 Skip Attack', 'Osc 2 Smp Decay',
    'Osc 2 Semi Tones', 'Osc 2 Fine Tune', 'Osc 2 Shape', 'Osc 1 Sync Mode', 'Osc Mod Type', 'Osc Mod Amount',
    'Osc Mix', 'Amp Env Attack', 'Amp Env Decay', 'Amp Env Sustain', 'Amp Env Release', 'Filter Env Attack',
    'Filter Env Decay', 'Filter Env Sustain', 'Filter Env Release', 'Filter Type', 'Filter Kb Track', 'Filter Slope',
    'Filter Velocity', 'Filter Freq', 'Filter Resonance', 'Filter Env Amount', 'Output Level', 'Treble',
    'Bass', 'Chorus Mode',
]
WAVE_COMMON_NAMES = ['Tube Amp State', 'Tube Amp Drive', 'Delay Tempo', 'Delay Feedback', 'Delay Mode',
                     'Delay Amount', 'Delay State', 'Reverb Model', 'Reverb Dry/Wet', 'Reverb State']
# Electro 3: the per-instrument effect switches share their control ids with the named
# Electro 5 / Piano 2 / Piano 3 enables (medium-high).
E3_SWITCH_NAMES = {f'{b}.param{i}': n for b in ('effectsOrgan', 'effectsPiano')
                   for i, n in enumerate(['EQ On', 'Effect 1 On', 'Effect 2 On', 'Amp/Comp On', 'Reverb On'])}

MODELS = {
    'grand': {
        'const': 'NG_LAYOUT', 'type': 'NgFieldKey', 'model': 'Nord Grand',
        'source': 'Grand OS 1.68 registry FUN_c004f960',
        'container': 'Grand OS 1.68 program archive FUN_c00520cc (reads 1.00–1.01)',
        'versionRange': (100, 101),
        'confidence': lambda row: 'high',
        'blocks': {'MultiCommon': 'common', 'Piano': 'piano', 'Synth': 'synth', 'Effects': 'effects'},
    },
    'piano-6': {
        'const': 'NP6_LAYOUT', 'type': 'Np6FieldKey', 'model': 'Nord Piano 6',
        'source': 'Piano 6 OS 1.20 registry FUN_c0112544',
        'container': 'Piano 6 OS 1.20 program archive FUN_c010db30 (version range in a RAM global, not recovered)',
        'versionRange': None,
        # The layout is high; two's-complement storage on Piano 6 is inferred from
        # the shared code and the Grand 2 corpus (medium).
        'confidence': lambda row: 'medium' if "two's complement" in row['notes'] else 'high',
        'blocks': {
            'MultiCom': 'common', 'PnoCom': 'pianoCommon', 'PnoA': 'pianoA', 'PnoB': 'pianoB',
            'PnoFxA': 'pianoFxA', 'PnoFxB': 'pianoFxB', 'SynCom': 'synthCommon',
            'SynA': 'synthA', 'SynB': 'synthB', 'SynFxA': 'synthFxA', 'SynFxB': 'synthFxB',
        },
    },
    'piano-4': {
        'const': 'NP4_LAYOUT', 'type': 'Np4FieldKey', 'model': 'Nord Piano 4',
        'source': 'Piano 4 OS 2.66 registry FUN_c004c648',
        'container': 'Piano 4 OS 2.66 program archive FUN_c004ed00 (reads 1.00–1.01)',
        'versionRange': (100, 101),
        'confidence': lambda row: 'high',
        'blocks': {'MultiCommon': 'common', 'Piano': 'piano', 'Synth': 'synth', 'Effects': 'effects'},
    },
    'piano-5': {
        'const': 'NP5_LAYOUT', 'type': 'Np5FieldKey', 'model': 'Nord Piano 5',
        'source': 'Piano 5 OS 1.34 registry FUN_c00f8188',
        'container': 'Piano 5 OS 1.34 program archive FUN_c00f6ccc (1.00–1.01, medium)',
        'versionRange': (100, 101),
        'confidence': lambda row: 'high',
        'blocks': {
            'MultiCommon': 'common', 'Effects': 'effects', 'PianoA': 'pianoA', 'PianoB': 'pianoB',
            'SynthA': 'synthA', 'SynthB': 'synthB',
        },
    },
    'grand-2': {
        'const': 'NG2_LAYOUT', 'type': 'Ng2FieldKey', 'model': 'Nord Grand 2',
        'source': 'Grand 2 OS 1.22 registry FUN_c01125f8',
        'container': 'Grand 2 OS 1.22 program archive FUN_c010dac0 (version range in a RAM global, not recovered)',
        'versionRange': None,
        'confidence': lambda row: 'high',
        'blocks': {
            'MultiCom': 'common', 'PnoCom': 'pianoCommon', 'PnoA': 'pianoA', 'PnoB': 'pianoB',
            'PnoFxA': 'pianoFxA', 'PnoFxB': 'pianoFxB', 'SynCom': 'synthCommon',
            'SynA': 'synthA', 'SynB': 'synthB', 'SynFxA': 'synthFxA', 'SynFxB': 'synthFxB',
        },
    },
    'electro-7': {
        'const': 'NE7_LAYOUT', 'type': 'Ne7FieldKey', 'model': 'Nord Electro 7',
        'source': 'Electro 7 OS 1.30 registry FUN_c009c394',
        'container': 'Electro 7 OS 1.30 program archive FUN_c00a8148, tree FUN_c00aa7c8 (1.00–1.10, medium)',
        'versionRange': (100, 110),
        # The builder clears the registry's signed mode (global 0xc05da57c), so the
        # constructor FUN_c01236c8 stores negative-min fields as two's complement.
        'negatives': 'twos',
        # Parameter list high; block order from the archive builder (medium).
        'confidence': lambda row: 'medium',
        'blocks': {
            'Common': 'common', 'Organ/Organ': 'organ', 'Organ/Fx': 'organFx',
            'Organ/LayerA': 'organLayerA', 'Organ/LayerB': 'organLayerB',
            'Organ/Drawbars1': 'organDrawbars1', 'Organ/Drawbars2': 'organDrawbars2',
            'Organ/Drawbars3': 'organDrawbars3', 'Piano/Piano': 'piano', 'Piano/Fx': 'pianoFx',
            'Synth/Synth': 'synth', 'Synth/SynthPreset': 'synthPreset', 'Synth/Fx': 'synthFx',
        },
    },
    'organ-3': {
        'const': 'NO3_LAYOUT', 'type': 'No3FieldKey', 'model': 'Nord Organ 3',
        'source': 'Organ 3 OS 1.00 registry FUN_c00c0120',
        'container': 'Organ 3 OS 1.00 program archive FUN_c00b9888 (2.00, medium)',
        'versionRange': (200, 200),
        # The builder sets the registry's signed mode to 0 (global 0xc041e800), so the
        # constructor FUN_c008c6e4 stores negative-min fields as two's complement.
        'negatives': 'twos',
        'confidence': lambda row: 'medium',
        'blocks': {
            'Common': 'common', 'Org/BassDrawbar': 'bassDrawbar', 'Org/BassSustain': 'bassSustain',
            'Org/ModeSpecific': 'modeSpecific',
            'Org/ManualA/Drawbar': 'manualADrawbar', 'Org/ManualA/ModeAndLayer': 'manualAModeAndLayer',
            'Org/ManualB/Drawbar': 'manualBDrawbar', 'Org/ManualB/ModeAndLayer': 'manualBModeAndLayer',
        },
    },
    'electro-6': {
        'const': 'NE6_LAYOUT', 'type': 'Ne6FieldKey', 'model': 'Nord Electro 6',
        'source': 'Electro 6 OS 2.66 registry FUN_c0054b5c',
        'container': 'Electro 6 OS 2.66 Multi format FUN_c0057f8c (reads 2.00–2.04), block order from the node-key initialiser near c005aca4',
        'versionRange': (200, 204),
        # Registry init FUN_c009aad8: both program builders set signed mode 0, so
        # negative-min fields are stored as two's complement, not raw - min.
        'negatives': 'twos',
        'confidence': lambda row: 'high',
        'blocks': {
            'MultiComm': 'common', 'Piano': 'piano', 'Synth': 'synth', 'Effects': 'effects',
            'Organ': 'organ', 'OrganMultiA': 'organMultiA', 'OrganMultiB': 'organMultiB',
            'OrgMan/Comm': 'organManualCommon',
            'OrgMan/A/PresetComm': 'manualAPresetCommon', 'OrgMan/A/PresetI': 'manualAPresetI',
            'OrgMan/A/PresetII': 'manualAPresetII',
            'OrgMan/B/PresetComm': 'manualBPresetCommon', 'OrgMan/B/PresetI': 'manualBPresetI',
            'OrgMan/B/PresetII': 'manualBPresetII',
        },
    },
    'wave-2': {
        'const': 'NW2_LAYOUT', 'type': 'Nw2FieldKey', 'model': 'Nord Wave 2',
        'source': 'Wave 2 OS 1.24 registry FUN_c01106b8',
        'container': 'Wave 2 OS 1.24 Multi format FUN_c010bfe4 (reads 3.00–3.01), slot sub-chain FUN_c010bde0',
        'versionRange': (300, 301),
        # Registry init FUN_c00a6e64: all three program builders set signed mode 0,
        # so negative-min fields are stored as two's complement.
        'negatives': 'twos',
        # Morph buffers 1-5 (FUN_c00a5ed0 with registry params {6, 2, mask 2, signed 0};
        # sources from the label table c01d71a8: None, Impulse, Wheel, Pedal, ATouch, Velocity).
        'morphs': True,
        'morphSources': {'Impulse': 'morphImpulse', 'Wheel': 'morphWheel', 'Pedal': 'morphPedal',
                         'ATouch': 'morphAfterTouch', 'Velocity': 'morphVelocity'},
        # MultiCommon from the format function (high); the four Single slots at
        # body 68 + 244k from the slot sub-chain (high/medium).
        'confidence': lambda row: 'medium' if row['block'].startswith('Single') else 'high',
        'blocks': {
            'MultiCommon': 'common',
            **{f'Single{s}/{name}': f'slot{s}{key}'
               for s in 'ABCD'
               for name, key in (('Common', 'Common'), ('Arp', 'Arp'), ('LFO', 'Lfo'), ('Flt', 'Filter'),
                                 ('AmpEnv', 'AmpEnv'), ('Fx', 'Fx'), ('EQ', 'Eq'), ('Dly', 'Delay'),
                                 ('Rvb', 'Reverb'), ('Vib', 'Vibrato'))},
        },
    },
    # Legacy formatType-0 records (see the module docstring and main_legacy).
    'lead-4': {
        'kind': 'legacy', 'dialect': 'lead', 'model': 'Nord Lead 4',
        'source': 'Lead 4 OS 1.32 parameter descriptors',
        'container': 'Lead 4 OS 1.32 serialiser FUN_c01208a8 → FUN_c01156b4, record sizes FUN_c00fa160 / FUN_c00fa0d4',
        'confidence': lambda row: 'high',
        'records': [
            # Program ("Sound", .nl4s): slot set c03c0c50 + morph list, FX set c03c1758 + morph list.
            {'const': 'NL4_LAYOUT', 'type': 'Nl4FieldKey', 'version': 8,
             'blocks': {'Slot': 'slot', 'Slot FX': 'fx'},
             'morphLists': {'Slot morph list': 'slot', 'Slot FX morph list': 'fx'}},
            # Performance (.nl4p): 7 bytes of common settings (c03c0620), then 4 program records.
            {'const': 'NL4_PERF_LAYOUT', 'type': 'Nl4PerfFieldKey', 'version': 9,
             'blocks': {'Performance common': 'perf'}},
        ],
    },
    'lead-a1': {
        'kind': 'legacy', 'dialect': 'lead', 'model': 'Nord Lead A1',
        'source': 'Lead A1 OS 1.36 parameter descriptors',
        'container': 'Lead A1 OS 1.36 registration FUN_c0013728, record sizes FUN_c012414c / FUN_c01240c8',
        # The A1 alignment and the delta signedness are medium (no corpus check yet).
        'confidence': lambda row: 'medium',
        'records': [
            # Program (.nlas): slot set c02a5fc0, FX set c02a6a78; inline morph deltas.
            {'const': 'NLA_LAYOUT', 'type': 'NlaFieldKey', 'version': 7,
             'blocks': {'Slot': 'slot', 'Slot FX': 'fx'}},
            # Performance (.nlap): 7 bytes of common settings (c02a58c0), then the slots.
            {'const': 'NLA_PERF_LAYOUT', 'type': 'NlaPerfFieldKey', 'version': 7,
             'blocks': {'Performance common': 'perf'}},
        ],
    },
    'electro-4': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Electro 4',
        'source': 'Electro 4 OS 1.22 parameter containers',
        'container': 'Electro 4 OS 1.22 serialiser FUN_3000C93A, container builder FUN_3000CB5C',
        'confidence': lambda row: 'medium',
        'records': [
            # One 108-byte record of 14 descriptor containers; the record version is not recovered.
            {'const': 'NE4_LAYOUT', 'type': 'Ne4FieldKey', 'version': None, 'blocks': None},
        ],
    },
    'electro-3': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Electro 3',
        'source': 'Electro 3 OS 3.14 parameter containers',
        'container': 'Electro 3 OS 3.14 record version 101 (100 upgraded by FUN_30017F9A), categories FUN_30009764',
        # Descriptors high; the block alignment in the file is medium.
        'confidence': lambda row: 'medium',
        'sets': {'organPresetI': 'organPreset', 'organPresetII': 'organPreset',
                 'effectsOrgan': 'effectsSwitches', 'effectsPiano': 'effectsSwitches'},
        'names': E3_SWITCH_NAMES,
        'records': [
            # One 108-byte record of 8 descriptor containers; no morphs.
            {'const': 'NE3_LAYOUT', 'type': 'Ne3FieldKey', 'version': 101, 'blocks': None},
        ],
    },
    'electro-3-hp': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Electro 3 HP',
        'source': 'Electro 3 HP OS 3.16 parameter containers',
        'container': 'Electro 3 HP OS 3.16 record version 101: the Electro 3 record plus 5 parameters in its reserved space',
        'confidence': lambda row: 'medium',
        'sets': {'organPresetI': 'organPreset', 'organPresetII': 'organPreset',
                 'effectsOrgan': 'effectsSwitches', 'effectsPiano': 'effectsSwitches'},
        # The HP's three added shared effects (medium-high, by control id).
        'names': {**E3_SWITCH_NAMES, 'effectsShared.param15': 'Delay On', 'effectsShared.param16': 'Delay Ping Pong',
                  'effectsShared.param17': 'Delay Tempo'},
        'records': [
            {'const': 'NE3HP_LAYOUT', 'type': 'Ne3HpFieldKey', 'version': 101, 'blocks': None},
        ],
    },
    'c2d': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord C2D',
        'source': 'C2D OS 1.12 parameter containers',
        'container': 'C2D OS 1.12 container list FUN_300200AE (115 instances, record version 100)',
        # Container order from the firmware list (high); block names medium-low; alignment medium.
        'confidence': lambda row: 'medium',
        # Presets, manuals, stops and per-organ switch sets share their descriptors.
        'sets': lambda block: re.sub(r'\d+(_\d+)?(dup)?$', '', block),
        # Control id 9, the C2's Organ Model (medium).
        'names': {'common.param0': 'Organ Model'},
        'records': [
            {'const': 'NC2_LAYOUT', 'type': 'Nc2FieldKey', 'version': 100, 'blocks': None},
        ],
    },
    'wave': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Wave',
        'source': 'Wave OS 2.14 parameter containers',
        'container': 'Wave OS 2.14 record write FUN_300056A4 / read FUN_30005906, versions 6-8 FUN_3000090E',
        'confidence': lambda row: 'medium',
        # A u8 record version at file 0x18, so the data starts at 0x19; 2 pad bytes close the 324-byte record.
        'versionBytes': 1, 'padBytes': 2,
        'sets': {'slotA': 'slot', 'slotB': 'slot'},
        'names': {**{f'{slot}.param{i}': n for slot in ('slotA', 'slotB') for i, n in enumerate(WAVE_SLOT_NAMES)},
                  **{f'common.param{i}': n for i, n in enumerate(WAVE_COMMON_NAMES)}},
        'records': [
            {'const': 'NW1_LAYOUT', 'type': 'Nw1FieldKey', 'version': 8, 'blocks': None},
        ],
    },
    'stage-2': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Stage 2',
        'source': 'Stage 2 OS 3.00 parameter containers',
        'container': 'Stage 2 OS 3.00 container list FUN_300325FA (7 global, then 15 per slot for A and B), '
                     'record write FUN_30032F1A / read FUN_30032CCE',
        'dataStart': 'file 0x2E behind the NSM-era header, 0x1A behind the legacy one',
        'dataBytes': 519,  # 21 global + 2 x 249 (the slot stride)
        # Slot A and slot B store the same 15 containers.
        'sets': lambda block: re.sub(r'^slot[AB]_', 'slot_', block),
        # The layout reproduces every whole-field read of the earlier
        # ns3-program-viewer-derived decoder, which was checked against real files.
        'confidence': lambda row: 'high',
        'records': [
            # Record version 7 (the load path converts 1-6 up to 7; medium-high).
            {'const': 'NS2_LAYOUT', 'type': 'Ns2FieldKey', 'version': 7, 'blocks': None},
        ],
    },
    # Later ColdFire records (electro-4 dialect with `block.key` names; see the docstring).
    'electro-5': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Electro 5', 'labels': True,
        'source': 'Electro 5 OS 2.04 parameter containers',
        'container': 'Electro 5 OS 2.04 program record: 24 containers of 26-byte records, '
                     'u16 version 4 + 119 bytes (v3 converted, v1/v2 refused)',
        'confidence': lambda row: 'high' if 'confidence high' in row['notes'] else 'medium',
        'records': [{'const': 'NE5_LAYOUT', 'type': 'Ne5FieldKey', 'version': 4, 'blocks': None}],
    },
    'piano-3': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Piano 3', 'labels': True,
        'source': 'Piano 3 OS 2.04 parameter containers',
        'container': 'Piano 3 OS 2.04 program record: u16 version 4 + 53 bytes (common, piano, synth, effects)',
        'confidence': lambda row: 'high' if 'confidence high' in row['notes'] else 'medium',
        'records': [{'const': 'NP3_LAYOUT', 'type': 'Np3FieldKey', 'version': 4, 'blocks': None}],
    },
    'piano-2': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Piano 2', 'labels': True,
        'source': 'Piano 2 OS 1.22 parameter descriptors',
        'container': 'Piano 2 OS 1.22 program record: 24-byte descriptors, u16 version 2 + 42 bytes '
                     '(v1 converted: common param 4 remapped)',
        'confidence': lambda row: 'medium',
        # Piano 2 OS 1.22 display table (Keyboard/Touch, Sustain pedal mode, Keyboard split; high).
        'names': {'common.param4': 'Keyboard Touch', 'common.param5': 'Sustain Pedal Mode', 'common.keybSplit': 'Keyboard Split'},
        'records': [{'const': 'NP2_LAYOUT', 'type': 'Np2FieldKey', 'version': 2, 'blocks': None}],
    },
    'piano-1': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Piano', 'labels': True,
        'source': 'Nord Piano OS 1.50 parameter descriptors',
        'container': 'Nord Piano OS 1.50 program record: 20 bytes in a 31-byte flash slot, no version, '
                     'no converter; file position 0x1A assumed (low)',
        'confidence': lambda row: 'medium',
        'records': [{'const': 'NP1_LAYOUT', 'type': 'Np1FieldKey', 'version': None, 'blocks': None}],
    },
    'stage-classic': {
        # The Stage EX (OS 6.08) registers the same descriptors; both write `.nspg`.
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Stage Classic / Stage EX', 'labels': True,
        'source': 'Stage Classic OS 5.08 parameter descriptors',
        'container': 'Stage Classic OS 5.08 program record: u8 version 10 (0–9 converted), common, '
                     'panel A, panel B = 400 bytes; Stage EX OS 6.08 identical',
        # Morph deltas: one bit wider than their parameter, two's complement (medium).
        'negatives': 'twos', 'morphRows': True,
        # Panels A and B store the same descriptors: count each parameter once.
        'sets': {'panelA': 'panel', 'panelB': 'panel'},
        'recordNote': '`bit` is relative to the record start (its u8 version is bit 0); '
                      'where the record starts in a .nspg file is not confirmed.',
        'confidence': lambda row: 'medium' if re.search(r'\.morph\d$', row['name']) else 'high',
        'records': [{'const': 'NS1_LAYOUT', 'type': 'Ns1FieldKey', 'version': 10, 'blocks': None}],
    },
    'stage-ex': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord Stage EX', 'labels': True,
        'source': 'Stage EX OS 6.08 parameter descriptors',
        'container': 'Stage EX OS 6.08 program record: u8 version 10 (0–9 converted), common, '
                     'panel A, panel B = 400 bytes',
        'negatives': 'twos', 'morphRows': True,
        # Panels A and B store the same descriptors: count each parameter once.
        'sets': {'panelA': 'panel', 'panelB': 'panel'},
        'recordNote': '`bit` is relative to the record start (its u8 version is bit 0); '
                      'where the record starts in a .nspg file is not confirmed.',
        'confidence': lambda row: 'medium' if re.search(r'\.morph\d$', row['name']) else 'high',
        'records': [{'const': 'NS1_EX_LAYOUT', 'type': 'Ns1ExFieldKey', 'version': 10, 'blocks': None}],
    },
    'c2': {
        'kind': 'legacy', 'dialect': 'electro-4', 'model': 'Nord C2',
        'source': 'C2 OS 2.00 parameter containers',
        'container': 'C2 OS 2.00 program record: u16 version 100 (the only one read, no converter) + 269 bytes, '
                     '66 containers',
        # Container order and positions from the firmware; block names and the file alignment medium.
        'confidence': lambda row: 'medium',
        # As on the C2D, the upper and lower manuals, the numbered presets / drawbar sets /
        # couplers and the four per-organ effect sets share their descriptor tables.
        'sets': lambda block: re.sub(r'(Upper|Lower)$', 'Manual', re.sub(r'(Upper|Lower)(?=.)', '', re.sub(
            r'\d+$', '', re.sub(r'^effects(B3|Vox|Farf|Pipe)$', 'effectsOrgan', block)))),
        'records': [{'const': 'NCP_LAYOUT', 'type': 'NcpFieldKey', 'version': 100, 'blocks': None}],
    },
    'stage-3': {
        'const': 'NS3_LAYOUT', 'type': 'Ns3FieldKey', 'model': 'Nord Stage 3',
        'source': 'Stage 3 OS 2.64 registry FUN_c0075058',
        'container': 'Stage 3 OS 2.64 Multi format FUN_c007a51c, serialiser FUN_c00e0108 '
                     '(reads 3.00–3.04; 2.01–2.03 only through a converter)',
        'versionRange': (300, 304),
        # Signed mode 1 (value - min) is encoding()'s default, so no `negatives`.
        'dialect': 'ns3',
        'morphs': True,
        # The two sound-id hashes and the eight synth-name words are opaque 32-bit words.
        'rawWords': True,
        # Slot B is slot A's nine blocks again, 263 bytes later.
        'repeat': {'row': '[Slot B]', 'from': 'A:', 'to': 'B:'},
        'categoryPrefix': {'Spl': 'split'},
        # Layout high (it reproduces every offset of the earlier corpus decoder);
        # what the eight synth name words hold is medium.
        'confidence': lambda row: 'medium' if re.search(r'_kName\d', row['name']) else 'high',
        'blocks': {
            'Common:MultiCommon': 'common',
            **{f'{s}:{name}': f'{key}{s}'
               for s in 'AB'
               for name, key in (('Piano', 'piano'), ('SynthCommon', 'synthCommon'), ('Synth', 'synth'),
                                 ('Organ', 'organ'), ('OrgPreset/PresetI', 'organPresetI'),
                                 ('OrgPreset/PresetII', 'organPresetII'), ('Extern', 'extern'),
                                 ('Effects', 'effects'), ('Mixer', 'mixer'))},
        },
    },
}

MORPH_SOURCES = {'Wheel': 'morphWheel', 'AfterTouch': 'morphAfterTouch', 'CtrlPedal': 'morphCtrlPedal'}

# Field lists longer than CHUNK_ABOVE are emitted in FIELD_CHUNK-sized chunks (see main()).
CHUNK_ABOVE = 800
FIELD_CHUNK = 500

SKIP_SUFFIX = re.compile(r'(_obsolete|_shadow|_requested|_Dirty)', re.IGNORECASE)


def body_bit(row):
    if 'body_bit_offset' in row:
        return int(row['body_bit_offset'])
    if 'body_bitpos' in row:
        return int(row['body_bitpos'])
    return int(row['bit_offset']) - 352


def short_key(name, cfg=None):
    s = name[4:] if name.startswith('Edt_') else name
    s = s[6:] if s.startswith('Param_') else s  # the Stage 3 registry's prefix
    m = re.match(r'^([A-Za-z]*)_k(.*)$', s) or re.match(r'^()k(.*)$', s)
    # A category the model keeps in the key, e.g. the Stage 3's Spl_kLowPos -> splitLowPos.
    prefix = (cfg or {}).get('categoryPrefix', {}).get(m.group(1)) if m else None
    s = m.group(2) if m else s
    if prefix:
        s = prefix[0].upper() + prefix[1:] + s
    s = re.sub(r'_(private|Private)$', '', s)
    s = re.sub(r'_revB$', '', s)  # Piano 5 firmware-revision suffix, not part of the meaning
    s = s.replace('_EOL', 'Eol')
    s = re.sub(r'_(\d+)$', r'\1', s)
    # lowerCamel, keeping acronyms readable: FMAlgorithm -> fmAlgorithm, PStick -> pStick.
    m = re.match(r'^([A-Z]+)(?=[A-Z][a-z])', s)
    if m:
        return m.group(1).lower() + s[len(m.group(1)):]
    return s[0].lower() + s[1:]


def encoding(row, lo, cfg):
    notes = row['notes']
    if 'NameHash' in row['name'] or (cfg.get('rawWords') and int(row['width']) == 32):
        return 'raw'
    if "two's complement" in notes or (lo < 0 and cfg.get('negatives') == 'twos'):
        return 'twos'
    if lo != 0:
        return 'offset'
    return 'u'


def ns3_rows(rows, cfg):
    """The ns3 dialect: `section` is the block, and the repeat row expands to slot B."""
    for r in rows:
        r['block'] = r['section']
    rep = cfg['repeat']
    marker = [r for r in rows if r['name'] == rep['row']]
    assert len(marker) == 1, rep
    src = [r for r in rows if r['block'].startswith(rep['from'])]
    start = min(body_bit(r) for r in src)
    span = max(body_bit(r) + int(r['width']) for r in src) - start
    assert span == int(marker[0]['width']), (span, marker[0]['width'])
    shift = body_bit(marker[0]) - start
    copies = []
    for r in src:
        c = dict(r)
        c['block'] = c['section'] = rep['to'] + r['block'][len(rep['from']):]
        c['bit_offset'] = str(int(r['bit_offset']) + shift)
        copies.append(c)
    return [r for r in rows if r is not marker[0]] + copies


def main():
    model_id, csv_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    cfg = MODELS[model_id]
    with open(csv_path, newline='') as fh:
        # Marker rows without a width (the e7 dialect's "[end of body]") carry no field.
        rows = [r for r in csv.DictReader(fh) if r['width']]
    if cfg.get('dialect') == 'ns3':
        rows = ns3_rows(rows, cfg)

    body_bytes = max((body_bit(r) + int(r['width']) + 7) // 8 for r in rows)
    block_rows = [r for r in rows if r['name'] == '[block length]']
    blocks = []
    for i, r in enumerate(block_rows):
        off = body_bit(r) // 8
        nxt = body_bit(block_rows[i + 1]) // 8 if i + 1 < len(block_rows) else body_bytes
        blocks.append({'name': r['block'], 'key': cfg['blocks'][r['block']], 'offset': off, 'length': nxt - off - 1})
        if cfg.get('dialect') == 'ns3':
            # The ns3 rows carry the length the firmware writes; the computed one must agree.
            assert blocks[-1]['length'] == int(r['default']), (r['block'], blocks[-1]['length'], r['default'])
    block_index = {b['name']: i for i, b in enumerate(blocks)}

    fields = []
    for r in rows:
        name = r['name']
        base, _, source = name.partition('@')
        msrc = cfg.get('morphSources', MORPH_SOURCES)
        morph = cfg.get('morphs') and source in msrc
        if r['block'].lower() == 'header' or name.startswith('[') or ('@' in name and not morph) \
                or SKIP_SUFFIX.search(name):
            continue
        b = block_index[r['block']]
        lo, hi = int(r['min']), int(r['max'])
        if morph:
            # delta + (max - min): the 'offset' encoding with min = -(max - min); the Wave 2's
            # Impulse buffer is an unsigned target (0 = off, else value - min + 1).
            assert lo == -hi or (lo == 0 and source == 'Impulse'), name
        pid = r.get('param_id') or ''
        if not pid:
            m = re.search(r'\bid (\d+)', r['notes'])
            pid = m.group(1) if m else ''
        fields.append({
            'key': f"{blocks[b]['key']}.{short_key(base, cfg)}" + (f'.{msrc[source]}' if morph else ''),
            'name': name, 'block': b,
            'bit': body_bit(r) - (blocks[b]['offset'] + 1) * 8,
            'width': int(r['width']), 'min': lo, 'max': hi,
            'def': int(r['default']) if r['default'] not in ('', None) else 0,
            'enc': ('offset' if lo < 0 else 'u') if morph else encoding(r, lo, cfg), 'confidence': cfg['confidence'](r),
            'src': cfg['source'] + (f' · id {pid}' if pid else '') + (f' · {source} morph' if morph else ''),
        })

    keys = [f['key'] for f in fields]
    dup = {k for k in keys if keys.count(k) > 1}
    if dup:
        sys.exit(f'duplicate keys: {sorted(dup)}')
    for f in fields:
        assert 0 <= f['bit'] and f['bit'] + f['width'] <= blocks[f['block']]['length'] * 8, f

    vr = cfg['versionRange']
    out = []
    out.append(f"// AUTO-GENERATED by scripts/gen-fw-program-maps.py ({model_id}) — DO NOT EDIT MANUALLY.")
    out.append("//")
    out.append(f"// Provenance: {cfg['source']}; {cfg['container']}.")
    out.append("// Static analysis of the firmware's own parameter registry. Knowledge only —")
    out.append("// parameter names, bit positions, ranges and defaults; no firmware bytes or")
    out.append("// tables (docs/LEGAL.md). Only high/medium-confidence fields are listed.")
    # TypeScript gives up on one array literal of more than ~1000 differently-keyed
    # objects (TS2590), so a long field list (the Wave 2 with its morph buffers) is
    # emitted in typed chunks and spread into the layout.
    chunks = [fields[i:i + FIELD_CHUNK] for i in range(0, len(fields), FIELD_CHUNK)] \
        if len(fields) > CHUNK_ABOVE else []
    out.append("import type { %sFwLayout } from '../clavia/block-chain';" % ('FwField, ' if chunks else ''))
    out.append("")
    out.append(f"export type {cfg['type']} =")
    for i, k in enumerate(keys):
        out.append(f"  | '{k}'" + (';' if i == len(keys) - 1 else ''))
    out.append("")
    out.append(f"export const {cfg['const']}: FwLayout<{cfg['type']}> = {{")
    out.append(f"  model: '{cfg['model']}',")
    out.append(f"  source: '{cfg['source']}',")
    out.append(f"  container: '{cfg['container']}',")
    out.append(f"  versionRange: {f'[{vr[0]}, {vr[1]}]' if vr else 'null'},")
    out.append(f"  bodyBytes: {body_bytes},")
    out.append("  blocks: [")
    for b in blocks:
        out.append(f"    {{ key: '{b['key']}', name: '{b['name']}', offset: {b['offset']}, length: {b['length']} }},")
    out.append("  ],")
    def field_line(f):
        return (f"    {{ key: '{f['key']}', name: '{f['name']}', block: {f['block']}, bit: {f['bit']}, "
                f"width: {f['width']}, min: {f['min']}, max: {f['max']}, def: {f['def']}, "
                f"enc: '{f['enc']}', confidence: '{f['confidence']}', src: '{f['src']}' }},")
    if chunks:
        out.append("  fields: [" + ', '.join(f'...FIELDS_{i}' for i in range(len(chunks))) + "],")
    else:
        out.append("  fields: [")
        out.extend(field_line(f) for f in fields)
        out.append("  ],")
    out.append("};")
    if chunks:
        # The chunks go in front of the layout that spreads them.
        at = out.index(f"export const {cfg['const']}: FwLayout<{cfg['type']}> = {{")
        lines = []
        for i, chunk in enumerate(chunks):
            lines.append(f"/** Fields {i * FIELD_CHUNK}–{i * FIELD_CHUNK + len(chunk) - 1} (see the generator's TS2590 note). */")
            lines.append(f"const FIELDS_{i}: readonly FwField<{cfg['type']}>[] = [")
            lines.extend(field_line(f)[2:] for f in chunk)
            lines.append("];")
            lines.append("")
        out[at:at] = lines
    with open(out_path, 'w') as fh:
        fh.write('\n'.join(out) + '\n')
    print(f'{model_id}: {len(blocks)} blocks, {len(fields)} fields, {body_bytes}-byte body -> {out_path}')


def legacy_key(name):
    """lowerCamel key from a descriptor label: 'LFO 1 Waveform' -> lfo1Waveform, 'param 14 (CC 33)' -> param14."""
    s = re.sub(r'\s*\([^)]*\)', '', name)
    s = re.sub(r'^perf ', '', s)
    words = [w for w in re.split(r'[^A-Za-z0-9]+', s) if w]
    out = []
    for i, w in enumerate(words):
        caps = re.fullmatch(r'[A-Z0-9]+', w) is not None
        if i == 0:
            out.append(w.lower() if caps else w[0].lower() + w[1:])
        else:
            out.append(w[0] + w[1:].lower() if caps else w[0].upper() + w[1:])
    return ''.join(out)


def ts_str(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


MORPH_LIST = re.compile(r'entries\[(\d+)\] \{param index (\d+)b, source (\d+)b, delta (\d+)b signed\}')
MORPH_NOTE = re.compile(
    r'morphable: (\d+) signed deltas of (\d+) bits \(sources ([0-9/]+)(?: = ([^;]*); descriptor mask (\d+)| in that order)\) '
    r'at stream bits (\d+)\.\.(\d+) precede the value')
MORPH_SOURCE_KEYS = {'Wheel': 'morphWheel', 'After Touch': 'morphAfterTouch', 'Ctrl Pedal': 'morphCtrlPedal'}


def note_deltas(base, notes):
    """The inline morph deltas a `morphable: ...` note describes, in stream order (they precede the value)."""
    m = MORPH_NOTE.search(notes)
    if not m:
        return []
    count, width, ids, names, mask, start, end = m.groups()
    count, width, start, end = int(count), int(width), int(start), int(end)
    ids = ids.split('/')
    assert len(ids) == count, notes
    assert width == base['width'] + 1 and start + count * width == end + 1 == base['bit'], (base['key'], notes)
    if names is not None:
        sources = [n.strip() for n in names.split('/')]
        assert len(sources) == count == bin(int(mask)).count('1'), notes
        named = [(f".{MORPH_SOURCE_KEYS[n]}", f"morph {n}", f"{n} morph") for n in sources]
    else:
        named = [(f"MorphDeltaSrc{n}", f"morph delta src{n}", f"morph src{n}") for n in ids]
    span = base['max'] - base['min']
    return [dict(base, key=base['key'] + suffix, name=f"{base['name']} {label}",
                 bit=start + i * width, width=width, min=-span, max=span, enc='twos', cc=None,
                 src=f"{base['src']} · {srcnote}", deltaOf=base['key'], delta=True, copy=False, **{'def': 0})
            for i, (suffix, label, srcnote) in enumerate(named)]


def main_legacy():
    """Legacy formatType-0 records: one LegacyLayout per record type (see the docstring)."""
    model_id, csv_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    cfg = MODELS[model_id]
    lead = cfg['dialect'] == 'lead'
    with open(csv_path, newline='') as fh:
        rows = list(csv.DictReader(fh))

    def bit_of(r):
        v = r['bit_offset'] if lead else r['stream_bit_offset']
        return int(v) if v not in ('', None) else None

    end_rows = [r for r in rows if r['name'] == '[end of program data]']
    data_start = cfg.get('dataStart') or f"file 0x{0x18 + cfg.get('versionBytes', 2):X}"
    out = [
        f"// AUTO-GENERATED by scripts/gen-fw-program-maps.py ({model_id}) — DO NOT EDIT MANUALLY.",
        "//",
        f"// Provenance: {cfg['source']}; {cfg['container']}.",
        "// Static analysis of the firmware's own parameter descriptors. Knowledge only —",
        "// parameter names, bit positions, ranges and defaults; no firmware bytes or",
        "// tables (docs/LEGAL.md). " + cfg.get('recordNote', f"`bit` is relative to the record data ({data_start})."),
        "import type { LegacyLayout } from '../clavia/legacy-record';",
    ]
    summary = []
    for rec in cfg['records']:
        blocks = rec['blocks']
        lists = rec.get('morphLists', {})
        mine = [r for r in rows if r['block'] != 'Header' and (blocks is None or r['block'] in blocks or r['block'] in lists)]
        stored = [r for r in mine if bit_of(r) is not None]
        data_bytes = max((bit_of(r) + int(r['bit_width']) + 7) // 8 for r in stored)
        if lists and end_rows:
            assert data_bytes == int(end_rows[0]['byte']), (data_bytes, end_rows[0]['byte'])
        if 'dataBytes' in cfg:
            assert data_bytes == cfg['dataBytes'], (data_bytes, cfg['dataBytes'])

        fields, morph_lists = [], []
        for i, r in enumerate(stored):
            name = r['name']
            if r['block'] in lists:
                if name == 'morph entry count':
                    m = MORPH_LIST.search(stored[i + 1]['name'])
                    assert m, stored[i + 1]['name']
                    entries, pbits, sbits, dbits = (int(x) for x in m.groups())
                    assert entries * (pbits + sbits + dbits) == int(stored[i + 1]['bit_width'])
                    morph_lists.append({
                        'set': lists[r['block']], 'countBit': bit_of(r), 'countWidth': int(r['bit_width']),
                        'maxEntries': entries, 'entryBit': bit_of(stored[i + 1]),
                        'paramBits': pbits, 'sourceBits': sbits, 'deltaBits': dbits,
                    })
                continue
            if name == '[reserved]' or 'reserved' in r['notes']:
                continue
            pid = r['param_id'] if lead else r['param_index']
            lo, hi = int(r['min']), int(r['max'])
            enc = encoding(r, lo, cfg)
            assert lo >= 0 or enc == 'twos', name
            cc = r['midi_cc'] if lead else r['ctl_id']
            label = re.match(r'label: ([^;(]+?)\s*(?:[(;]|$)', r['notes']) if cfg.get('labels') else None
            key = f"{blocks[r['block']]}.{legacy_key(name)}" if blocks else name
            field = {
                'key': key,
                'name': cfg.get('names', {}).get(key) or (label.group(1) if label else name),
                'id': int(pid), 'block': r['block'],
                'delta': (lead and r['morph'] == 'delta') or bool(cfg.get('morphRows') and re.search(r'\.morph\d$', name)),
                'copy': not lead and 'second copy' in r['notes'],
                'bit': bit_of(r), 'width': int(r['bit_width']), 'min': lo, 'max': hi,
                'def': int(r['default']) if r['default'] not in ('', None) else 0,
                'enc': enc, 'confidence': cfg['confidence'](r),
                'src': f"{cfg['source']} · {r['block']} {pid}",
                'cc': int(cc) if cc not in ('', None) else None,
            }
            if not lead:
                fields.extend(note_deltas(field, r['notes']))
            fields.append(field)
        by_key = {f['key']: f for f in fields}
        for f in fields:
            assert 0 <= f['bit'] and f['bit'] + f['width'] <= data_bytes * 8, f
            if f['delta'] and 'deltaOf' not in f:
                base = [g for g in fields if g['block'] == f['block'] and g['id'] == f['id'] and not g['delta']]
                assert len(base) == 1, f
                f['deltaOf'] = base[0]['key']
            if f.get('copy'):
                first = f['key'].replace('dup.', '.', 1)
                assert first != f['key'] and first in by_key, f
                f['copyOf'] = first
        keys = [f['key'] for f in fields]
        dup = {k for k in keys if keys.count(k) > 1}
        if dup:
            sys.exit(f'duplicate keys: {sorted(dup)}')

        out.append("")
        out.append(f"export type {rec['type']} =")
        for i, k in enumerate(keys):
            out.append(f"  | {ts_str(k)}" + (';' if i == len(keys) - 1 else ''))
        out.append("")
        out.append(f"export const {rec['const']}: LegacyLayout<{rec['type']}> = {{")
        out.append(f"  model: {ts_str(cfg['model'])},")
        out.append(f"  source: {ts_str(cfg['source'])},")
        out.append(f"  container: {ts_str(cfg['container'])},")
        out.append(f"  recordVersion: {rec['version'] if rec['version'] is not None else 'null'},")
        if 'versionBytes' in cfg:
            out.append(f"  versionBytes: {cfg['versionBytes']},")
        out.append(f"  dataBytes: {data_bytes},")
        if cfg.get('padBytes'):
            out.append(f"  padBytes: {cfg['padBytes']},")
        out.append("  fields: [")
        for f in fields:
            extra = (f", cc: {f['cc']}" if f['cc'] is not None else '') + \
                (f", deltaOf: {ts_str(f['deltaOf'])}" if 'deltaOf' in f else '') + \
                (f", copyOf: {ts_str(f['copyOf'])}" if 'copyOf' in f else '')
            out.append(
                f"    {{ key: {ts_str(f['key'])}, name: {ts_str(f['name'])}, id: {f['id']}, bit: {f['bit']}, "
                f"width: {f['width']}, min: {f['min']}, max: {f['max']}, def: {f['def']}, "
                f"enc: '{f['enc']}', confidence: '{f['confidence']}', src: {ts_str(f['src'])}{extra} }},")
        out.append("  ],")
        if morph_lists:
            out.append("  morphLists: [")
            for m in morph_lists:
                out.append(
                    f"    {{ set: {ts_str(m['set'])}, countBit: {m['countBit']}, countWidth: {m['countWidth']}, "
                    f"maxEntries: {m['maxEntries']}, entryBit: {m['entryBit']}, paramBits: {m['paramBits']}, "
                    f"sourceBits: {m['sourceBits']}, deltaBits: {m['deltaBits']} }},")
            out.append("  ],")
        sets = cfg.get('sets')
        if sets:
            pairs = {}
            for f in fields:
                prefix = f['key'].split('.')[0]
                shared = sets(prefix) if callable(sets) else sets.get(prefix, prefix)
                if shared != prefix:
                    pairs.setdefault(prefix, shared)
            out.append("  sets: {")
            for prefix, shared in pairs.items():
                out.append(f"    {prefix}: {ts_str(shared)},")
            out.append("  },")
        out.append("};")
        summary.append(f"{rec['const']} {len(fields)} fields/{data_bytes} bytes")
    with open(out_path, 'w') as fh:
        fh.write('\n'.join(out) + '\n')
    print(f"{model_id}: {', '.join(summary)} -> {out_path}")


if __name__ == '__main__':
    if MODELS[sys.argv[1]].get('kind') == 'legacy':
        main_legacy()
    else:
        main()
