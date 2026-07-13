# OpenNord

**An open companion for Nord® keyboards** — starting with the **Nord Stage** line. Read and organize your programs, play your samples on-screen or from a MIDI keyboard, and talk to your Nord directly over USB — no desktop app required.

> Status: **early — the reverse-engineering is done, the product is being built.** OpenNord is family-wide by design: one shared file container and one shared USB transport run the whole Nord line (`src/lib/clavia/` carries a full-line model registry). The **Nord Stage series comes first** — Stage 2 / 3 / 4 files read today, and **Stage 4** is decoded and validated (0-mismatch against ns4decode) with its USB transfer protocol reverse-engineered and **hardware-validated both ways** (enumerate, read, *and* write — on a real device). Other families (Electro, Piano, Lead, …) are mapped and next. What remains is the product layer — UI, community sharing, AI — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

> [!WARNING]
> **Alpha software — use at your own risk.** OpenNord is under active development,
> provided **as-is, with no warranty** (see the [AGPL-3.0](LICENSE), sections 15–16).
> Things will change and break. Most of all: **device transfer writes to real
> hardware.** Writing a program to your Nord overwrites whatever was in that slot —
> **back up your keyboard first** and don't run it on data you can't afford to lose.
> You are responsible for what you send to your instrument.

OpenNord is **free and open source** (AGPL-3.0). It exists because everything that makes it possible — the Nord file-format knowledge, the decoders — was built by the community, in the open. This gives that work a home that outlives any one person and a place for the next contributor to plug in.

## What it does today

- **Read a program.** Drop a Stage 2 / 3 / 4 file (`.ns2p` / `.ns3f` / `.ns4p`) and see what's inside — piano/sample, organ, synth, effects. No keyboard or Sound Manager needed. Every Nord generation shares the same CBIN container, so reading runs through one model-codec registry built to extend across the family ([`docs/MULTI-MODEL.md`](docs/MULTI-MODEL.md)).
- **Organize a library.** Point OpenNord at a folder (or import single files) and it builds a searchable, mobile-first **Library** — the home screen — split into **Programs · Samples · Presets** with a master/detail view. Search today is a zero-config keyword ranker (an LLM ranker drops in behind the same interface).
- **Play your samples.** The sample workshop reads `.nsmp`/`.nsmp3`/`.nsmp4` — keyboard map, loop points, root notes — and lets you **audition them on an on-screen keyboard, or (desktop) play them from a MIDI controller**: a lightweight rompler — pitched, polyphonic, velocity + sustain — for testing sounds with no Nord plugged in. Convert across generations, and export any sample to WAV (or all, to a zip). Imported `.nsmp` samples persist as your own local sample library.
- **Talk to your Nord.** Pull programs off the keyboard and write them back over a reverse-engineered **USB** protocol, proven on real hardware — a vendor bulk protocol, *not* MIDI SysEx ([`docs/PROTOCOL-RE.md`](docs/PROTOCOL-RE.md)). A read-only **"Check my Nord"** probe enumerates any connected Clavia device and reports what OpenNord supports. Transfer is **desktop** (WebUSB / node-usb) and **native iPad (M1+, DriverKit)** only — iPhone and PWAs can't reach vendor USB ([`docs/SYSEX-SPIKE.md`](docs/SYSEX-SPIKE.md)).

Community patch sharing and AI (explain a patch, or generate one from a description) are designed but not built yet — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Why it can exist

A lot was already done — see [`ATTRIBUTION.md`](ATTRIBUTION.md). The Stage 2/3 format is openly documented (ns3-program-viewer) and the Stage 4 format was *partially* decoded (ns4decode). OpenNord builds on that and adds what didn't exist: **Stage 4 transfer to a current Nord** (the USB protocol, reverse-engineered here), combined with open parsing, a mobile-first library, and sample playback in one tool.

## Quickstart

```bash
npm install
npm run dev          # web app
npm test             # parser/decoder tests (vitest)
npm run typecheck    # tsc --noEmit  ┐
npm run lint         # eslint + stylelint ┘ CI gates — keep both green
npm run build        # production build
npm run fixtures:scan # auto-RE harness over the local corpus (gitignored)
npm run cap:sync     # wrap for iOS (Capacitor) once you add the ios/ platform
```

Working in this repo with an AI agent? See [`CLAUDE.md`](CLAUDE.md) for the
decode-layer map, commands, and the legal guardrails.

## Layout

| Path | What |
|---|---|
| `src/lib/clavia/` | the shared, model-agnostic layer: CBIN container, checksum, name/slot/category, the file identifier + `ModelCodec` registry |
| `src/lib/ns4/` | the Stage 4 `.ns4p` body codec — model + parser + bit/byte decode (decoded + validated, the heart) |
| `src/lib/ns3/`, `src/lib/ns2/` | Stage 3 / Stage 2 body decoders + factory-library catalogs (multi-model, [`docs/MULTI-MODEL.md`](docs/MULTI-MODEL.md)) |
| `src/lib/device/` | WebUSB device layer — transport → session → transfer (read/write), backup, hardware probe |
| `src/lib/folder/` | local-folder library: scan/classify/index `.ns*` files into the Library |
| `src/lib/library/` | the unified Library model + import store |
| `src/lib/ai/` | search ranker — zero-config keyword ranking today, LLM-pluggable behind one interface |
| `src/lib/midi/` | **live MIDI** — CC/NRPN control + note input that plays the loaded sample (the in-app rompler); *not* the transfer path (that's vendor USB in `device/`) |
| `scripts/` | USB-protocol tools (`nord*.c`, libusb) + RE tooling (Ghidra dumpers) |
| `docs/` | architecture, roadmap, format notes, the USB protocol, multi-model, legal stance |

## Contributing

The reverse-engineering (format + USB transfer protocol) is **done and documented** — see [`docs/PROTOCOL-RE.md`](docs/PROTOCOL-RE.md) and [`docs/FORMAT.md`](docs/FORMAT.md). The most valuable contributions now are on the **product**: the program-visualization UI, the community library, and the AI features. See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Support

OpenNord is free and open source, built in the open. If it's useful to you and you'd like to help keep the work going, you can buy me a coffee — entirely optional, always appreciated.

<a href="https://buymeacoffee.com/simonflore" target="_blank"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=simonflore&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" height="48" /></a>

## Legal

Not affiliated with, endorsed by, or connected to Clavia DMI AB / Nord Keyboards. "Nord" and "Nord Stage" are trademarks of their owner, used here only to describe compatibility. OpenNord shares **user-created programs**, never Nord's sample/library content. See [`docs/LEGAL.md`](docs/LEGAL.md).

## License

[AGPL-3.0-or-later](LICENSE). Free to use, free to study, free to improve — and improvements stay open.
