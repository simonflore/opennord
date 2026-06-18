# Multi-model support — design proposal

**Status:** proposal (not yet implemented). **Scope decision required before build.**

OpenNord is a Stage 4 companion. A recurring question is whether it should also
read **other Nord instruments** — chiefly the **Stage 2 / 2EX / 3** family — given
that substantial community research already documents those formats. This note is
the concrete plan for doing that: what's reusable, what the real cost is, and a
phased path that keeps the Stage 4 the flagship.

## TL;DR

- **Reading other instruments' *program files* is bounded, hardware-free work.**
  Our CBIN container layer is already model-agnostic; the cost is **one parameter
  map + model shape + fixtures per model**, derived from existing public research.
- **Device *transfer* for other instruments is out of scope** — it's separate
  reverse-engineering that needs the hardware in hand and shares nothing with the
  Stage 4 USB protocol. This proposal explicitly excludes it.
- Recommended first slice: **read-only Stage 3 program viewing**, built on a
  small `model`-dispatch refactor, with [ns3-program-viewer][n3v] as the test
  oracle (the same role ns4decode plays for the Stage 4).

## Prior art we'd build on

| Source | Covers | License | Role here |
|---|---|---|---|
| **[ns4decode][n4d]** | Stage **4** `.ns4p` + presets | MIT (no public source) | Our existing NS4 engine + oracle |
| **[nord-documentation][ndoc]** (Chris55) | Stage **2 / 2EX / 3** program layout | docs | **Facts** to re-derive an NS2/3 map from |
| **[ns3-program-viewer][n3v]** (Chris55) | Stage **2 / 2EX / 3** programs + bundles | **GPLv3** | Reference impl + **oracle** for NS2/3 |

`ns3-program-viewer` parses `.ns2p/.ns2s`, `.ns3f/.ns3y`, and the
`.ns2b/.ns2exb/.ns2pb/.ns2synthpb`, `.ns3b/.ns3fb/.ns3synthpb/.ns3sbundle`
bundles — but **not** the Stage 4, Electro, or Piano. So it is *complementary* to
our NS4 work, not overlapping: its value is as a Rosetta stone for the Clavia
family layout and as a ready-made oracle.

> **Licensing discipline (non-negotiable).** `ns3-program-viewer` is **GPLv3**;
> OpenNord is AGPL-3.0-or-later (compatible). Our standing rule — same as the
> ns4decode (MIT) port — is **re-derive from the documented facts of the layout,
> don't copy source.** Any NS2/3 map must be traceable to `nord-documentation`
> (or our own diffing) field by field, and `ATTRIBUTION.md` /
> `THIRD_PARTY_LICENSES.md` updated. See `docs/LEGAL.md`.

## What's already model-agnostic (reusable for free)

The **CBIN envelope is universal across every Clavia file** (Stage 2/3/4,
Electro, Piano, samples). We verified the Stage 4 header *against* Chris55's NS2/3
layout precisely because they're the same envelope (`docs/FORMAT.md`). These
modules work, or nearly work, on any Clavia file today:

| Module | Today | For other models |
|---|---|---|
| `bits.ts` — CBIN magic + file-type tag detection | NS4-labelled, format-generic | Reusable as-is |
| `checksum.ts` — CRC-32 over `bytes[0x2C:]` | "universal Clavia CBIN checksum" (`docs/FORMAT.md`) | Reusable as-is |
| `bundle.ts` — ZIP bundle reader (`fflate`) | Filters by extension, names from basenames | Reusable; add NS2/3 extensions |
| `name.ts` — name from filename | NS2/3/4 all store name in filename, not file | Reusable as-is |
| `slot.ts`, bank/location decode | From the shared header bytes | Reusable (verify NS2/3 bit widths) |

So roughly the **container layer is ~80% reusable**. The work is entirely in the
**body decode** below it.

## What's Stage-4-coupled (the actual work)

The body decode is 100% NS4-specific and lives in the generated tables:

- `offset-map.generated.ts` — the 406-param bit-location map (from ns4decode bitmaps).
- `values.generated.ts`, `morphs.generated.ts`, `deps.generated.ts`,
  `synth-analog.generated.ts` — the interpretation tables.
- `parse.ts` hardcodes `buildParamMap()` (NS4) and an NS4-shaped walk.
- `types.ts` — `NS4Program` is shaped to the Stage 4: **3 layers A/B/C**, the
  `Morphable<T>` (wheel/AT/pedal) system, NS4 sample refs.

NS2/3 differ structurally (slot/layer counts, morph sources, parameter set, bit
packing), so this is a **parallel map per model**, not a tweak.

## The abstraction: a `model` registry

Introduce a thin dispatch keyed on the file-type tag (already detected in
`bits.ts`) + CBIN version. The container layer stays shared; each model plugs in
its own map + interpreter + model-builder.

```ts
// src/lib/clavia/model.ts  (new, container-level)
export type ClaviaModel = 'ns4' | 'ns3' | 'ns2' /* | 'electro' | 'piano' */;

export interface ModelCodec<Program> {
  /** Tags this codec claims, e.g. ['ns4p','ns4l'] or ['ns3f','ns2p']. */
  readonly tags: readonly string[];
  /** Optional CBIN version gate (lo,hi inclusive), like NSM's CFileSpec. */
  readonly versionRange?: readonly [number, number];
  /** The body decoder: raw bytes (post-header) → that model's program object. */
  decode(bytes: Uint8Array): Program;
}

export function resolveCodec(bytes: Uint8Array): ModelCodec<unknown> | undefined;
```

- `parseClaviaFile(bytes)` reads the shared CBIN header, then routes to the codec
  whose `tags`/`versionRange` match — mirroring how **NSM's `CFileSpec` partition
  gate routes strictly by `{extension, type, versionLo..Hi}`** (`docs/NSP-FORMAT.md`).
- The **existing NS4 path becomes `ns4` codec** with **zero behavior change** —
  `parse.ts` is wrapped, not rewritten. This is the safety property: the refactor
  is provably inert against the NS4 fixtures before any NS3 code lands.
- Today's `Ns4FileKind` union generalizes to `{ model, kind }`.

Directory shape (NS4 files move under a model folder; container lifts to `clavia/`):

```
src/lib/clavia/        # shared: cbin header, checksum, bundle, name, model registry
src/lib/ns4/           # existing NS4 codec (unchanged behavior)
src/lib/ns3/           # new: ns3 map + interpreter + model builder + fixtures
```

(Exact move vs. re-export is an implementation detail; the constraint is **NS4
output is byte-identical before/after** — proven by the existing fixtures.)

## Stage 3 reading — milestones

Smallest useful unit first; each milestone independently shippable and testable.

1. **M0 — Container refactor (no new format).** Extract `clavia/` shared layer +
   `model` registry; wrap the NS4 decoder as the `ns4` codec. **Gate:** all
   existing NS4 fixtures pass byte-identical; `typecheck` + `npm test` green.
2. **M1 — NS3 recognition.** `parseClaviaFile` recognizes `.ns3f/.ns3y/.ns2p`,
   reads the shared header (name, bank/slot, version, checksum validity), returns
   `{ model: 'ns3', parsed: false }` with a clear "structured decode pending"
   warning. Bundles (`.ns3fb`, …) unzip via the existing reader. Real value
   already: identify + validate + inventory NS3 files and collections.
3. **M2 — NS3 offset map (the core cost).** Build `ns3/offset-map.ts` from
   `nord-documentation` — field by field, each traceable to a doc section (or our
   own one-knob diff), **re-derived, not copied** from the GPLv3 source. Validate
   raw reads against `ns3-program-viewer` output as the **oracle** (the NS3
   analogue of `ns4decode --rawdecimal`).
4. **M3 — NS3 model + interpretation.** An `Ns3Program` shape (2 slots × 2 layers
   for NS3; its own morph sources) + the interpretation tables (drawbars, piano
   models, FX). Pin with NS3 fixtures (real file + expected CSV), **0-mismatch vs
   the oracle**, exactly like the NS4 bar.
5. **M4 — UI.** The Library/inspector renders an `Ns3Program`. Most UI is
   model-shaped already; needs a model badge and graceful handling of fields a
   given model lacks.

Then **Stage 2 / 2EX** are largely M2–M3 deltas off NS3 (same docs, same oracle).

## File-type matrix (target)

| Ext | Model | Kind | Plan |
|---|---|---|---|
| `.ns4p/.ns4l` | ns4 | program | **Done** (becomes the `ns4` codec) |
| `.ns4o/.ns4n/.ns4y` | ns4 | preset | Existing sibling handling |
| `.nsmp4` | ns4 | sample | Header-only today (`sample.ts`); audio out of scope |
| `.npno` | piano | piano lib | **Blocked** — audio framing in firmware (`docs/NSP-FORMAT.md`) |
| `.ns3f/.ns3y` | ns3 | program | **This proposal** (M1–M4) |
| `.ns2p/.ns2s` | ns2 | program | Delta off NS3 |
| `.ns3b/.ns2b/.ns3fb/…` | ns3/ns2 | bundle | Existing ZIP reader + extensions |

## Out of scope: device transfer for other instruments

The Stage 4 USB work (`docs/PROTOCOL-RE.md`) is a **vendor USB bulk protocol
specific to the Stage 4**, RE'd and validated on Stage 4 hardware. It does **not**
generalize to the NS3:

- NS3 is an earlier generation and most likely uses a **different transfer
  mechanism** — plausibly MIDI SysEx, which the NS4 notably does *not* service
  (`docs/SYSEX-SPIKE.md`). We have **zero NS3 transfer RE and no NS3 hardware.**
- That is a from-scratch RE effort gated on owning the device — high cost, low
  leverage, and orthogonal to file reading.

**Therefore: file reading only. No device support for non-NS4 models in this
proposal.** Reading is hardware-free and stands on existing public research;
transfer is not.

## Effort & risk

| | Effort | Risk |
|---|---|---|
| M0 container refactor | Low | Low — fixtures prove NS4 unchanged |
| M1 recognition + bundles | Low | Low |
| M2 NS3 offset map | **Medium–High** | Medium — manual port; mitigated by the oracle |
| M3 model + interpretation | Medium | Medium — NS3 model shape differs from NS4 |
| M4 UI | Low–Medium | Low |
| Device transfer (excluded) | High + hardware | High — separate RE |

**Risks & mitigations**
- *GPLv3 contamination.* Re-derive from `nord-documentation`; oracle-test against
  the viewer's output, never lift its code. Per-field provenance in comments.
- *NS4 regression during refactor.* M0 is gated on byte-identical NS4 fixture
  output before any NS3 code is written.
- *Scope creep.* Each model is a self-contained codec; we can ship NS3 and stop,
  or never start, without touching the NS4 path.
- *Fixtures.* Needs real NS2/3 files. Community-sourced (programs only, never
  factory sample audio — `docs/LEGAL.md`); the viewer supplies expected output.

## Recommendation

Worth doing **if** broadening the community library to the large NS2/3 owner base
is a product goal — the format knowledge already exists, so the cost is porting +
fixtures, not new reverse-engineering. If we proceed, do **M0 + M1 first** (cheap,
low-risk, immediately useful for identifying/validating NS3 files and bundles),
then decide on M2+ once we see real NS3 files land. Keep the Stage 4 the flagship;
device transfer stays NS4-only.

[n4d]: https://ns4decode.netlify.app/
[ndoc]: https://chris55.github.io/nord-documentation/
[n3v]: https://github.com/Chris55/ns3-program-viewer
