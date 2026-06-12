# The program checksum — the write-path unlock

OpenNord can **read** any `.ns4p` program: all 406 parameters decode to
human-readable values. **Writing** a program the Nord will actually load is
gated by one unknown: the 32-bit checksum at bytes `24..27` (param
`025-1..028-8`, big-endian). Change any parameter and that checksum goes stale;
the Nord rejects the file on load.

Decoding the checksum is solved — we read it. **Generating** it is not. This
doc is the plan to crack it, and the tool that does the work.

## What we know

- The file is a Clavia `CBIN` container: `CBIN` magic + version + `ns4p` tag +
  a small header, then payload from byte 28.
- The checksum is a 32-bit value at bytes `24..27`, stored big-endian.
- It is **not** any standard CRC-32 variant over any plausible byte range — a
  4096-configuration sweep (every catalogue poly × init ∈ {0, FFFFFFFF} ×
  reflect × xorout ∈ {0, FFFFFFFF} × every start/end) over the one known file
  finds no match. Nor is it Adler-32 or a simple sum/xor.
- Conclusion: it is either a standard polynomial with **non-standard
  init/xorout**, or a fully custom polynomial.

## Why one file isn't enough

A custom CRC's `init`/`xorout` cannot be separated from a single message —
the problem is mathematically underdetermined. The standard attack is the
**differential method**: XOR two equal-length messages' checksums and the
`init` and `xorout` terms cancel, leaving a value that depends only on the
message difference and the polynomial. That recovers the polynomial — but it
needs **at least two files of the same length**.

`scripts/crack-checksum.py` implements this end-to-end and is validated against
a forged corpus (standard poly hidden behind deliberately weird
`init=0x12345678`, `xorout=0xCAFEBABE`): it recovers the polynomial from a pair
and reproduces the checksum on a brand-new program. See the self-test in the
commit that introduced this file.

## The generation model

NS4 program files appear to be a **fixed length**. When that holds, the
`init`-register contribution is identical for every file, so `init` and
`xorout` fold into a single constant `K`:

```
checksum(payload) = CRC0(payload) XOR K
        CRC0      = crc32(poly, init=0, refin=?, refout=?, xorout=0)
        K         = CRC0(any known file) XOR its stored checksum
```

So the full write path needs only:
1. **poly + reflection** — from the differential (≥2 equal-length files), and
2. **K** — from any single known-good file.

Both drop straight into `lib/ns4/checksum.ts`, and OpenNord can emit `.ns4p`
files that load via Nord Sound Manager.

## How to feed the cracker

```bash
python3 scripts/crack-checksum.py ~/NordPrograms/        # a folder, or
python3 scripts/crack-checksum.py a.ns4p b.ns4p c.ns4p   # explicit files
```

Best corpus, in priority order:

1. **Minimal-diff pairs** (most valuable): save a program, change **one** knob,
   save again. Several such pairs. Tiny differences make the differential
   cleanest.
2. **A full bank export** (Nord Sound Manager → Backup): dozens of real files,
   confirms `K` is constant and the model holds.

If the polynomial turns out to be fully custom (no catalogue match in the
differential), dump reveng-ready messages:

```bash
python3 scripts/crack-checksum.py --dump ~/NordPrograms/ > msgs.txt
reveng -w 32 -s $(cat msgs.txt)        # CRC RevEng sieves an arbitrary poly
```

## Status

- [x] Decode the stored checksum (read path) — done.
- [x] Rule out standard CRC / Adler / sum over the single fixture.
- [x] Differential solver + fixed-length `K` model — built and self-tested.
- [ ] Run against a real multi-file corpus from a Nord. **← needs your export.**
- [ ] Port recovered params to `lib/ns4/checksum.ts`.
- [ ] Wire checksum generation into the `.ns4p` writer; round-trip a file
      through Nord Sound Manager onto hardware.

Hardware transfer itself (USB) stays Nord Sound Manager's job — OpenNord
produces files Sound Manager imports. Direct USB read/write is a separate,
unsolved protocol and out of scope here.
