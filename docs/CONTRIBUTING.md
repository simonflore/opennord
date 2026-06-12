# Contributing to OpenNord

Thanks for helping build a commons for Nord Stage 4 players. The most valuable work here is **reverse engineering**, and a lot of it doesn't require writing code.

## Highest-impact contributions

1. **Share captures (no code needed).** Export programs from your Stage 4 — especially **pairs that differ by exactly one setting** — and attach them to an issue. Diffing near-identical files is how the format gets decoded. Only share programs you're happy to make public (`docs/LEGAL.md`).
2. **Decode a field.** Map one parameter to its byte/bit location, add it to `src/lib/ns4/parse.ts` with a source comment, add a test, and record it in `docs/FORMAT.md`.
3. **Run the SysEx spike** (`docs/SYSEX-SPIKE.md`) if you can monitor USB MIDI. Even a "here's the dump envelope" or "here's why it doesn't work" is gold.
4. **Code & UI.** Visualization, AI search/explain, the community library.

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
