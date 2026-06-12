#!/usr/bin/env python3
"""
crack-checksum — reverse-engineer the Nord Stage 4 program checksum.

Each .ns4p file stores a 32-bit checksum at bytes 24..27 (param 025-1..028-8,
big-endian). Decoding the file is solved; *generating* a valid checksum is not,
and it's the one thing standing between OpenNord and a write/edit path (export a
program the Nord will actually load via Nord Sound Manager).

This tool attacks the checksum from a folder of real .ns4p files:

  1. CATALOGUE SWEEP (works with a single file)
     Tries every standard CRC-32 variant over every plausible byte range.
     Catches the easy case where Clavia used an off-the-shelf CRC.

  2. DIFFERENTIAL METHOD (needs >=2 files of the SAME payload length)
     XORing two equal-length messages' checksums cancels init AND xorout, so
     C1^C2 depends only on (M1^M2) and the polynomial+reflection. This recovers
     the polynomial even when init/xorout are non-standard custom values — the
     case a single-file sweep can never see. Minimal-diff pairs (export a
     program, nudge one knob, export again) are ideal.

  3. SOLVE init/xorout
     Once the polynomial+reflection are known, one full (message, checksum) pair
     pins down init and xorout.

Usage:
    python3 scripts/crack-checksum.py <folder-or-file> [<more> ...]
    python3 scripts/crack-checksum.py ~/NordPrograms/

Best corpus to feed it:
    - A full bank export (Nord Sound Manager → Backup), AND
    - A few minimal-diff pairs: export, change ONE parameter, export again.

When it finds the algorithm it prints reproducible parameters
(width / poly / init / refin / refout / xorout / range) ready to port to
lib/ns4/checksum.ts.
"""
from __future__ import annotations
import sys, os, glob
from itertools import product

CHECKSUM_LO, CHECKSUM_HI = 24, 28  # byte slice holding the stored checksum
PAYLOAD_START_DEFAULT = 28          # first payload byte after the header


# ------------------------------------------------------------------ helpers
def reflect(v: int, width: int) -> int:
    r = 0
    for i in range(width):
        if v & (1 << i):
            r |= 1 << (width - 1 - i)
    return r


def crc(buf: bytes, poly: int, init: int, refin: bool, refout: bool,
        xorout: int, width: int = 32) -> int:
    mask = (1 << width) - 1
    top = 1 << (width - 1)
    reg = init & mask
    for b in buf:
        if refin:
            b = reflect(b, 8)
        reg ^= (b << (width - 8)) & mask
        for _ in range(8):
            reg = ((reg << 1) ^ poly) & mask if (reg & top) else (reg << 1) & mask
    if refout:
        reg = reflect(reg, width)
    return (reg ^ xorout) & mask


# Standard CRC-32 catalogue (name, poly, init, refin, refout, xorout)
CATALOGUE = [
    ("CRC-32/ISO-HDLC (zlib)", 0x04C11DB7, 0xFFFFFFFF, True,  True,  0xFFFFFFFF),
    ("CRC-32/BZIP2",           0x04C11DB7, 0xFFFFFFFF, False, False, 0xFFFFFFFF),
    ("CRC-32/MPEG-2",          0x04C11DB7, 0xFFFFFFFF, False, False, 0x00000000),
    ("CRC-32/CKSUM (POSIX)",   0x04C11DB7, 0x00000000, False, False, 0xFFFFFFFF),
    ("CRC-32/JAMCRC",          0x04C11DB7, 0xFFFFFFFF, True,  True,  0x00000000),
    ("CRC-32/MEF",             0x741B8CD7, 0xFFFFFFFF, True,  True,  0x00000000),
    ("CRC-32/XFER",            0x000000AF, 0x00000000, False, False, 0x00000000),
    ("CRC-32C/ISCSI",          0x1EDC6F41, 0xFFFFFFFF, True,  True,  0xFFFFFFFF),
    ("CRC-32D/BASE91-D",       0xA833982B, 0xFFFFFFFF, True,  True,  0xFFFFFFFF),
    ("CRC-32Q/AIXM",           0x814141AB, 0x00000000, False, False, 0x00000000),
    ("CRC-32/AUTOSAR",         0xF4ACFB13, 0xFFFFFFFF, True,  True,  0xFFFFFFFF),
    ("CRC-32/CD-ROM-EDC",      0x8001801B, 0x00000000, True,  True,  0x00000000),
]


# ------------------------------------------------------------------ file io
def load_files(paths: list[str]) -> list[tuple[str, bytes]]:
    files: list[tuple[str, bytes]] = []
    seen: set[bytes] = set()
    exts = (".ns4p", ".ns4o", ".ns4n", ".ns4y", ".ns4l")
    expanded: list[str] = []
    for p in paths:
        if os.path.isdir(p):
            for ext in exts:
                expanded.extend(glob.glob(os.path.join(p, "**", f"*{ext}"),
                                          recursive=True))
        else:
            expanded.append(p)
    for fp in sorted(set(expanded)):
        try:
            data = open(fp, "rb").read()
        except OSError:
            continue
        if data[:4] != b"CBIN":
            continue
        if data in seen:          # skip byte-identical duplicates
            continue
        seen.add(data)
        files.append((os.path.basename(fp), data))
    return files


def stored_checksum(data: bytes) -> int:
    return int.from_bytes(data[CHECKSUM_LO:CHECKSUM_HI], "big")


def candidate_ranges(n: int) -> list[tuple[int, int]]:
    starts = [PAYLOAD_START_DEFAULT, 24, 20, 16, 12, 8, 4, 0]
    ends = [n, n - 4, n - 8]
    return [(s, e) for s in starts for e in ends if e > s]


# ------------------------------------------------------------------ stage 1
def catalogue_sweep(files: list[tuple[str, bytes]]) -> bool:
    print("\n[1] Catalogue sweep — standard CRC-32 variants over all ranges")
    name0, data0 = files[0]
    target0 = stored_checksum(data0)
    targets0 = {target0, int.from_bytes(data0[CHECKSUM_LO:CHECKSUM_HI], "little")}
    hits = []
    for (cname, poly, init, refin, refout, xo) in CATALOGUE:
        for (s, e) in candidate_ranges(len(data0)):
            for src_label, buf in (("raw", data0[s:e]),
                                   ("zeroed", _zeroed(data0)[s:e])):
                v = crc(buf, poly, init, refin, refout, xo)
                if v in targets0:
                    # confirm across every other file
                    if _confirm(files, cname, poly, init, refin, refout, xo, s, e, src_label):
                        hits.append((cname, poly, init, refin, refout, xo, s, e, src_label))
                        print(f"  *** MATCH (all files): {cname}  range[{s}:{e}] {src_label}")
    if not hits:
        print("  no standard variant reproduces the checksum.")
    return bool(hits)


def _zeroed(data: bytes) -> bytes:
    b = bytearray(data)
    b[CHECKSUM_LO:CHECKSUM_HI] = b"\x00\x00\x00\x00"
    return bytes(b)


def _confirm(files, cname, poly, init, refin, refout, xo, s, e, src_label) -> bool:
    for _, data in files:
        buf = (_zeroed(data) if src_label == "zeroed" else data)[s:e]
        if crc(buf, poly, init, refin, refout, xo) != stored_checksum(data):
            return False
    return True


# ------------------------------------------------------------------ stage 2
def differential(files: list[tuple[str, bytes]]) -> None:
    """Recover the polynomial from equal-length pairs, cancelling init/xorout."""
    print("\n[2] Differential method — recover polynomial from equal-length pairs")

    # group files by payload length for the default range
    by_len: dict[int, list[tuple[str, bytes]]] = {}
    for name, data in files:
        by_len.setdefault(len(data), []).append((name, data))

    pairs = [grp for grp in by_len.values() if len(grp) >= 2]
    if not pairs:
        print("  need >=2 files of identical byte-length. Export minimal-diff")
        print("  pairs: save a program, change ONE knob, save again.")
        return

    s = PAYLOAD_START_DEFAULT
    # Candidate polynomials: the catalogue's, plus their reflections.
    cand_polys = set()
    for (_, poly, *_rest) in CATALOGUE:
        cand_polys.add(poly)
        cand_polys.add(reflect(poly, 32))

    found_poly = None
    for grp in pairs:
        (n1, d1), (n2, d2) = grp[0], grp[1]
        e = len(d1)
        diff_target = stored_checksum(d1) ^ stored_checksum(d2)
        m1, m2 = d1[s:e], d2[s:e]
        for poly in sorted(cand_polys):
            for refin, refout in product((False, True), repeat=2):
                # init/xorout cancel in the difference → use init=0, xorout=0
                c1 = crc(m1, poly, 0, refin, refout, 0)
                c2 = crc(m2, poly, 0, refin, refout, 0)
                if (c1 ^ c2) == diff_target:
                    print(f"  polynomial candidate from ({n1} ^ {n2}): "
                          f"poly=0x{poly:08X} refin={refin} refout={refout}")
                    found_poly = (poly, refin, refout)
                    break
            if found_poly:
                break
        if found_poly:
            break

    if not found_poly:
        print("  no catalogue polynomial fits the differential.")
        print("  → the polynomial is fully custom (not a standard CRC-32).")
        print("    Recovering an arbitrary poly needs CRC RevEng's sieve:")
        print("      reveng -w 32 -s <hex-msg-1> <hex-msg-2> <hex-msg-3> ...")
        print("    Run scripts/crack-checksum.py --dump <folder> to emit the")
        print("    space-separated hex messages reveng expects.")
        return

    poly, refin, refout = found_poly
    solve_constant(files, poly, refin, refout, s)


def solve_constant(files, poly, refin, refout, s) -> None:
    """
    With poly+reflection known, fold init+xorout into a single constant K:

        checksum(M) = CRC0(M) XOR K      where CRC0 = crc(init=0, xorout=0)

    For fixed-length files (NS4 programs appear to be one fixed size) the
    init-register contribution is identical for every file, so K is a single
    constant and generation needs nothing more. If K varies with length we
    report per-length constants and flag that init must be solved separately.
    """
    print("\n[3] Fold init/xorout into generation constant K")

    def crc0(data: bytes) -> int:
        return crc(data[s:len(data)], poly, 0, refin, refout, 0)

    k_by_len: dict[int, int] = {}
    consistent = True
    for _, data in files:
        k = crc0(data) ^ stored_checksum(data)
        prev = k_by_len.setdefault(len(data), k)
        if prev != k:
            consistent = False

    if len(k_by_len) == 1 and consistent:
        (length, K), = k_by_len.items()
        _report_constant(poly, refin, refout, s, K, length, files)
    elif consistent:
        print("  K depends on file length (variable-length payloads):")
        for length, K in sorted(k_by_len.items()):
            print(f"    len={length:5d}: K=0x{K:08X}")
        print("  → solve init separately (different lengths give the equations);")
        print("    re-run including files of >=2 distinct lengths.")
    else:
        print("  K is NOT constant within a single length — model mismatch.")
        print("  the payload range or polynomial is wrong; feed more pairs.")


def _report_constant(poly, refin, refout, s, K, length, files):
    ok = all((crc(d[s:len(d)], poly, 0, refin, refout, 0) ^ K) == stored_checksum(d)
             for _, d in files)
    print("\n" + "=" * 62)
    print("  CHECKSUM ALGORITHM RECOVERED — generation ready")
    print("=" * 62)
    print(f"  width     = 32")
    print(f"  poly      = 0x{poly:08X}")
    print(f"  refin     = {refin}")
    print(f"  refout    = {refout}")
    print(f"  range     = bytes[{s}:{length}]   (payload after 28-byte header)")
    print(f"  constant  K = 0x{K:08X}   (init+xorout folded; fixed length)")
    print("-" * 62)
    print("  GENERATE:  checksum = CRC0(payload) XOR K")
    print("             where CRC0 = crc32(poly, init=0, "
          f"refin={refin}, refout={refout}, xorout=0)")
    print("-" * 62)
    print(f"  verified across {len(files)} file(s): {'PASS' if ok else 'FAIL'}")
    print("=" * 62)
    print("\n  → port to lib/ns4/checksum.ts and the write path is unlocked.")


# ------------------------------------------------------------------ main
def dump_for_reveng(files: list[tuple[str, bytes]], s: int = PAYLOAD_START_DEFAULT) -> None:
    """Emit payload+checksum as hex so CRC RevEng can solve an arbitrary poly.

    reveng treats the trailing 4 bytes as the CRC, so we append the stored
    big-endian checksum to each payload. Feed the output to:
        reveng -w 32 -s <line> <line> ...
    """
    print("# space-separated hex messages for: reveng -w 32 -s ...")
    for _, data in files:
        msg = data[s:len(data)] + stored_checksum(data).to_bytes(4, "big")
        print(msg.hex())


def main() -> int:
    flags = [a for a in sys.argv[1:] if a.startswith("-")]
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not args:
        print(__doc__)
        return 2
    files = load_files(args)
    if not files:
        print("No .ns4p (CBIN) files found.")
        return 1

    if "--dump" in flags:
        dump_for_reveng(files)
        return 0

    print(f"Loaded {len(files)} unique program file(s):")
    for name, data in files:
        print(f"  {name:40s} {len(data):5d} bytes  "
              f"checksum=0x{stored_checksum(data):08X}")

    if catalogue_sweep(files):
        print("\nDone — standard algorithm identified above.")
        return 0
    differential(files)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
