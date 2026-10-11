# File checksums — SOLVED

Every Clavia CBIN file checked so far carries one checksum, and which one depends
only on the header type in byte `0x04`. Change any parameter (or, on a legacy file, any header
byte) and it goes stale; the Nord and Nord Sound Manager reject the file. Both are
implemented in [`src/lib/clavia/checksum.ts`](../src/lib/clavia/checksum.ts) and
[`src/lib/clavia/crc16.ts`](../src/lib/clavia/crc16.ts); `sealFileChecksum` /
`verifyFileChecksum` pick the right one. Every writer reseals with them: the Stage 4
writer (`ns4/writer.ts`) and the in-place program writers for the firmware-layout
formats (`clavia/layout-write.ts`, by model in `lib/program-write.ts`). Those reseal
only a file whose checksum already holds, so a model whose trailer is not yet
confirmed (below) is never given a checksum it might not use.

## NSM-era files (byte `0x04` = 1): CRC-32

```
checksum = crc32_iso_hdlc(bytes[0x2C:EOF])      // standard CRC-32, poly 0x04C11DB7,
                                                 // refin=refout=true, init/xorout 0xFFFFFFFF
stored as a little-endian u32 at bytes[0x18:0x1C]
```

- It **is** a standard CRC-32 (ISO-HDLC / zlib's `crc32`). It covers everything
  after the 44-byte `CBIN` header, from byte `0x2C` to EOF — the header itself is
  **not** covered — and is stored **little-endian** at `0x18`–`0x1B` (the
  parameter data is big-endian / MSB-first; only this stored field is LE).
- There is **no trailer**: the file ends with the body.
- It is the same for **every** NSM-era tag — `ns4p`, `ns3f`/`ns3l`/`ns3y`,
  `ns2p`/`ns2s`, `nlas`, `npno`, … — including a legacy record placed behind an
  NSM-era header (the record at `0x2C`, e.g. the 565-byte `.ns2p` or the 141-byte
  `.nlas`). Nord Sound Manager saves every file this way.
- The `Ns4` in `computeNs4Checksum` / `verifyNs4Checksum` / `patchNs4Checksum` is
  historical; they apply to every NSM-era file.

## Legacy files (byte `0x04` = 0): CRC-16 trailer

```
checksum = crc16_ccitt_false(bytes[0:len-2])     // poly 0x1021, init 0xFFFF,
                                                  // no reflection, no xorout
stored as a little-endian u16 in the last 2 bytes
```

- The CRC covers the **whole file** except its last two bytes — the 24-byte legacy
  header included, so a slot, category or version edit needs a reseal too.
- The body (or record) starts at `0x18`, right after the shorter header, and ends
  where the trailer begins: a legacy file is the NSM-era one minus 20 header bytes
  plus the 2-byte trailer (`.ns2p` 547 vs 565, `.ns3f` 574 vs 592).
- The same CRC-16 frames the USB transport (`device/protocol.ts`). The instrument
  firmware computes it MSB-first with polynomial 0x1021 from a table it builds at
  runtime (seen in the Electro 3 OS: no constant CRC table in the image).
- Confirmed on real Stage 2 / 3, Lead 4 / A1 and Wave files. Not yet checked on
  real Electro 3 / 4 / 5, C2 / C2D or Piano 2 / 3 files — and an early corpus
  reading of `.ne4p` files did not match it over `bytes[0:len-2]` — so for those
  models it is a strong guess, not a fact.

## Evidence

Both algorithms were checked against **1,350 real files** of both header types:
every file verifies with the algorithm its byte `0x04` selects. That includes the
public Stage 2 / 3 test corpus of ns3-program-viewer (`.ns2p`/`.ns2s`/`.ns2l`,
`.ns3f`/`.ns3l`/`.ns3y`, two NSM-era `.nlas`) and three real Stage 4 programs; the
trailer was first confirmed on Wave and Lead files (`crc16.ts`). The program
writers' tests reseal and re-verify every layout under both header types.

## History / tooling

The first analysis (a 4096-config CRC sweep on a single Stage 4 file) found no
match because it scanned the wrong byte range — which is why an earlier draft of
this doc concluded "non-standard, needs a differential solve." The differential
solve across three real programs then showed `crc32(bytes[44:])` reproduces the
stored value. `scripts/crack-checksum.py` (the differential cracker, validated
against a forged corpus) remains a useful tool for the next format.

Direct USB read/write to the keyboard is **also solved** (a separate vendor
protocol — see `docs/PROTOCOL-RE.md`), so an edited, resealed program can be
pushed straight to the device, not only imported via Nord Sound Manager.
