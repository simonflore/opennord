# OpenNord

**An open, AI-native companion for Nord® keyboards** — starting with the **Nord Stage** line. Browse, share, and visualize your programs — and talk to your Nord directly over USB, without a desktop app.

> Status: **early — the reverse-engineering is done, the product is being built.** OpenNord is built for the **whole Nord family**: one shared file container and one shared USB transport run the entire line, so the architecture is family-wide from the ground up (`src/lib/clavia/` already carries a full-line model registry). The **Nord Stage series is what we cover first** — Stage 2 / 3 / 4 files read today, and the **Stage 4** is decoded and validated (0-mismatch against ns4decode) with its USB transfer protocol fully reverse-engineered and **hardware-validated in both directions** (enumerate, read, *and* write — proven on a device). Other Nord families (Electro, Piano, Lead, …) are mapped and next in line. What remains is the product layer — UI, community sharing, AI — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

> [!WARNING]
> **Alpha software — use at your own risk.** OpenNord is under active development,
> provided **as-is, with no warranty** (see the [AGPL-3.0](LICENSE), sections 15–16).
> Things will change and break. Most of all: **device transfer writes to real
> hardware.** Writing a program to your Nord overwrites whatever was in that slot —
> **back up your keyboard first** and don't run it on data you can't afford to lose.
> You are responsible for what you send to your instrument.

OpenNord is **free and open source** (AGPL-3.0). It exists because everything that makes it possible — the Nord file-format knowledge, the decoders — was built by the community, in the open. This gives that work a home that outlives any one person and a place for the next contributor to plug in.

## What it does (and will do)

- **Read a program.** Drop a program or preset file from any **Nord Stage** — Stage 2 / 3 / 4 (`.ns2p` / `.ns3f` / `.ns4p` …) — and see what's inside: piano/sample, organ, synth, effects. No keyboard or Sound Manager required. Every Nord generation shares the same CBIN container, so reading runs through one model-codec registry built to extend across the whole family ([`docs/MULTI-MODEL.md`](docs/MULTI-MODEL.md)).
- **Browse your patches.** Point OpenNord at a folder of programs (or import single files) and it builds a searchable, mobile-first **Library** — the home screen — split into **Programs · Samples · Presets** with a master/detail view.
- **Play your samples.** The sample workshop reads `.nsmp`/`.nsmp3`/`.nsmp4` files — keyboard map, loop points, root notes — and lets you **audition them on an on-screen keyboard, or (on desktop) play them from a connected MIDI controller**: a lightweight rompler — pitched across the keys, polyphonic, velocity + sustain — for testing sounds with no Nord plugged in. Convert across generations, import a WAV, and export any sample (or all of them) to WAV. Imported samples persist as your own local sample library.
- **Share a patch.** A community library of *user programs*: upload yours, search others in plain language ("warm Rhodes with tape echo"), rate, fork. (Programs reference Nord's factory samples by id — you share the program, the other player already has the sample. See [`docs/LEGAL.md`](docs/LEGAL.md).)
- **AI-native.** Natural-language search, AI explanations of what a patch does, and "describe the sound you want → get a patch."
- **Talk to your Nord.** Pull programs off the keyboard and write them back — over a reverse-engineered **USB** protocol, proven on real hardware (desktop, via WebUSB / node-usb). It's a vendor bulk protocol, *not* MIDI SysEx — see [`docs/PROTOCOL-RE.md`](docs/PROTOCOL-RE.md). A read-only **"Check my Nord"** probe also enumerates any connected Clavia device and reports what OpenNord supports for it. Transfer runs on **desktop** (WebUSB / node-usb) and on a **native iPad app (M1+, via a DriverKit extension)**; a PWA and iPhone can't reach vendor USB, so they get read/share/AI + live MIDI ([`docs/SYSEX-SPIKE.md`](docs/SYSEX-SPIKE.md)).

## Why it can exist

A lot was already done — see [`ATTRIBUTION.md`](ATTRIBUTION.md). The Stage 2/3 format is openly documented (ns3-program-viewer) and the Stage 4 format was *partially* decoded (ns4decode). OpenNord builds on that and adds what didn't exist: **Stage 4 transfer to a current Nord** (the USB protocol, reverse-engineered here), plus — combined in one open tool — parsing, community sharing, mobile, and AI. That's OpenNord.

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
| `src/lib/ai/` | AI-native search / explanation (provider-pluggable) |
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
