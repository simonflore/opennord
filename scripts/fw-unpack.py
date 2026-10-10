#!/usr/bin/env python3
"""
fw-unpack — unpack a Nord OS update image (`os.cab`) into its loadable sections.

Nord OS updates ship an `os.cab` (inside the public "Update Nord <model> OS" app /
installer). It is a Clavia Zevs cab: one or two *programs* (a `CBinFile` each),
every program a short list of sections loaded at fixed addresses. The big CODE
section is LZO1X-compressed — analysing the packed bytes as code is what made the
earlier firmware spikes find nothing (docs/MULTI-MODEL.md, docs/NSP-FORMAT.md).

Layout (all integers big-endian; verified on Nord Stage 4 OS v1.66, 2026-10):

  cab header      u32 off1, u32 size1, u32 off2, u32 size2   (program 2 optional)
  program header  @off: ... u32 section_count @+0x10, then count x 0x2C entries:
                  char name[4]; u32 offset (relative to the program); u32 size;
                  u32 load_addr; u32 checksum; u32 packed_size; u32 packed_checksum
  packed section  LZO1X stream of `packed_size` bytes (packed_size 0 = stored raw)
  checksums       ~(sum of all bytes) & 0xffffffff — of the unpacked data, and of
                  the packed stream for packed sections

Matches the updater's own symbols (`Zevs::CCabHeader`, `Zevs::CBinHeader`,
`Zevs::CSectionInfo::IsCompressed/GetCompressedSize/GetCompressedChecksum`). The
updater sends sections to the instrument as-is; the instrument unpacks them.

Output is Clavia's firmware: it goes to a local, gitignored folder (default
`firmware/<cab name>/`) and must never be committed or redistributed
(docs/LEGAL.md). This script itself contains no firmware.

Usage:
  python3 scripts/fw-unpack.py path/to/os.cab [out_dir]
"""
import struct
import sys
from pathlib import Path


def lzo1x_decompress(src: bytes, ip: int) -> tuple[bytearray, int]:
    """LZO1X decompressor (the stream format of minilzo's lzo1x_1 / lzo1x_999).
    Returns (output, end offset just past the 11 00 00 end marker)."""
    op = bytearray()

    def match(dist: int, length: int) -> None:
        if dist <= 0 or dist > len(op):
            raise ValueError(f'LZO1X: bad match distance {dist} at input {ip:#x}')
        start = len(op) - dist
        for k in range(length):  # byte-wise: matches may overlap their own output
            op.append(op[start + k])

    state = 0
    if src[ip] > 17:  # stream opening with a literal run
        t = src[ip] - 17
        ip += 1
        op += src[ip:ip + t]
        ip += t
        state = 4 if t >= 4 else t
    while True:
        t = src[ip]
        ip += 1
        if t < 16:
            if state == 0:  # literal run
                if t == 0:
                    while src[ip] == 0:
                        t += 255
                        ip += 1
                    t += 15 + src[ip]
                    ip += 1
                t += 3
                op += src[ip:ip + t]
                ip += t
                state = 4
                continue
            if state != 4:  # M1: 2-byte match right after 1-3 literals
                match(1 + (t >> 2) + (src[ip] << 2), 2)
            else:  # M1 after a literal run of >= 4
                match(1 + 0x800 + (t >> 2) + (src[ip] << 2), 3)
            ip += 1
            state = t & 3
        elif t >= 64:  # M2: distance <= 2 KiB
            match(1 + ((t >> 2) & 7) + (src[ip] << 3), (t >> 5) + 1)
            ip += 1
            state = t & 3
        elif t >= 32:  # M3: distance <= 16 KiB
            length = t & 31
            if length == 0:
                while src[ip] == 0:
                    length += 255
                    ip += 1
                length += 31 + src[ip]
                ip += 1
            v = src[ip] | (src[ip + 1] << 8)
            ip += 2
            match(1 + (v >> 2), length + 2)
            state = v & 3
        else:  # M4: distance 16-48 KiB, or the end marker
            length = t & 7
            if length == 0:
                while src[ip] == 0:
                    length += 255
                    ip += 1
                length += 7 + src[ip]
                ip += 1
            v = src[ip] | (src[ip + 1] << 8)
            ip += 2
            dist = ((t & 8) << 11) + (v >> 2)
            if dist == 0:
                return op, ip
            match(dist + 0x4000, length + 2)
            state = v & 3
        if state:  # 1-3 trailing literals carried in the low bits
            op += src[ip:ip + state]
            ip += state


def checksum(data: bytes) -> int:
    return ~sum(data) & 0xFFFFFFFF


def sections(cab: bytes, base: int):
    count = struct.unpack_from('>I', cab, base + 0x10)[0]
    for i in range(count):
        e = base + 0x14 + i * 0x2C
        name = cab[e:e + 4].decode('ascii', 'replace')
        off, size, load, csum, psize, pcsum = struct.unpack_from('>6I', cab, e + 4)
        yield name, base + off, size, load, csum, psize, pcsum


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cab_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('firmware') / cab_path.parent.name
    cab = cab_path.read_bytes()
    off1, size1, off2, size2 = struct.unpack_from('>4I', cab, 0)
    programs = [(off1, size1)] + ([(off2, size2)] if size2 else [])
    out_dir.mkdir(parents=True, exist_ok=True)
    ok = True
    for p, (base, _size) in enumerate(programs, 1):
        for name, fo, size, load, csum, psize, pcsum in sections(cab, base):
            if psize:
                packed = cab[fo:fo + psize]
                data, end = lzo1x_decompress(cab, fo)
                good = len(data) == size and end - fo == psize and checksum(data) == csum \
                    and checksum(packed) == pcsum
            else:
                data = cab[fo:fo + size]
                good = checksum(data) == csum
            ok &= good
            dest = out_dir / f'p{p}-{name.lower()}-{load:08x}.bin'
            dest.write_bytes(data)
            kind = f'LZO1X {psize:#x} -> {size:#x}' if psize else f'raw {size:#x}'
            print(f'program {p} {name} load {load:#010x}  {kind}  checksum {"OK" if good else "MISMATCH"}  -> {dest}')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
