# OpenNord

**An open, AI-native companion for the Nord® Stage 4.** Browse, share, and visualize your programs — and talk to your Nord directly over USB, without a desktop app.

> Status: **early — the reverse-engineering is done, the product is being built.** The `.ns4p` format is decoded and validated (0-mismatch against ns4decode), and the Stage 4's USB transfer protocol is fully reverse-engineered and **hardware-validated in both directions** (enumerate, read, *and* write — proven by reading and writing real programs on a device). What remains is the product layer — UI, community sharing, AI — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

OpenNord is **free and open source** (AGPL-3.0). It exists because everything that makes it possible — the Nord file-format knowledge, the decoders — was built by the community, in the open. This gives that work a home that outlives any one person and a place for the next contributor to plug in.

## What it does (and will do)

- **Read a program.** Drop a `.ns4p` (program) or preset file and see what's inside — piano/sample, organ, synth, effects — no keyboard or Sound Manager required.
- **Share a patch.** A community library of *user programs*: upload yours, search others in plain language ("warm Rhodes with tape echo"), rate, fork. (Programs reference Nord's factory samples by id — you share the program, the other player already has the sample. See [`docs/LEGAL.md`](docs/LEGAL.md).)
- **AI-native.** Natural-language search, AI explanations of what a patch does, and "describe the sound you want → get a patch."
- **Talk to your Nord.** Pull programs off the keyboard and write them back — over a reverse-engineered **USB** protocol, proven on real hardware (desktop, via WebUSB / node-usb). It's a vendor bulk protocol, *not* MIDI SysEx — see [`docs/PROTOCOL-RE.md`](docs/PROTOCOL-RE.md). (iOS transfer is gated on a keyboard setting — [`docs/SYSEX-SPIKE.md`](docs/SYSEX-SPIKE.md).)

## Why it can exist

A lot was already done — see [`ATTRIBUTION.md`](ATTRIBUTION.md). The Stage 2/3 format is openly documented (ns3-program-viewer) and the Stage 4 format was *partially* decoded (ns4decode). OpenNord builds on that and adds what didn't exist: **Stage 4 transfer to a current Nord** (the USB protocol, reverse-engineered here), plus — combined in one open tool — parsing, community sharing, mobile, and AI. That's OpenNord.

## Quickstart

```bash
npm install
npm run dev        # web app
npm test           # parser tests
npm run typecheck  # tsc --noEmit (the CI gate — keep it green)
npm run build      # production build
npm run cap:sync   # wrap for iOS (Capacitor) once you add the ios/ platform
```

Working in this repo with an AI agent? See [`CLAUDE.md`](CLAUDE.md) for the
decode-layer map, commands, and the legal guardrails.

## Layout

| Path | What |
|---|---|
| `src/lib/ns4/` | `.ns4p` program model + parser/decoder (decoded + validated) |
| `src/lib/midi/` | experimental MIDI/SysEx scaffold (the iOS-transfer retest path) |
| `src/lib/ai/` | AI-native search / explanation |
| `scripts/` | USB-protocol tools (`nord*.c`, libusb) + RE tooling (Ghidra dumpers) |
| `docs/` | architecture, roadmap, format notes, the USB protocol, legal stance |

## Contributing

The reverse-engineering (format + USB transfer protocol) is **done and documented** — see [`docs/PROTOCOL-RE.md`](docs/PROTOCOL-RE.md) and [`docs/FORMAT.md`](docs/FORMAT.md). The most valuable contributions now are on the **product**: the program-visualization UI, the community library, and the AI features. See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Legal

Not affiliated with, endorsed by, or connected to Clavia DMI AB / Nord Keyboards. "Nord" and "Nord Stage" are trademarks of their owner, used here only to describe compatibility. OpenNord shares **user-created programs**, never Nord's sample/library content. See [`docs/LEGAL.md`](docs/LEGAL.md).

## License

[AGPL-3.0-or-later](LICENSE). Free to use, free to study, free to improve — and improvements stay open.
