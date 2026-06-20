# Architecture

OpenNord is a Web PWA (React + Vite) wrapped to iOS with Capacitor, so one codebase runs in the browser and as a native app — and the eventual MIDI work can use Web MIDI in the browser and a native CoreMIDI plugin on iOS.

## Three layers

```
        ┌─────────────────────────────────────────────┐
        │  UI (React)  — drop a file, browse library,   │
        │               chat, visualize a program       │
        └───────────────┬───────────────┬───────────────┘
                        │               │
        ┌───────────────▼──┐   ┌────────▼──────────────┐
        │  lib/ns4         │   │  lib/ai               │
        │  parse / model   │   │  NL search, explain,   │
        │  a .ns4p program │   │  "describe → patch"    │
        └───────────────┬──┘   └───────────────────────┘
                        │
        ┌───────────────▼───────────────────────────────┐
        │  lib/device (+ scripts/nord*.c, docs/PROTOCOL-RE) │
        │  enumerate / read / write / backup a Nord         │
        │  via WebUSB now (desktop); node-usb / DEXT later   │
        └──────────────────────────────────────────────────┘
```

- **`lib/ns4`** — the heart. A typed `NS4Program` model and a `.ns4p` parser/decoder. The format is decoded and validated (0-mismatch against ns4decode; see `docs/FORMAT.md`); each field stays traceable to a source.
- **`lib/ai`** — provider-pluggable. Ships a naive local ranker so the app works with zero config; the real implementation calls an LLM (default: Claude) to rank programs against a natural-language query, explain a patch, and translate intent into parameter targets. Keep it behind an interface so contributors can swap providers.
- **`lib/device`** — the **USB transfer client**, where the reverse-engineered vendor protocol (`docs/PROTOCOL-RE.md`, `scripts/nord*.c`) lands in the app: a pluggable `NordTransport` (`WebUsbTransport` for Chromium desktop now; node-usb / DriverKit later) under `session` → `transfer` (enumerate / read / write) and `backup` (`.ns4b`). CRC-16, opcodes, and partition/`{bank,slot}` addressing live here.
- **`lib/midi`** — `sysex.ts`, an experimental MIDI/SysEx scaffold. *Program transfer* turned out to be the vendor **USB** protocol above (not MIDI/SysEx), so this scaffold survives only for live CC/NRPN and the iOS-transfer retest (`docs/SYSEX-SPIKE.md`).

## Community library (Phase 1, server side — not in this scaffold yet)

The sharing layer (upload, search, rate, fork) needs a backend + storage. Deliberately **not** scaffolded here so the first cut can be a pure client that reads local files. When added, keep the rule from `docs/LEGAL.md`: store **programs**, never sample/library content.

## UI shell & routing

The app is a [TanStack Router](https://tanstack.com/router) tree with **hash
history** (`createHashHistory` in `src/router.tsx`) — hash URLs (`#/library`)
survive Capacitor's non-http origin on iOS, where path-based history would not.

A **screen = one route module** under `src/routes/` (a thin `createRoute`
wrapper) whose feature logic lives in `src/lib/<feature>/` (or a `src/components/<feature>/`
folder for view-only pieces). The root layout (`src/routes/root.tsx`) renders the
left `Rail` + an `<Outlet>`; shared cross-screen state lives in a provider
(`DeviceContext`, `LibraryContext`) composed in `src/App.tsx`, never drilled.

**To add a screen** — three compiler-checked edits:

1. Create `src/routes/<name>.tsx` exporting a `createRoute({ getParentRoute: () => rootRoute, path: '/<name>', component })`.
2. Add it to the `routeTree` in `src/router.tsx`.
3. Add a `{ to: '/<name>', label }` entry to `DESTS` (or `DEV_DESTS`) in `src/components/shell/Rail.tsx` — `NavTo` is the typed union of valid paths.

Deep links come for free: any route (e.g. `/library/$programId`) is shareable and
survives a reload. Keep components composed from `src/components/ui/` primitives,
and group related props into objects (see `LibraryView`'s `prefs` / `folder`)
rather than growing flat prop lists.

## Design principles

1. **Every decoded field is traceable.** A comment or `docs/FORMAT.md` entry says where the knowledge came from. The format must stay re-derivable by the next person. The decompiled NSM/NSE binary (`nsm_decomp/`, `nse_decomp/`) is a first-class oracle alongside third-party tools; cite the specific function or struct (e.g. `CElectro5::BankToCategories`) — see `docs/NSM-RE-WORKFLOW.md`.
2. **Hardware is optional.** Reading/sharing/AI all work with just a file. Device transfer is a bonus path, never a hard dependency — exactly the lesson from the Nord ecosystem ("review your programs without any download to the instrument").
3. **Provider-agnostic AI behind an interface.** No lock-in; cheap default model for search, smarter model for generation.
4. **Mobile-first.** It's a stage tool. Test at phone width.
