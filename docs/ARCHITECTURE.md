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
        │  USB transfer (scripts/nord*.c, docs/PROTOCOL-RE) │
        │  enumerate / read / write programs to a Nord      │
        │  via libusb / node-usb / WebUSB (desktop)         │
        └──────────────────────────────────────────────────┘
```

- **`lib/ns4`** — the heart. A typed `NS4Program` model and a `.ns4p` parser/decoder. The format is decoded and validated (0-mismatch against ns4decode; see `docs/FORMAT.md`); each field stays traceable to a source.
- **`lib/ai`** — provider-pluggable. Ships a naive local ranker so the app works with zero config; the real implementation calls an LLM (default: Claude) to rank programs against a natural-language query, explain a patch, and translate intent into parameter targets. Keep it behind an interface so contributors can swap providers.
- **`lib/midi`** — `sysex.ts`, an experimental MIDI/SysEx scaffold. *Program transfer* turned out to be a vendor **USB** protocol (not MIDI), fully reverse-engineered and hardware-validated — see `docs/PROTOCOL-RE.md` and the `scripts/nord*.c` tools; a desktop (WebUSB / node-usb) client is where that lands in the app. The SysEx scaffold survives only for the iOS-transfer retest (`docs/SYSEX-SPIKE.md`).

## Community library (Phase 1, server side — not in this scaffold yet)

The sharing layer (upload, search, rate, fork) needs a backend + storage. Deliberately **not** scaffolded here so the first cut can be a pure client that reads local files. When added, keep the rule from `docs/LEGAL.md`: store **programs**, never sample/library content.

## Design principles

1. **Every decoded field is traceable.** A comment or `docs/FORMAT.md` entry says where the knowledge came from. The format must stay re-derivable by the next person.
2. **Hardware is optional.** Reading/sharing/AI all work with just a file. Device transfer is a bonus path, never a hard dependency — exactly the lesson from the Nord ecosystem ("review your programs without any download to the instrument").
3. **Provider-agnostic AI behind an interface.** No lock-in; cheap default model for search, smarter model for generation.
4. **Mobile-first.** It's a stage tool. Test at phone width.
