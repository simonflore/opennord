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

> **Recognizing vs. sharing.** For the **community library / sharing** features, OpenNord uses only a `.nsmp4`'s small metadata header (name, version, checksum) — it never publishes, transmits, or hosts the compressed audio payload. Local features — the Sample Inspector, the sample editor, and pulling a sample off your own board — *do* read and decode the full audio, but only on your own machine for your own use (see *Local device access vs. community sharing* below). Distinguishing user-created from factory samples is an open problem (see `docs/FORMAT.md`); until it's reliable, sample *audio* is never part of any sharing/library feature.

## Local device access vs. community sharing

OpenNord distinguishes two different things:

- **Local device access (any content, personal use).** Reading files — programs, presets, *and samples, factory ones included* — from your own Nord to your own computer, and inspecting or editing them locally, is personal access to your own device. It is the same thing Nord Sound Manager does when it backs the sample library up to your computer. OpenNord neither hosts nor redistributes this content; it stays on your machine.
- **Community sharing (user-created only).** Anything OpenNord ever publishes or shares carries **user-created content only** — never Nord's factory sample/library audio. This line is absolute, independent of the local-access capability above.

Device sample browsing (read a sample off the board, edit, download) is local access; it has no sharing surface, so the community-sharing guardrail is untouched.

## Reverse engineering

Reverse engineering a file format or protocol **for interoperability** is broadly defensible (and explicitly protected in several jurisdictions, e.g. the EU Software Directive's interop provisions). OpenNord reverse-engineers **only** to read/write the user's own data and interoperate with their own instrument. Capturing traffic from Nord Sound Manager is for understanding the protocol — **do not** redistribute Clavia's software or its assets.

## User-generated content

When the community library exists: users keep ownership of programs they upload; uploading grants OpenNord a license to host/display; provide takedown on request; don't allow upload of obviously infringing or sample-laden content.

## This is not legal advice

Maintainers and contributors should sanity-check local law before relying on the above. If in doubt about a specific feature, open an issue and discuss before shipping it.
