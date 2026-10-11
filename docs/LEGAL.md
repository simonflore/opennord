# Legal & ethical stance

OpenNord is a community interoperability tool. Staying clearly on the right side of the line is part of the project's identity.

## Not affiliated with Nord / Clavia

OpenNord is **not affiliated with, endorsed by, sponsored by, or connected to Clavia DMI AB or Nord Keyboards.** "Nord", "Nord Stage", and related marks belong to their owner and are used here **only nominatively** — to describe what OpenNord is compatible with. Every user-facing surface should carry a short version of this disclaimer.

## Share the user's own work, never Clavia's library content

The bright line is **authorship**, not file type:

- **User programs** (`.ns4p` and presets) describe *settings* and **reference samples by id**. They contain no sample audio. Sharing a program you made is sharing your own creative work — the same thing the Nord User Forum has done for years. ✅
- **User-created samples** (`.nsmp4` you recorded yourself with the Nord Sample Editor — sampling your own instruments) are **your own intellectual property**, just like a program. Sharing them is fine. ✅
- **Nord's factory / sound-library content** (the bundled piano & synth sample libraries, and any commercial Nord Sample Library download) is Clavia's / the vendor's intellectual property. OpenNord must **never** host, transfer, or redistribute it. ❌

So a `.nsmp4` is only off-limits when it's **factory/library** content. OpenNord should default to caution: when it can't establish that a sample is user-created, treat it as not-shareable. The receiving user already owns the factory samples (they came with the instrument), so program-only sharing "just works" regardless.

### Factory catalog metadata & download links — references, not content

The absolute line above is about factory **audio** — the actual sample/library payloads OpenNord never hosts, transfers, or redistributes. It is **not** the same as factory *metadata*. OpenNord ships an index of factory sample/piano/library entries (names, filenames, versions, sizes, categories) and, for some, the vendor's **own public download URLs** — the same endpoints Nord already exposes through its website and Nord Sound Manager. This is intentional and stays on the right side of the line:

- It exists for **interoperability**: mapping a sample id → its human name so a user's own program shows readable references, and pointing users at Nord's official download for a library they're missing.
- These are **facts and links, not the works** — publicly-available metadata plus references to Nord's own hosted files. OpenNord **links** to those endpoints; it never mirrors, re-hosts, or bundles the audio they serve.
- The factory **content** itself remains off-limits per the bright line above. Nothing here lets OpenNord redistribute Clavia's sample/library audio.

> **Recognizing vs. sharing.** For the **community library / sharing** features, OpenNord uses only a `.nsmp4`'s small metadata header (name, version, checksum) — it never publishes, transmits, or hosts the compressed audio payload. Local features — the Sample Inspector, the sample editor, and pulling a sample off your own board — *do* read and decode the full audio, but only on your own machine for your own use (see *Local device access vs. community sharing* below). Distinguishing user-created from factory samples is an open problem; until it's reliable, sample *audio* is never part of any sharing/library feature.

## Local device access vs. community sharing

OpenNord distinguishes two different things:

- **Local device access (any content, personal use).** Reading files — programs, presets, *and samples, factory ones included* — from your own Nord to your own computer, and inspecting or editing them locally, is personal access to your own device. It is the same thing Nord Sound Manager does when it backs the sample library up to your computer. OpenNord neither hosts nor redistributes this content; it stays on your machine.
- **Community sharing (user-created only).** Anything OpenNord ever publishes or shares carries **user-created content only** — never Nord's factory sample/library audio. This line is absolute, independent of the local-access capability above.

Device sample browsing (read a sample off the board, edit, download) is local access; it has no sharing surface, so the community-sharing guardrail is untouched.

## Reverse engineering

Reverse engineering a file format or protocol **for interoperability** is broadly defensible (and explicitly protected in several jurisdictions, e.g. the EU Software Directive's interop provisions). OpenNord reverse-engineers **only** to read/write the user's own data and interoperate with their own instrument. Capturing traffic from Nord Sound Manager is for understanding the protocol — **do not** redistribute Clavia's software or its assets.

### Nord software, firmware and audio

OpenNord's engines and readers (piano/sample decoding, organ, rotary, synth, effects, file writers) are its own code. The line is between **knowledge** and **copies**:

**Allowed — knowledge, written up or re-implemented in our own code:**
- Formats, structures, field meanings, signal flow and algorithms (e.g. "LP24 is two state-variable filters in series", "the rotary has two rotors with Doppler delay and an ~800 Hz crossover", "percussion is single-trigger").
- Small factual constants an implementation needs to be compatible or to sound right: sample rates, block sizes, parameter ranges and step sizes, enum values and display names, tuning ratios.
- Code written fresh from that understanding.

**Not allowed in the repo, a release, or anything OpenNord serves:**
- Nord firmware or desktop software, in whole or in part, or Nord audio.
- Bulk data copied out of Nord's software: wavetables, sample/impulse data, coefficient, curve or lookup tables. When an engine genuinely needs such data, it is read **on the user's own device at runtime** — never committed, bundled, uploaded or shared.

When unsure whether something is "a constant" or "a table", treat a handful of values that a manual or a measurement could also give you as knowledge, and anything larger as data.

## Sharing & community features (when they exist)

Any feature that uploads or shares files follows the authorship bright line above, plus standard hygiene for user-generated content:

- **User-created content only.** Sharing carries programs (and user-created samples carried with them) — **never** Nord factory/library content. Enforce it at the point of upload: refuse factory/library content, and refuse a program whose referenced samples can't be established as user-created (point those at the official source instead).
- **Ownership stays with the uploader.** Sharing a file grants OpenNord a license to host and display it for the sharing feature; it does not transfer ownership.
- **A clear content license / terms** governs what an uploader grants and how shared files may be used — in place **before** any upload feature ships.
- **Takedown & moderation.** Honor takedown requests, provide a report path, and remove infringing, factory-laden, or abusive content.

## Diagnostics (privacy)

Files are read and decoded on the user's device. The free/local build sends nothing:
its diagnostics sink is the browser console. A build that configures a diagnostics
collector (the hosted app sets `VITE_DIAGNOSTICS_URL`) sends small JSON events,
each stamped with the time and the browser's user-agent string:

- **Keyboard connection** (`device.connect`, `device.error`, `device.partition-probe`) —
  always on in such a build: whether connecting worked, the model, the USB descriptor
  layout, the error name/message, and the partition-probe map. No programs, sounds or
  names.
- **File support** (`file.read`) — **opt-in, off by default**, stored per device
  ("Help improve file support" on the About and Contribute pages). One report per
  distinct program file per visit, when it is opened: the file-type tag, model id,
  size, the header's format byte (0x04) and version field (0x14), two 6-byte framing
  windows as hex (0x14–0x19, and the first 6 bytes where the reader expects the
  record/body: 0x18 after a legacy header, 0x2C after an NSM-era one — the version
  word and block length, at most the leading bits of the first parameter block), the
  reader's verdict (layout matched / header only, record version, its generic warning
  messages, the count of out-of-range values) and the app build. **Never** program
  contents or values beyond those windows, program names, file names, or a hash of
  the file. Program files carry no name in the binary (`clavia/cbin.ts`,
  the maintainers’ notes); sample files do, so they are never reported. Implementation:
  `src/lib/diagnostics/file-read.ts`.

No account id or IP address is stored with an event. **Retention is not implemented
yet:** events are kept in the backend's database until deleted by hand. The user-facing
summary is on the About page.

## This is not legal advice

Maintainers and contributors should sanity-check local law before relying on the above. If in doubt about a specific feature, open an issue and discuss before shipping it.
