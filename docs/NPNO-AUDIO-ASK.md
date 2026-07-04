# `.npno` piano audio — community-RE ask

**Status:** the `.npno` (CNSP) **container and metadata are decoded**; the **audio
sample body is not**, and it is blocked in a way this project cannot cheaply
break alone. This doc states exactly what is known, why it's blocked, and the
one artifact a contributor could provide to unblock it.

## What `.npno` is

A Nord Piano library file — the sampled acoustic/electric piano instruments the
Nord Piano / Stage / Grand load. Container tag `CNSP`, CBIN-framed like the rest
of the line. A single `.npno` is large (12–30 MB in the corpus) because it holds
the multi-velocity, multi-note sample set for one piano.

## What is already decoded (works today)

`src/lib/ns4/nsp.ts` reads the CNSP header/metadata via
`CNSPFileInputStream::PopulateMetaData` (transcribed from NSM):

- name, version, key range, sample-set structure
- the library-slot / model id (the same id space `np4`/`np5` programs reference,
  resolved to names via `PIANO_NAMES`)

This is enough to **identify, list, organize, back up and reference** pianos —
which is what the product needs for the library/device layers. Reading a piano's
audio is only required to *play* it in-app, which is a bonus, not a dependency.

## Why the audio body is blocked

The `.npno` audio is stored in Nord's **NW1 sample codec**, and — unlike the
`.nsmp` sample codec, which this project owns end-to-end (read + write, byte-exact
round-trips) — the piano codec's decode path lives **DSP-side**:

- The NW1 audio decode runs on the instrument's separate DSP chips (a different
  ISA from the ARM main CPU), not in the host-readable firmware.
- The **coefficient table** the decoder needs is **absent from every firmware
  image** this project has extracted — including the Nord Piano's own `os.cab`.
  It is loaded to DSP RAM at boot ("DSP Boot") and never appears in flash.
- Firmware RE is therefore a dead end here: there is no in-flash table to
  transcribe and no host-side code path to follow. (See the firmware-RE handoff
  and the memory notes `npno-codec-not-the-gap` and `stage4-firmware-re`.)

The codec itself was never the blocker — the project already owns NW1 both ways
for `.nsmp`. The blocker is specifically the **piano coefficient table / DSP
decode**, which is not present in any artifact on hand.

## What would unblock it

One of the following, contributed by someone with the right access:

1. **The NW1 piano coefficient table** dumped from DSP RAM on a running
   instrument (JTAG, a DSP RAM capture, or an instrumented boot), **or**
2. **A community piano-RE drop** — anyone who has already reverse-engineered the
   `.npno` audio decode (the sample-editor / rompler community is the likely
   source), **or**
3. **A DSP firmware image that actually contains the coefficient table** (none
   of the images collected so far do).

With any of these, wiring the decode into the existing `nsp.ts` reader is
straightforward — the container side is done.

## What NOT to spend effort on

- **Static firmware RE of any model's `os.cab`** for the piano codec — proven
  empty of the coefficient table across all collected images.
- **Treating the codec as the gap** — it isn't; the missing data is the DSP
  coefficient table, not the algorithm framing.

See also: `docs/ROADMAP.md`, `docs/FORMAT.md`.
