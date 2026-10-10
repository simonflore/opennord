#!/usr/bin/env python3
"""
sharcplus-image — build Ghidra-ready images of one SHARC+ core from a split boot stream.

Input is a directory written by scripts/sharc-boot-split.py and the stream (core) index.
SHARC+ L1 memory is little-endian and byte-addressed (core-local byte 0x240000-0x3fffff;
multiprocessor aliases 0x28240000 core 1, 0x28a40000 core 2). The Ghidra language
`SHARC:BE:32:SHARCplus` (packages/core/tools/ghidra-sharc) models it big-endian, so:

  code image  sw space, short-word address = byte / 2, base sw:0x120000.
              VISA code keeps its parcel order (most significant parcel first) and each
              16-bit parcel is byte-swapped.  The interrupt vector table at byte 0x240000
              (0x300 bytes, 48-bit ISA) stores each 48-bit word least significant byte
              first, so its 6-byte groups are reversed instead.
  data image  dm space, normal-word address = byte / 4, base dm:0x90000; each 32-bit word
              byte-swapped.

Import (headless):
  analyzeHeadless <proj> <name> -import <out>/code.sw.bin -processor SHARC:BE:32:SHARCplus \\
      -loader BinaryLoader -loader-baseAddr 0x120000 \\
      -preScript SharcPlusData.java   (env SHARCPLUS_DM=<out>/data.dm.bin)

Output is derived from Clavia firmware: keep it in the gitignored firmware/ folder
(docs/LEGAL.md).

Usage:
  python3 scripts/sharcplus-image.py <split_dir> <stream> <out_dir>
"""
import json
import sys
from pathlib import Path

L1_LO, L1_HI = 0x240000, 0x400000
IVT_LO, IVT_HI = 0x240000, 0x240300
MP_BASE = {0: 0x28000000, 1: 0x28800000}


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__)
        return 2
    split, stream, out = Path(sys.argv[1]), int(sys.argv[2]), Path(sys.argv[3])
    mem = bytearray(L1_HI - L1_LO)
    loaded = 0
    for seg in json.loads((split / 'segments.json').read_text()):
        if seg['stream'] != stream or 'file' not in seg:
            continue
        local = int(seg['target'], 16) - MP_BASE.get(stream, 0)
        if not L1_LO <= local < L1_HI:
            continue  # shared L2 / other memory: not part of the L1 images
        data = (split / seg['file']).read_bytes()
        mem[local - L1_LO:local - L1_LO + len(data)] = data
        loaded += len(data)

    code = bytearray(len(mem))
    code[0::2], code[1::2] = mem[1::2], mem[0::2]           # VISA: swap each parcel
    for o in range(IVT_LO - L1_LO, IVT_HI - L1_LO, 6):      # ISA vector table: reverse 6 bytes
        code[o:o + 6] = mem[o:o + 6][::-1]
    data = bytearray(len(mem))
    for k in range(4):                                       # dm: swap each 32-bit word
        data[k::4] = mem[3 - k::4]

    out.mkdir(parents=True, exist_ok=True)
    (out / 'code.sw.bin').write_bytes(code)
    (out / 'data.dm.bin').write_bytes(data)
    print(f'stream {stream}: {loaded:#x} L1 bytes -> {out}/code.sw.bin (sw:{L1_LO // 2:#x}), '
          f'{out}/data.dm.bin (dm:{L1_LO // 4:#x})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
