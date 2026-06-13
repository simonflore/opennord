# Contributing to OpenNord

Thanks for helping build a commons for Nord Stage 4 players. The hard reverse-engineering is **done** — the `.ns4p` format is decoded/validated and the device USB transfer protocol is fully cracked and hardware-validated (`docs/PROTOCOL-RE.md`). The work now is mostly **building the product**.

## Highest-impact contributions

1. **Product & UI.** A program-visualization view (piano/sample, organ, synth, FX), the community library (upload/search/rate/fork), and the AI features (search, explain, generate). This is where most value is now.
2. **A desktop transfer client.** Wrap the proven USB protocol (`docs/PROTOCOL-RE.md`, `scripts/nord*.c`) into the app via WebUSB / node-usb (Electron).
3. **Validate the decoder at scale.** Run the parser over more real programs and file a fixture + test for any mismatch against ns4decode.
4. **Re-test SysEx-over-MIDI** (`docs/SYSEX-SPIKE.md`) with Global SysEx-RX enabled on a Stage 4 — that single result decides whether transfer can work on iOS.

## Ground rules

- **Trace your sources.** Every decoded field cites where the knowledge came from (forum thread, manual page, your own capture). Keep the format re-derivable.
- **Programs, not samples.** Never add a path that shares Nord's sample/library content (`docs/LEGAL.md`).
- **Keep hardware optional.** Reading/sharing/AI must work from a file alone; device transfer is a bonus, never a hard dependency.
- **Small, tested steps.** A PR that decodes one field with a fixture test beats a big speculative one.

## Dev setup

```bash
npm install
npm run dev
npm test
npm run typecheck
```

## License of contributions

By contributing you agree your work is licensed under the project's **AGPL-3.0-or-later**. Don't paste in code from incompatibly-licensed projects (e.g. copying GPLv3 source is fine for AGPL, but verify; prefer re-implementing from documented facts — see `ATTRIBUTION.md`).

## Community

The Nord reverse-engineering community lives at the [Nord User Forum](https://www.norduserforum.com/). Be a good guest there — credit, don't demand.
