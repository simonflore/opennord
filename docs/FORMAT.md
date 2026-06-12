# The `.ns4p` format — what we know, and how to add to it

The Nord Stage 4 stores a **program** as a binary `.ns4p` file (presets: `.ns4o`, `.ns4n`, `.ns4y`). A program is the full patch: which piano/sample, organ drawbars, synth oscillator/filter/envelopes, and effects — **referencing factory samples by id**, not embedding sample audio. That's why sharing a program is safe and small (`docs/LEGAL.md`).

## State of knowledge

- **Partially decoded already.** [ns4decode](https://ns4decode.netlify.app/) extracts "many of the parameters, but not all." Treat it as a reference for *what's possible*, and re-derive fields openly here.
- **The Stage 2/3 layout is fully documented** ([nord-documentation](https://chris55.github.io/nord-documentation/)). The Stage 4 is a relative — sections, bit-packing conventions, and the morph model rhyme with earlier models. Start there for structure, verify against real Stage 4 files.
- **The authoritative cross-check** is the Nord Stage 4 manual (Appendix — MIDI / parameter lists) plus listening to the hardware.

## How decoding works in this repo

`src/lib/ns4/parse.ts` reads a byte buffer and fills the `NS4Program` model incrementally. Each field is a small, testable step:

1. Identify the region for a parameter (offset / bit range) from a forum post, the manual, your own capture, or comparison of two files that differ by one knob.
2. Add the read to `parse.ts` with a comment citing the source.
3. Add a fixture-based test in `parse.test.ts`.
4. Record the offset in the table below so the next person doesn't redo it.

## Known fields

> Seed table — fill in as fields are decoded. Keep it honest: only list what's verified.

| Section | Field | Location (offset / bits) | Encoding | Source |
|---|---|---|---|---|
| Header | (magic / version) | TODO | — | — |
| Program | Name | TODO | ASCII | — |
| Piano | Model / type | TODO | enum | — |
| Synth | Oscillator type/category/wave | TODO | enum / index | ns4mcp NRPN 3/1–3/3 corroborates |
| Effects | … | TODO | — | — |

## Contributing a capture (no coding needed)

The single most useful thing a Stage 4 owner can do: **export a few programs you understand, and ones that differ by exactly one setting**, and attach them to an issue. Diffing two near-identical programs is how offsets get found. (Only share programs you're happy to make public — see `docs/LEGAL.md`.)
