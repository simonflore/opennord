# scripts/re-archive — retired RE tooling

One-off reverse-engineering tools whose job is done. They're kept here (not
deleted) because they're the **provenance** for decoded fields and the USB
protocol — see CLAUDE.md's "every decoded field is traceable" principle and
`docs/LEGAL.md`. None are wired into the build, CI, or `package.json`; each needs
local-only inputs (a Ghidra install + gitignored decompiles, or physical Nord
hardware + libusb) and cannot run in a public/CI environment.

| Tool | What it was for |
|---|---|
| `DumpData.java`, `DumpXrefs.java`, `DumpStringXrefs.java`, `DumpCat.java`, `GrepDecomp.java`, `HandlerProbe.java`, `ForceArm.java`, `ForceArmMixed.java`, `ProperPass.java` | Ghidra post-scripts: xref/string/category dumps and force-ARM disassembly passes over the NSM/NSE decompiles. |
| `nordcorpus.c`, `nordpull.c` | Hardware probes: full-partition enumeration / partition list (read-only). |
| `nordcopy.c`, `nordel.c` | Hardware write-path probes: read→write round-trip and `FileDelete`. |
| `nordeps.c` | `GetDependency` — a program's sample list. |
| `nordsettings.c` | Read the Settings partition (`Begin(11)`). |
| `nordfin.c` | Misc protocol-finish probe. |
| `nsmp-dump.ts`, `nsmp-splice.ts` | `.nsmp*` sample-codec inspection helpers (read gitignored corpus). |

The protocol these validated is now reimplemented in `src/lib/device/` and
documented in `docs/PROTOCOL-RE.md`; the `.nsmp*` codec lives in `src/lib/ns4/`.
Still-active RE tools (`nordprobe.c`, `nordcreate.c`, `nordusb.c`,
`nsm-decompile.sh`, `DecompAt.java`, generators) remain in `scripts/`.
