# OpenNord

**An open, AI-native companion for the Nord® Stage 4.** Browse, share, and visualize your programs — and (experimental) talk to your Nord directly, without a desktop app.

> Status: **pre-alpha scaffold.** This repo is the skeleton + the plan. The hard parts (full `.ns4p` decoding, and SysEx transfer to/from the keyboard) are community reverse-engineering work in progress — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

OpenNord is **free and open source** (AGPL-3.0). It exists because everything that makes it possible — the Nord file-format knowledge, the decoders — was built by the community, in the open. This gives that work a home that outlives any one person and a place for the next contributor to plug in.

## What it does (and will do)

- **Read a program.** Drop a `.ns4p` (program) or preset file and see what's inside — piano/sample, organ, synth, effects — no keyboard or Sound Manager required.
- **Share a patch.** A community library of *user programs*: upload yours, search others in plain language ("warm Rhodes with tape echo"), rate, fork. (Programs reference Nord's factory samples by id — you share the program, the other player already has the sample. See [`docs/LEGAL.md`](docs/LEGAL.md).)
- **AI-native.** Natural-language search, AI explanations of what a patch does, and "describe the sound you want → get a patch."
- **Talk to your Nord (experimental).** Pull your current program into the app, and push patches back — over USB MIDI SysEx. This is the unproven frontier; the validating experiment is in [`docs/SYSEX-SPIKE.md`](docs/SYSEX-SPIKE.md).

## Why it can exist

A lot is already done — see [`ATTRIBUTION.md`](ATTRIBUTION.md). The Stage 2/3 format is openly documented and parsed (ns3-program-viewer), the Stage 4 format is *partially* decoded (ns4decode), and SysEx patch transfer has been proven on an older Nord (NordLead3Librarian). Nobody has combined **Stage 4 parsing + transfer to a current Nord + community sharing + mobile + AI** into one open tool. That's OpenNord.

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
| `src/lib/ns4/` | `.ns4p` program model + parser (format decoding is in progress) |
| `src/lib/midi/` | SysEx transfer to/from the Nord (experimental) |
| `src/lib/ai/` | AI-native search / explanation |
| `docs/` | architecture, roadmap, the format notes, the SysEx spike, legal stance |

## Contributing

The most valuable contributions are **reverse-engineering the format and the transfer protocol** — see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) and [`docs/FORMAT.md`](docs/FORMAT.md). You don't need to be a coder: a captured program dump from your Stage 4 moves this forward.

## Legal

Not affiliated with, endorsed by, or connected to Clavia DMI AB / Nord Keyboards. "Nord" and "Nord Stage" are trademarks of their owner, used here only to describe compatibility. OpenNord shares **user-created programs**, never Nord's sample/library content. See [`docs/LEGAL.md`](docs/LEGAL.md).

## License

[AGPL-3.0-or-later](LICENSE). Free to use, free to study, free to improve — and improvements stay open.
