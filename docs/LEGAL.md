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

> **Recognizing, not embedding.** OpenNord reads only a `.nsmp4`'s small metadata header (name, version, checksum) to *recognize* and inventory samples and to tell a user which sample a shared program needs. It does **not** decode, store, or transmit the ~1.5 MB compressed audio payload (`src/lib/ns4/sample.ts`). Distinguishing user-created from factory samples is an open problem (see `docs/FORMAT.md`); until it's reliable, sample *audio* is never part of any sharing/library feature.

## Reverse engineering

Reverse engineering a file format or protocol **for interoperability** is broadly defensible (and explicitly protected in several jurisdictions, e.g. the EU Software Directive's interop provisions). OpenNord reverse-engineers **only** to read/write the user's own data and interoperate with their own instrument. Capturing traffic from Nord Sound Manager is for understanding the protocol — **do not** redistribute Clavia's software or its assets.

## User-generated content

When the community library exists: users keep ownership of programs they upload; uploading grants OpenNord a license to host/display; provide takedown on request; don't allow upload of obviously infringing or sample-laden content.

## This is not legal advice

Maintainers and contributors should sanity-check local law before relying on the above. If in doubt about a specific feature, open an issue and discuss before shipping it.
