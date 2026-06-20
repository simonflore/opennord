#!/usr/bin/env bash
# nsm-decompile.sh — decompile NSM functions matching a symbol substring
#
# Usage: bash scripts/nsm-decompile.sh '<SymbolSubstring>'
#
# Resolves all C++ symbols in nsm/nsm-arm64 whose demangled name contains
# <SymbolSubstring>, then for each match either:
#   (A) Ghidra headless — decompiles to nsm_decomp/<name>@<addr>.c
#   (B) objdump fallback — disassembles to nsm_decomp/<name>@<addr>.s
#        and prints a notice (never a silent failure).
#
# The Ghidra project is cached under nsm_decomp/.ghidra-project/ so the
# expensive 48 MB import+analysis happens only once; subsequent runs reuse it.
#
# See docs/NSM-RE-WORKFLOW.md for the full workflow.

set -euo pipefail

# ── paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BINARY="$REPO_ROOT/nsm/nsm-arm64"
OUT_DIR="$REPO_ROOT/nsm_decomp"
GHIDRA_PROJ_DIR="$OUT_DIR/ghidra-project"
GHIDRA_PROJ_NAME="nsm"
SCRIPTS_DIR="$REPO_ROOT/scripts"
GHIDRA_HEADLESS="/opt/homebrew/Cellar/ghidra/12.1.2/libexec/support/analyzeHeadless"

# ── args ───────────────────────────────────────────────────────────────────────
if [[ $# -lt 1 || -z "$1" ]]; then
  echo "Usage: $0 '<SymbolSubstring>'" >&2
  exit 1
fi
SUBSTR="$1"

# ── pre-flight ─────────────────────────────────────────────────────────────────
if [[ ! -f "$BINARY" ]]; then
  echo "ERROR: binary not found: $BINARY" >&2
  echo "  Place the Nord Sound Manager arm64 binary at that path (local-only, gitignored)." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# ── resolve symbols ────────────────────────────────────────────────────────────
# Match demangled names containing SUBSTR; collect (mangled_name, demangled_name, addr)
declare -a MANGLED_NAMES=()
declare -a DEMANGLED_NAMES=()
declare -a ADDRS=()

while IFS=' ' read -r addr _type mangled; do
  demangled="$(printf '%s' "$mangled" | c++filt)"
  if printf '%s' "$demangled" | grep -qF "$SUBSTR"; then
    MANGLED_NAMES+=("$mangled")
    DEMANGLED_NAMES+=("$demangled")
    ADDRS+=("$addr")
  fi
done < <(nm "$BINARY" | grep -E '^[0-9a-f]+ [tT] ')

if [[ ${#ADDRS[@]} -eq 0 ]]; then
  echo "ERROR: no symbols matching '$SUBSTR' found in $BINARY" >&2
  echo "  Try: nm $BINARY | c++filt | grep '<substring>'" >&2
  exit 1
fi

echo "Found ${#ADDRS[@]} symbol(s) matching '$SUBSTR':"
for i in "${!ADDRS[@]}"; do
  echo "  0x${ADDRS[$i]}  ${DEMANGLED_NAMES[$i]}"
done

# ── helper: safe file name from demangled symbol ───────────────────────────────
safe_name() {
  # Keep Class::Method leaf, strip namespaces prefix, replace :: → __ and
  # remove characters that are problematic in filenames.
  local s="$1"
  # Strip leading namespaces (everything before the last :: pair that starts a
  # Class name — heuristic: take from the first capital-letter segment onward)
  s="$(printf '%s' "$s" | sed 's/.*::\([A-Z][^:]*::\)/\1/')"
  # Replace :: → __
  s="${s//::/__}"
  # Remove everything after first '(' (parameter list)
  s="${s%%(*}"
  # Strip remaining special chars
  s="$(printf '%s' "$s" | tr -cd 'A-Za-z0-9_~')"
  printf '%s' "$s"
}

# ── try Ghidra headless ────────────────────────────────────────────────────────
USE_GHIDRA=false
if [[ -x "$GHIDRA_HEADLESS" ]]; then
  USE_GHIDRA=true
else
  echo "NOTICE: Ghidra not found at $GHIDRA_HEADLESS — falling back to objdump disassembly." >&2
fi

ghidra_ok=false
if $USE_GHIDRA; then
  # Build comma-separated VA list for DecompAt.java
  VA_LIST="$(IFS=','; echo "${ADDRS[*]/#/0x}")"

  mkdir -p "$GHIDRA_PROJ_DIR"

  # Import + analyse on first run; -process reuses the project on subsequent runs.
  # Ghidra creates <proj_dir>/<proj_name>.gpr after a successful import.
  if [[ -f "$GHIDRA_PROJ_DIR/${GHIDRA_PROJ_NAME}.gpr" ]]; then
    IMPORT_OR_PROCESS=(-process)
  else
    IMPORT_OR_PROCESS=(-import "$BINARY" -overwrite)
  fi

  echo "Running Ghidra headless (this may take several minutes on first import)…"
  NSM_AT="$VA_LIST" NSM_OUT="$OUT_DIR" \
    "$GHIDRA_HEADLESS" "$GHIDRA_PROJ_DIR" "$GHIDRA_PROJ_NAME" \
    "${IMPORT_OR_PROCESS[@]}" \
    -scriptPath "$SCRIPTS_DIR" \
    -postScript DecompAt.java \
    -log "$OUT_DIR/ghidra.log" \
    && ghidra_ok=true || {
      echo "NOTICE: Ghidra run failed (see $OUT_DIR/ghidra.log) — falling back to objdump." >&2
    }
fi

# Check whether Ghidra actually produced output for our symbols
if $ghidra_ok; then
  # DecompAt.java writes files named at_<addr>_fn_<ep>.c — rename to convention
  for i in "${!ADDRS[@]}"; do
    addr="${ADDRS[$i]}"
    name="$(safe_name "${DEMANGLED_NAMES[$i]}")"
    # Find the file Ghidra wrote for this address
    src_file="$(ls "$OUT_DIR/at_${addr}"_fn_*.c 2>/dev/null | head -1 || true)"
    if [[ -n "$src_file" ]]; then
      dest="$OUT_DIR/${name}@${addr}.c"
      # Prepend a header comment with the full demangled name
      {
        echo "// ${DEMANGLED_NAMES[$i]}"
        echo "// Source: NSM binary decompiled via Ghidra (nsm_decomp/, gitignored)"
        echo "// Address: 0x${addr}"
        echo ""
        cat "$src_file"
      } > "$dest"
      rm -f "$src_file"
      echo "  DECOMPILED → $dest"
    else
      echo "NOTICE: Ghidra did not produce output for 0x${addr} (${DEMANGLED_NAMES[$i]}) — using objdump fallback." >&2
      ghidra_ok=false  # trigger fallback for this symbol below
    fi
  done
fi

# ── objdump fallback ───────────────────────────────────────────────────────────
# Run for every symbol if Ghidra was unavailable, or per-symbol if Ghidra missed it.
for i in "${!ADDRS[@]}"; do
  addr="${ADDRS[$i]}"
  name="$(safe_name "${DEMANGLED_NAMES[$i]}")"
  c_file="$OUT_DIR/${name}@${addr}.c"
  s_file="$OUT_DIR/${name}@${addr}.s"

  # Skip if already produced by Ghidra
  [[ -f "$c_file" ]] && continue

  echo "NOTICE: using objdump disassembly for ${DEMANGLED_NAMES[$i]} (not a full decompilation)."
  mangled="${MANGLED_NAMES[$i]}"
  asm="$(objdump --disassemble-symbols="$mangled" "$BINARY" 2>/dev/null || true)"
  if [[ -z "$asm" ]]; then
    echo "WARNING: objdump also failed for $mangled — skipping." >&2
    continue
  fi
  {
    echo "// ${DEMANGLED_NAMES[$i]}"
    echo "// Source: NSM binary — objdump DISASSEMBLY fallback (not decompiled C)"
    echo "// Address: 0x${addr}"
    echo "// See docs/NSM-RE-WORKFLOW.md for the full Ghidra workflow."
    echo ""
    echo "$asm"
  } > "$s_file"
  echo "  DISASSEMBLED → $s_file"
done

echo "Done. Output in $OUT_DIR/"
