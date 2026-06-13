# The SysEx spike — the experiment that decides Phase 2

> **Update (binary teardown):** static analysis of the official client largely
> answers this — see `docs/NSM-TEARDOWN.md`. **Nord Sound Manager does not use
> MIDI/SysEx for program transfer.** It has no CoreMIDI dependency; it moves
> programs over a **raw USB (IOKit) vendor bulk protocol** (`Ymer::USB` +
> `Ymer::Protocol::FileTransfer` / `ProtocolManager::CFTReq*`). MIDI (`MIDIX`)
> exists but is the control/handshake channel, not the dump path. So the likely
> answer to the question below is **"no, it's a non-MIDI bulk protocol"** — which
> routes Phase 2 to **Layer 2 in `docs/PROTOCOL-RE.md`** (raw USB capture). The
> listen-first steps here are still worth running once to *confirm* no SysEx dump
> path exists on the hardware before committing to the USB route.

**Question:** Can a computer/iPhone *receive* a full program dump from a Nord Stage 4 over USB MIDI (SysEx), and *send* one back, well enough to move a patch between the app and the keyboard?

If **yes**, "audition a shared patch on your own Nord" and "pull my current sound into the app" become real. If **no** (sealed/bulk protocol), Phase 2 needs a different approach and you'll know in a weekend instead of a year.

This is the highest-risk, highest-value unknown in the whole project. Do it before building anything on top of device transfer.

## Background facts

- **SysEx works from iOS.** CoreMIDI (and Web MIDI in Chromium, with `sysex: true`) can send and receive System Exclusive messages over USB. The capability is not the problem — the *protocol* is.
- **Clavia's MIDI manufacturer id is `0x33`.** A Nord SysEx message starts `F0 33 ... F7`. That's the envelope to look for.
- **A Nord *can* do patch transfer over SysEx** — proven on the Nord Lead 3 ([NordLead3Librarian](https://github.com/malacalypse/NordLead3Librarian)). Nobody has shown it on a current Stage. That gap is exactly what this spike closes.

## Steps

1. **Listen.** Connect the Stage 4 by USB. Run a SysEx monitor (snoize SysEx Librarian on macOS, a Web MIDI page with `requestMIDIAccess({ sysex: true })`, or `lib/midi/sysex.ts` here). Log everything.
2. **Provoke a dump.** Try, in order, until bytes appear:
   - a panel "MIDI dump / send" function if the Stage 4 has one;
   - a **dump-request** SysEx (capture what Nord Sound Manager sends — see step 4 — and replay it);
   - changing a program / pressing Store while monitoring.
3. **Characterize the dump.** When `F0 33 … F7` arrives: how many messages? How big? Does the payload size match a `.ns4p` file size (minus the SysEx framing + 7-bit encoding)? Nord likely 7-bit-encodes binary into SysEx data bytes — account for that.
4. **Watch the real client (the Rosetta Stone).** Run **Nord Sound Manager** and capture the USB traffic while it backs up / restores a program (Wireshark USB capture, or a MIDI spy). The request/response handshake it uses is the spec. *Interop capture for compatibility — keep notes, don't redistribute their software.*
5. **Round-trip.** Send a captured dump back to the keyboard and confirm the program loads intact. That's the win condition.

## Record the result

Whatever happens, write it down (`docs/FORMAT.md` for byte layout, an issue for the protocol). A clean "here's the dump format" or even "the library transfer is a non-MIDI bulk protocol, here's the evidence" is a real contribution either way.

## Scaffold

`src/lib/midi/sysex.ts` has the listener/request skeleton and the `0x33` envelope helpers, marked experimental. It does **not** assume a protocol — it's there to capture and characterize, which is step 1.
