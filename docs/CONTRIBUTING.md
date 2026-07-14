# Contributing to OpenNord

Thanks for helping build a commons for Nord Stage 4 players. The hard reverse-engineering is **done** — the `.ns4p` format is decoded/validated and the device USB transfer protocol is fully cracked and hardware-validated (`docs/PROTOCOL-RE.md`). The work now is mostly **building the product**.

## Highest-impact contributions

1. **Product & UI.** The program views, the unified Library, the sample workshop, sharing (programs only — `docs/LEGAL.md`), and the local AI search behind its `ProgramRanker` interface. This is where most value is now.
2. **Transfer runtimes & UI.** The proven USB protocol is already wrapped as a **WebUSB** client (`src/lib/device/`, `docs/PROTOCOL-RE.md`); help build out the transfer/backup **UI** and additional runtimes — an Electron/**node-usb** wrapper for non-Chromium desktops, and a native iPad (M1+) **DriverKit** path.
3. **Validate the decoder at scale.** Run the parser over more real programs and file a fixture + test for any mismatch against ns4decode.
4. **A native iPad transfer client** — transfer runs over vendor USB (not SysEx). A native iPad app (M1+) with a `USBDriverKit` DEXT can drive it on-device (Apple allows vendor-class access; needs a DriverKit distribution entitlement) — see `docs/SYSEX-SPIKE.md`. Desktop (WebUSB/node-usb) is the easier first target. (iPhone and PWAs can't reach vendor USB.)

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

## Contributing: license, sign-off, and grant

- **Inbound = outbound.** Your contributions are licensed under the project's **AGPL-3.0-or-later**, same as the project. Don't paste in code from incompatibly-licensed projects (copying GPLv3 into AGPL is fine, but verify); prefer re-implementing from documented facts — see `ATTRIBUTION.md`.
- **Sign off your commits (DCO).** Add a `Signed-off-by: Name <email>` line to each commit — `git commit -s` — certifying you wrote the patch or otherwise have the right to submit it under the project license. This is the [Developer Certificate of Origin](https://developercertificate.org/).
- **License grant.** You retain copyright to your contribution, and you grant the project maintainer(s) the right to license it under the project's license **and** under other terms the maintainers may choose for the project. This keeps the project's licensing flexible over time.

## Community

The Nord reverse-engineering community lives at the [Nord User Forum](https://www.norduserforum.com/). Be a good guest there — credit, don't demand.
