# Legal & ethical stance

OpenNord is a community interoperability tool. Staying clearly on the right side of the line is part of the project's identity.

## Not affiliated with Nord / Clavia

OpenNord is **not affiliated with, endorsed by, sponsored by, or connected to Clavia DMI AB or Nord Keyboards.** "Nord", "Nord Stage", and related marks belong to their owner and are used here **only nominatively** — to describe what OpenNord is compatible with. Every user-facing surface should carry a short version of this disclaimer.

## Share programs, never samples

This is the bright line:

- **User programs** (`.ns4p` and presets) describe *settings* and **reference Nord's factory samples by id**. They contain no sample audio. Sharing a program you made is sharing your own creative work — the same thing the Nord User Forum has done for years. ✅
- **Nord's sample/library content** (the actual piano/synth sample data, the factory sound libraries) is Clavia's intellectual property. OpenNord must **never** host, transfer, or redistribute it. If a future format turns out to embed sample data, that data is stripped/refused, not shared. ❌

The receiving user already owns the factory samples (they come with the instrument), so program-only sharing "just works" for them.

## Reverse engineering

Reverse engineering a file format or protocol **for interoperability** is broadly defensible (and explicitly protected in several jurisdictions, e.g. the EU Software Directive's interop provisions). OpenNord reverse-engineers **only** to read/write the user's own data and interoperate with their own instrument. Capturing traffic from Nord Sound Manager is for understanding the protocol — **do not** redistribute Clavia's software or its assets.

## User-generated content

When the community library exists: users keep ownership of programs they upload; uploading grants OpenNord a license to host/display; provide takedown on request; don't allow upload of obviously infringing or sample-laden content.

## This is not legal advice

Maintainers and contributors should sanity-check local law before relying on the above. If in doubt about a specific feature, open an issue and discuss before shipping it.
