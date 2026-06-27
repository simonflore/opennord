# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this is

**OpenNord** — an open, AI-native companion for **Nord® keyboards**, reading
program/preset files in the browser (no keyboard or Nord Sound Manager required)
and adding a community patch library, AI search/explanation, and direct USB
transfer to/from the instrument. The architecture is **family-wide**: one shared
CBIN container and one shared vendor-USB transport run the whole Nord line, and
`src/lib/clavia/` already carries a full-line model/partition registry
(`docs/NORD-PRODUCT-LINE.md`). **The Nord Stage line is what we cover first** —
Stage 2 / 3 / 4 files read through the shared model-codec seam
(`docs/MULTI-MODEL.md`); other families (Electro, Piano, Lead, …) are mapped and
next. Don't re-frame this as a Stage-4-only tool: Stage 4 is the *most complete*
model, not the only one.

Status: **early — RE done, product being built.** The Stage 4 `.ns4p` format is
decoded and validated (0-mismatch vs ns4decode); Stage 2/3 read via their own
codecs. The Stage 4's **USB transfer protocol is fully reverse-engineered and
hardware-validated** (enumerate/read/write — see `docs/PROTOCOL-RE.md`); a WebUSB
client + a read-only "Check my Nord" probe are built (`src/lib/device/`). The
remaining work is the product layer (Library UI, community library, AI). Read
`docs/ROADMAP.md` for what's built vs. planned.

Web PWA (React 19 + Vite + TypeScript), wrapped to iOS with Capacitor, so one
codebase runs in the browser and as a native app.

## Commands

```bash
npm install        # install deps (a SessionStart hook runs this on Claude Code web)
npm run dev        # Vite dev server
npm test           # vitest run (the parser/decoder tests)
npm run test:watch # vitest watch
npm run typecheck  # tsc --noEmit — CI GATE
npm run lint       # eslint + stylelint — CI GATE (stylelint enforces tokens.css: no hardcoded hex)
npm run lint:fix   # eslint --fix + stylelint --fix
npm run build      # tsc -b && vite build
npm run preview    # preview the production build
npm run fixtures:scan # auto-RE harness over the local (gitignored) corpus
npm run cap:sync   # Capacitor sync (after adding an ios/ platform)
```

**Before committing, run `npm run typecheck`, `npm run lint`, and `npm test`.** CI
(`.github/workflows/ci.yml`) runs `npm ci → typecheck → lint → test` on every PR;
all three are quality gates — keep them green.

Path alias: `@/` → `src/` (see `vite.config.ts`).

## Layout

| Path | What |
|---|---|
| `src/lib/clavia/` | the shared, model-agnostic container: CBIN header (`cbin.ts`), checksum, name/slot/category, `nord-file.ts` identifier, the `ModelCodec` registry (`model.ts`), and the capability/partition tables for the whole Nord line |
| `src/lib/ns4/` | the **Stage 4** `.ns4p` body codec — model + parser + bit/byte decode (the heart), plus the `.nsmp`/`.nsmp4` sample codec family (NW1 + OG encode, WAV import) |
| `src/lib/ns3/`, `src/lib/ns2/` | Stage 3 / Stage 2 body decoders + factory-library catalogs (Tier 2, `docs/MULTI-MODEL.md`) |
| `src/lib/device/` | WebUSB device layer: transport → session → transfer (read/write), backup, hardware probe/report |
| `src/lib/folder/`, `src/lib/library/` | local-folder scan/classify/index → the unified **Library** model |
| `src/lib/ai/` | AI-native search / explanation, provider-pluggable behind an interface |
| `src/lib/midi/` | **live CC/NRPN only** — *not* device transfer (that's vendor USB in `device/`) |
| `src/components/`, `src/routes/` | React UI + TanStack routes (`/library`, `/samples`, `/device`, `/compatibility`, `/dev/inspect`, `/dev/decode`). `DecodeInspector` is the in-browser RE tool (`/dev`) |
| `src/App.tsx`, `src/main.tsx`, `src/router.tsx` | App shell + entry + routes |
| `docs/` | architecture, roadmap, format notes, USB protocol, multi-model, legal stance |
| `scripts/`, `src/dev/` | RE/protocol tooling (`nord*.c`, `crack-checksum.py`) + the dev-only fixtures-corpus Vite plugin |

## How the decode layer works

A file is read **container-first, then body**. `src/lib/clavia/` owns the shared
CBIN envelope (magic/tag/header in `cbin.ts`, checksum, name/slot/category) and the
`ModelCodec` registry (`model.ts`); `parseClaviaFile()` reads the header once and
routes to the codec whose tags/version match — Stage 4 → `ns4/`, Stage 3 → `ns3/`,
Stage 2 → `ns2/`. Dependency direction is **model → clavia**, never the reverse.
Adding a model is one codec entry; the container layer doesn't change. See
`docs/MULTI-MODEL.md`.

### The Stage 4 body codec (`src/lib/ns4/`)

This is where most work happens. The format is *partially* known and is filled
in **incrementally, field by field, each traceable to a source.**

- **`bits.ts`** — low-level bit/byte reading of the Stage 4 program *body* (the
  shared CBIN magic/tag/header now lives in `clavia/cbin.ts`).
- **`maps.ts`** — `buildParamMap()` assembles the `Param[]` map from the generated
  offset/name data. A `Param` has a bit location, a group (`m`/`o`/`p`/`y` =
  master/organ/piano/synth), and layer info.
- **`coverage.ts`** — the gap-finding workflow: `decodeAllParams`, `diffBytes`,
  `claimedByteSet`, `gapRanges`, `coveragePercent`. Export a program, change ONE
  knob on the Nord, re-export, and `diffBytes` lights up exactly the moved bytes.
- **`interpret.ts`** — `interpretValue(paramId, name, raw)` turns a raw field into
  a human value (dB, enum label, etc.), backed by the generated value tables.
- **`parse.ts`** — `parseNs4Program(bytes)` → `NS4Program`. Currently recognizes +
  classifies the file; structured section decode into the model is still being
  wired from the offset map. Records unknowns in `warnings`.
- **`types.ts`** — the target `NS4Program` schema (layers A/B/C, the pervasive
  `Morphable<T>` system, `Ns4SampleRef` by id). Fields fill in as the parser grows.

### `*.generated.ts` — do not hand-edit

`offset-map`, `values`, `morphs`, `names`, `deps`, `interpret` are **generated**
(ingested/derived from ns4decode's bitmaps and interpreter — see `ATTRIBUTION.md`
and `docs/FORMAT.md`). Treat them as data, not source. Don't manually edit them;
regenerate from the upstream source if the knowledge changes, and keep every
decoded field traceable.

## Tests

`vitest`, colocated as `*.test.ts` (`parse.test.ts`, `bits.test.ts`). The
regression fixtures in `src/lib/ns4/__fixtures__/` are a real `.ns4p` plus
expected CSVs per engine (organ/piano/synth/master) — they pin decoder output so
interpretation changes stay validated against actual hardware data (0 mismatch is
the bar). When extending the decoder, validate against the fixture.

## Working principles (from `docs/ARCHITECTURE.md`)

1. **Every decoded field is traceable.** A comment or a `docs/FORMAT.md` entry
   says where the knowledge came from. The format must stay re-derivable.
   Traceability source includes the **decompiled NSM/NSE binary**
   (`nsm_decomp/`, `nse_decomp/`) as a first-class oracle alongside third-party
   tools — cite the specific function/struct (e.g.
   `CElectro5::BankToCategories`). See `docs/NSM-RE-WORKFLOW.md`.
2. **Hardware is optional.** Reading / sharing / AI all work from just a file;
   device transfer is a bonus path, never a hard dependency.
3. **Provider-agnostic AI behind an interface** (`ProgramRanker` in
   `lib/ai/search.ts`). Ships a zero-config naive ranker; the real impl calls an
   LLM (default: Claude, via `ai` + `@ai-sdk/anthropic`). Don't lock the UI to a
   provider.
4. **Mobile-first.** It's a stage tool — test at phone width.

## Legal guardrails (`docs/LEGAL.md`) — important

- OpenNord shares **user-created programs only, never Nord's sample/library
  content.** Programs reference factory samples by id (`Ns4SampleRef.id`); they
  never embed audio. Keep it that way in any sharing/library feature.
- Not affiliated with Clavia DMI AB / Nord Keyboards. "Nord" is used only to
  describe compatibility.
- License is **AGPL-3.0-or-later**; ported code (ns4decode, MIT) is credited in
  `THIRD_PARTY_LICENSES.md` / `ATTRIBUTION.md`. Preserve attribution.
- **Server/hosted backends are out of scope for this repo.** This is the open
  client. Keep networked services behind an interface (e.g. `ProgramRanker`);
  don't add backend/server code here.

## Scope tips for agents

- The hard RE is done: the `.ns4p` format is decoded/validated and the device
  **USB transfer protocol** is fully reverse-engineered and hardware-validated
  (`docs/PROTOCOL-RE.md`; tools in `scripts/nord*.c`). It's a vendor USB bulk
  protocol, **not** MIDI SysEx — don't reintroduce the old "SysEx spike" framing.
  Device transfer rides vendor USB: reachable from **desktop** (WebUSB/node-usb)
  and a **native iPad app (M1+, USBDriverKit DEXT)** — not iPhone, not any PWA, not
  SysEx (`docs/SYSEX-SPIKE.md`). `lib/midi` is for live CC/NRPN only.
- Most remaining work is **product** (visualize → AI → community library), not RE.
- **Think family, not just Stage 4.** Shared code goes in `src/lib/clavia/`
  (container, registry, capability/partition tables for the whole line); model
  bodies are per-generation codecs (`ns4/`, `ns3/`, `ns2/`) that plug into the
  `ModelCodec` seam. The dependency direction is **model → clavia**, never the
  reverse. Reading expands across the line file-by-file (`docs/MULTI-MODEL.md`);
  device transfer is Stage-4-validated, though the USB transport is shared
  line-wide (`docs/NORD-PRODUCT-LINE.md`).
- Keep changes small and verifiable; prefer extending the decoder one traceable
  field at a time over large speculative rewrites.

## Design Context

Guides all UI/UX work. The design system is **Studio Dark**, defined in
`src/styles/tokens.css` (the single source of truth — never hardcode a color;
route everything through a `var(--…)` token) and composed from the primitives in
`src/components/ui/`. Spec + plan: `docs/superpowers/{specs,plans}/2026-06-14-ui-redesign*`.

### Users
Nord players — gigging/practicing musicians, not engineers (Nord Stage owners
first, the wider Nord family as coverage grows). Two co-equal
jobs, both first-class: **browse/understand/organize patches** (the unified
Library is home) and **manage the keyboard** (transfer, backup, samples). It's a
stage tool: design mobile-first for reading/browsing; device transfer is a
desktop/iPad-only bonus path (vendor-USB), never a hard dependency.

### Brand Personality
**Confident & precise** — reads like a pro instrument: trustworthy, exact,
premium. Slightly Nord-inspired (the italic red "Nord" mark, the single Nord red
`--red #e0202e` accent on near-black), modern, not skeuomorphic. Speak the
**musician's language**: never surface protocol/engineer jargon (bytes, opcodes,
raw bank/slot numbers) in product UI — translate to what a player understands.

### Aesthetic Direction
Dark, instrument-front-panel feel: near-black surfaces, one red accent, generous
hierarchy and whitespace, focus over density. Dark-only for now, but built on
tokens so a light theme is a second `[data-theme]` block, not a rewrite.
**Anti-references:** Nord Sound Manager (dense, dated, wall-of-rows desktop UI we
are explicitly beating) and generic SaaS/admin-dashboard chrome. Accessibility is
part of "precise": real labels (`aria-label`/`aria-current`), keyboard-operable
controls, and token colors that meet contrast on dark surfaces.

### Design Principles
1. **One token source.** Every color/space/radius/type step comes from
   `tokens.css`. A hardcoded hex in a component is a review failure (rare,
   intentional one-offs like LCD blues are the documented exception).
2. **Speak musician, not protocol.** Hide the machine; show the sound. If a label
   reads like the RE notes, rewrite it.
3. **Two equal front doors.** Patch exploration and device management are both
   first-class; don't let one become a second-class tab.
4. **Composed, not bespoke.** Build screens from `src/components/ui/` primitives;
   reach for a new primitive before re-styling inline.
5. **Calm and legible on a dark stage.** Whitespace and hierarchy over density;
   readable at phone width; the instrument's job is the music, not the UI.
