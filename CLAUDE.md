# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this is

**OpenNord** — an open, AI-native companion for the **Nord® Stage 4**. It reads
`.ns4p` program/preset files in the browser (no keyboard or Nord Sound Manager
required), and aims to add a community patch library, AI search/explanation, and
direct USB transfer to/from the keyboard.

Status: **early — RE done, product being built.** The `.ns4p` format is decoded
and validated (0-mismatch vs ns4decode), and the Stage 4's **USB transfer protocol
is fully reverse-engineered and hardware-validated** (enumerate/read/write — see
`docs/PROTOCOL-RE.md`). The remaining work is the product layer (UI, community
library, AI). Read `docs/ROADMAP.md` for what's built vs. planned.

Web PWA (React 19 + Vite + TypeScript), wrapped to iOS with Capacitor, so one
codebase runs in the browser and as a native app.

## Commands

```bash
npm install        # install deps (a SessionStart hook runs this on Claude Code web)
npm run dev        # Vite dev server
npm test           # vitest run (the parser/decoder tests)
npm run test:watch # vitest watch
npm run typecheck  # tsc --noEmit — CI GATE, keep this green
npm run build      # tsc -b && vite build
npm run preview    # preview the production build
npm run cap:sync   # Capacitor sync (after adding an ios/ platform)
```

**Before committing, run `npm run typecheck` and `npm test`.** CI
(`.github/workflows/ci.yml`) runs `npm ci → typecheck → test` on every PR;
there is **no separate lint step** — `typecheck` is the quality gate.

Path alias: `@/` → `src/` (see `vite.config.ts`).

## Layout

| Path | What |
|---|---|
| `src/lib/ns4/` | `.ns4p` program model + parser + the byte/bit decode layer (the heart) |
| `src/lib/ai/` | AI-native search / explanation, provider-pluggable behind an interface |
| `src/lib/midi/` | **Experimental** SysEx capture/transfer to/from the Nord |
| `src/components/` | React UI (`DecodeInspector` is the in-browser RE tool) |
| `src/App.tsx`, `src/main.tsx` | App shell + entry |
| `docs/` | architecture, roadmap, format notes, SysEx spike, legal stance |
| `scripts/` | research tooling (e.g. `crack-checksum.py`) |

## How the decode layer works (`src/lib/ns4/`)

This is where most work happens. The format is *partially* known and is filled
in **incrementally, field by field, each traceable to a source.**

- **`bits.ts`** — low-level bit/byte reading; CBIN magic + file-type tag detection.
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

## Scope tips for agents

- The hard RE is done: the `.ns4p` format is decoded/validated and the device
  **USB transfer protocol** is fully reverse-engineered and hardware-validated
  (`docs/PROTOCOL-RE.md`; tools in `scripts/nord*.c`). It's a vendor USB bulk
  protocol, **not** MIDI SysEx — don't reintroduce the old "SysEx spike" framing.
  Device transfer is **desktop-only** (vendor USB is unreachable from iOS);
  `lib/midi` is for live CC/NRPN only.
- Most remaining work is **product** (visualize → AI → community library), not RE.
- Keep changes small and verifiable; prefer extending the decoder one traceable
  field at a time over large speculative rewrites.
