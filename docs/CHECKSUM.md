# The program checksum — SOLVED

Writing a `.ns4p` the Nord will load requires a valid checksum: a 32-bit value at
bytes `24..27`. Change any parameter and it goes stale, and the Nord (and Nord
Sound Manager) reject the file. **This is solved** and implemented in
[`src/lib/ns4/checksum.ts`](../src/lib/ns4/checksum.ts); the `.ns4p` writer emits
correct checksums and round-trips through Nord Sound Manager.

## The algorithm

```
checksum = crc32_iso_hdlc(bytes[44:])           // standard CRC-32, poly 0x04C11DB7,
                                                 // refin=refout=true, init/xorout 0xFFFFFFFF
stored little-endian at bytes[24:28]
```

- It **is** a standard CRC-32 (ISO-HDLC / zlib's `crc32`) — the trick was the
  *range and endianness*: it covers the parameter section from **byte 44** to EOF
  (the 44-byte `CBIN` header is excluded), and is stored **little-endian** at
  24–27 (note: the parameter *data* is big-endian; only this stored field is LE).
- Confirmed by differential analysis across **three** real programs:
  `crc32(bytes[44:])` reproduces the stored value for every one.

## History / tooling

The first analysis (a 4096-config CRC sweep on a single file) found no match
because it scanned the wrong byte range — which is why an earlier draft of this
doc concluded "non-standard, needs a differential solve." `scripts/crack-checksum.py`
(the differential cracker, validated against a forged corpus) remains a useful
tool for the next format, but the NS4 answer turned out to be the standard CRC-32
above once the `bytes[44:]` range was found.

## Status

- [x] Decode the stored checksum (read path).
- [x] Crack the generation algorithm (CRC-32/ISO-HDLC over `bytes[44:]`, LE @ 24).
- [x] Implemented in `lib/ns4/checksum.ts` (+ tests) and wired into the writer.
- [x] Validated across three real programs.

Direct USB read/write to the keyboard is **also solved** now (a separate vendor
protocol — see `docs/PROTOCOL-RE.md`), so a forged-then-checksummed `.ns4p` can be
pushed straight to the device, not only imported via Nord Sound Manager.
