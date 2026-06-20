# NSM Reverse-Engineering Workflow

This document describes how to use the **decompiled Nord Sound Manager (NSM)
binary** as a first-class traceability oracle for OpenNord's format and
protocol work. It mirrors the `nse_decomp/` workflow already in use for the
Nord Sample Editor.

## The binary

| Property | Value |
|---|---|
| Path | `nsm/nsm-arm64` |
| Format | Mach-O 64-bit arm64 |
| Size | ~15 MB (stripped app binary, not a firmware image) |
| Symbols | Full C++ symbols present (mangled; demangle with `c++filt`) |
| Namespace | `Ymer::Product::*`, `Ymer::SoundLibrary::*`, etc. |

The binary is a local-only, gitignored asset (`nsm/` is in `.gitignore`).
Never commit it or any derivative.

## Listing symbols

```bash
# All symbols, demangled
nm nsm/nsm-arm64 | c++filt

# Filter to a class or method substring
nm nsm/nsm-arm64 | c++filt | grep 'CElectro5'
nm nsm/nsm-arm64 | c++filt | grep 'ContentVersion'

# Raw mangled name + address (needed for objdump --disassemble-symbols)
nm nsm/nsm-arm64 | grep '<mangled_substring>'
```

Symbol addresses are load-address-relative (default base `0x100000000` for
arm64 Mach-O). The same addresses appear verbatim in `otool` / `objdump`
output and in Ghidra after auto-analysis.

## Two decompile paths

### Path 1 — Ghidra headless (preferred for non-trivial functions)

Ghidra produces readable decompiled C with local variable names, type
inference, and control-flow reconstruction. The one-time import +
analysis pass is slow (~5–10 min); it is cached in
`nsm_decomp/ghidra-project/` so subsequent calls reuse it instantly.

The harness script (`scripts/nsm-decompile.sh`) handles this automatically.
Internally it uses `scripts/DecompAt.java` (the same Ghidra post-script
already used for `nse_decomp/`), which reads a target VA from the env var
`NSM_AT` and writes `nsm_decomp/<name>@<addr>.c`.

### Path 2 — `objdump` / `otool` disassembly (fast fallback)

For tiny functions (table look-ups, simple comparisons, vtable entries) the
assembly is readable directly. The harness falls back to this automatically if
Ghidra fails, emitting `nsm_decomp/<name>@<addr>.s` and printing a notice.

```bash
# Disassemble one symbol by its mangled name
objdump --disassemble-symbols='<mangled_name>' nsm/nsm-arm64

# Disassemble by address range (hex offset from file base)
otool -tV nsm/nsm-arm64 | awk '/^<target_addr>/,/^[0-9a-f]{16} <[^>]+>:/'
```

## Output convention

Output files live under `nsm_decomp/` (gitignored — proprietary derivative,
local-only per `docs/LEGAL.md`). The naming mirrors `nse_decomp/`:

```
nsm_decomp/<DemangledClass__Method>@<hex_addr>.c   # Ghidra decompiled C
nsm_decomp/<DemangledClass__Method>@<hex_addr>.s   # objdump disassembly fallback
```

`::` in C++ names is replaced with `__` (same convention as `nse_decomp/`).
Nested namespaces (`Ymer::Product::CElectro5`) are collapsed to the class
leaf (`CElectro5`) in the file name for readability — but the full demangled
name is always in the file header comment.

## Running the harness

```bash
# Decompile all symbols matching a substring
bash scripts/nsm-decompile.sh 'CElectro5::ContentVersion'
bash scripts/nsm-decompile.sh 'BankToCategories'

# Output appears in nsm_decomp/
ls nsm_decomp/
```

The script exits non-zero with a clear message if no symbol matches. It
prints a notice (not a silent failure) when it falls back to disassembly.

## Citing NSM as a traceability source

When a decoded field is sourced from an NSM function, cite it in a comment:

```typescript
// Source: NSM Ymer::Product::CElectro5::BankToCategories (nsm_decomp/)
// offset 0x14 = bank index; maps to CategoryID via vtable slot 7
```

This satisfies principle 1 of `docs/ARCHITECTURE.md`: every decoded field
remains traceable and re-derivable.

## Legal note

- The NSM binary and any decompiled derivatives are **local-only** and
  **gitignored**. Never commit `nsm/` or `nsm_decomp/` content.
- OpenNord uses this solely for **interoperability** (reading user program
  files). No Nord sample, library, or audio content is extracted or
  distributed. See `docs/LEGAL.md`.
- Attribution for ported logic goes in `ATTRIBUTION.md`.
