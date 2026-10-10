#!/usr/bin/env python3
"""
sharc-boot-split — split an ADI SHARC+ (ADSP-SC58x / ADSP-2158x) boot stream into the
memory segments it loads, per core.

Nord's ARM firmware (unpacked with scripts/fw-unpack.py) carries the DSP programs it boots
as raw ADI boot streams (docs/NSP-FORMAT.md, "The DSP programs are in the image"). Each
stream is a chain of 16-byte block headers, all little-endian u32:

  block code   [31:24] signature (0xAC = core 1 stream, 0xAB = core 2 in Nord's images),
               [23:16] header checksum, [15:4] flags, [3:0] DMA code
               flags: 0x4000 FIRST, 0x8000 FINAL, 0x1000 IGNORE, 0x0800 INIT,
                      0x0100 FILL (no payload: `argument` is the fill word)
  target       destination byte address (multiprocessor space: core 1 L1 0x2824xxxx,
               core 2 L1 0x28A4xxxx, shared L2 0x2000xxxx)
  byte count   payload length (also the FILL length)
  argument     FIRST block: length of this stream; FILL: the fill value

followed by `byte count` payload bytes unless FILL. Every header's 16-bit XOR is the same
byte repeated (checked below). A Nord image holds two streams back to back (one per core).

Usage:
  python3 scripts/sharc-boot-split.py <unpacked-code.bin> <image-va-hex> <image-size-hex> <out_dir>
    e.g. ... firmware/<os>/p1-code-c0000000.bin 0xc044667c 0x28410 firmware/dsp0
  (base VA of the code image is 0xC0000000.)

Writes one .bin per loaded segment named <stream>-<target>.bin and a segments.json
index. Output is Clavia firmware: keep it in the gitignored firmware/ folder
(docs/LEGAL.md).
"""
import json
import struct
import sys
from pathlib import Path

FIRST, FINAL, IGNORE, INIT, FILL = 0x4000, 0x8000, 0x1000, 0x0800, 0x0100
CODE_BASE = 0xC0000000


def header_ok(hdr: bytes) -> bool:
    x = 0
    for (h,) in struct.iter_unpack('<H', hdr):
        x ^= h
    return (x >> 8) == (x & 0xFF)


def split(blob: bytes):
    """Yield (stream_index, signature, flags, target, count, argument, payload|None)."""
    o, stream = 0, -1
    while o + 16 <= len(blob):
        hdr = blob[o:o + 16]
        code, target, count, arg = struct.unpack('<4I', hdr)
        sig, flags = code >> 24, code & 0xFFF0
        if not header_ok(hdr):
            raise ValueError(f'bad header checksum at +{o:#x}')
        if flags & FIRST:
            stream += 1
        o += 16
        payload = None
        if not flags & FILL:
            payload = blob[o:o + count]
            o += count
        yield stream, sig, flags, target, count, arg, payload
    if o != len(blob):
        raise ValueError(f'trailing bytes: parsed to +{o:#x} of {len(blob):#x}')


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__)
        return 2
    code = Path(sys.argv[1]).read_bytes()
    va, size, out = int(sys.argv[2], 16), int(sys.argv[3], 16), Path(sys.argv[4])
    blob = code[va - CODE_BASE:va - CODE_BASE + size]
    out.mkdir(parents=True, exist_ok=True)
    index = []
    for stream, sig, flags, target, count, arg, payload in split(blob):
        entry = {'stream': stream, 'signature': f'{sig:#04x}', 'flags': f'{flags:#06x}',
                 'target': f'{target:#010x}', 'count': count}
        if flags & FILL:
            entry['fill'] = f'{arg:#010x}'
        elif flags & IGNORE or count == 0:
            entry['ignored'] = True
        else:
            name = f's{stream}-{target:08x}.bin'
            (out / name).write_bytes(payload)
            entry['file'] = name
        index.append(entry)
    (out / 'segments.json').write_text(json.dumps(index, indent=1))
    loaded = [e for e in index if 'file' in e]
    print(f'{len(index)} blocks, {len(loaded)} loaded segments, '
          f'{sum(e["count"] for e in loaded):#x} payload bytes -> {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
