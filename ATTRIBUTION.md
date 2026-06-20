# Attribution & prior art

OpenNord stands on community reverse-engineering work. Credit where it's due, and pointers for contributors.

## Format knowledge

- **[ns3-program-viewer](https://github.com/Chris55/ns3-program-viewer)** (GPLv3) — open-source parser + **hand-written format documentation** for Nord Stage 2/2EX/3 programs ([docs](https://chris55.github.io/nord-documentation/)). The reference for how Nord lays out a program. *Note: GPLv3 — do not copy its source into OpenNord unless OpenNord stays GPL-compatible (it is, under AGPL-3.0, but prefer re-implementing from the documented facts of the layout).*
- **[ns4decode](https://ns4decode.netlify.app/)** — decodes Nord **Stage 4** `.ns4p` programs and `.ns4o/.ns4n/.ns4y` presets ("many parameters, but not all"). Freeware, no public source — a proof and a reference, not a fork target.
- **[Nord User Forum](https://www.norduserforum.com/)** — the [Stage 4 programs subforum](https://www.norduserforum.com/viewtopic.php?t=26308) is where the RE and patch-sharing happen.

### Vendored: Nord Stage 3 sample-library catalog

`src/lib/ns3/library/*.generated.ts` is the factory sample-library catalog
(sampleId hash → product name / version / category) **ported verbatim from
ns3-program-viewer** (`src/server/library/`, GPLv3). We treat it as *data, not
source* (a large factual lookup table, like a dB curve), so it's marked
`*.generated.ts` per the CLAUDE.md convention and not hand-edited. The *lookup
logic* (`service.ts`, re-derived from the project's `getSample`) sits beside it.
OpenNord is **AGPL-3.0-or-later**, which is GPLv3-compatible, so this redistribution
is fine — but preserve this credit and the GPLv3 lineage if you regenerate it.

## Transfer (SysEx) prior art

- **[NordLead3Librarian](https://github.com/malacalypse/NordLead3Librarian)** — proves a Nord can be driven over MIDI SysEx for patch import/export/audition (Nord Lead 3; macOS; unmaintained). The closest evidence the Stage transfer is achievable.
- **[KnobKraft Orm](https://github.com/christofmuc/KnobKraft-orm)** — maintained, cross-platform, extensible SysEx librarian with Python "adaptations." A model for adding a new device, and a possible upstream collaborator.

## Live MIDI parameter map

- **[ns4mcp](https://github.com/gbulfon/ns4mcp)** (MIT) — assembled the Nord Stage 4 CC/NRPN parameter map. The underlying parameter addresses are from **[midi.guide](https://midi.guide/d/nord/stage-4/)**, licensed **CC BY-SA 4.0**. If OpenNord vendors that parameter data, it must carry that attribution and remain CC BY-SA.

## How to credit new work

When you add decoded fields or a transfer step, cite where the knowledge came from (a forum thread, your own capture, a manual page) in the code comment and in `docs/FORMAT.md`. This is what keeps the commons honest and re-derivable.
