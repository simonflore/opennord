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
    sets `morphs` (the Stage 3): each becomes `<block>.<param>.morph<Source>`. A delta
    is one bit wider than its parameter and stored as `delta + (max - min)`, which is
    `value - min` with min = -(max - min), so it reads with the 'offset' encoding;
  - NOT parameters the firmware itself marks obsolete, shadow, requested or
    dirty (editor state, not sound).

Usage (from packages/core):
    python3 scripts/gen-fw-program-maps.py grand    <grand-offsets.csv>        src/lib/ng/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py piano-6  <piano-6-offsets.csv>      src/lib/np6/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py electro-7 <electro-7-offsets.csv>   src/lib/ne7/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py organ-3  <organ-3-offsets.csv>      src/lib/no3/layout.generated.ts
    python3 scripts/gen-fw-program-maps.py stage-3  <ns3-offsets.csv>          src/lib/ns3/layout.generated.ts
"""
import csv
import re
import sys

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
        morph = cfg.get('morphs') and source in MORPH_SOURCES
        if r['block'].lower() == 'header' or name.startswith('[') or ('@' in name and not morph) \
                or SKIP_SUFFIX.search(name):
            continue
        b = block_index[r['block']]
        lo, hi = int(r['min']), int(r['max'])
        if morph:
            assert lo == -hi, name  # delta + (max - min): the 'offset' encoding with min = -(max - min)
        pid = r.get('param_id') or ''
        if not pid:
            m = re.search(r'\bid (\d+)', r['notes'])
            pid = m.group(1) if m else ''
        fields.append({
            'key': f"{blocks[b]['key']}.{short_key(base, cfg)}" + (f'.{MORPH_SOURCES[source]}' if morph else ''),
            'name': name, 'block': b,
            'bit': body_bit(r) - (blocks[b]['offset'] + 1) * 8,
            'width': int(r['width']), 'min': lo, 'max': hi,
            'def': int(r['default']) if r['default'] not in ('', None) else 0,
            'enc': encoding(r, lo, cfg), 'confidence': cfg['confidence'](r),
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
    out.append("import type { FwLayout } from '../clavia/block-chain';")
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
    out.append("  fields: [")
    for f in fields:
        out.append(
            f"    {{ key: '{f['key']}', name: '{f['name']}', block: {f['block']}, bit: {f['bit']}, "
            f"width: {f['width']}, min: {f['min']}, max: {f['max']}, def: {f['def']}, "
            f"enc: '{f['enc']}', confidence: '{f['confidence']}', src: '{f['src']}' }},")
    out.append("  ],")
    out.append("};")
    with open(out_path, 'w') as fh:
        fh.write('\n'.join(out) + '\n')
    print(f'{model_id}: {len(blocks)} blocks, {len(fields)} fields, {body_bytes}-byte body -> {out_path}')


if __name__ == '__main__':
    main()
