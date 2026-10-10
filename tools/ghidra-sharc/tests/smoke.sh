#!/usr/bin/env bash
#
# Import each case under tests/cases/ into a headless Ghidra that has the
# extension installed (tools/build.sh --install), disassemble it with
# tests/SmokeTest.java and compare the result with the case's expected.txt.
#
#   tests/smoke.sh [--update] [case ...]
#
# A case directory holds
#   input.hex     the image as hex bytes ('#' starts a comment)
#   case.conf     LANGUAGE, CSPEC (default "default"), LOADER (default
#                 BinaryLoader), BASE (the load address, for BinaryLoader),
#                 RANGES (start/end address pairs to disassemble; default:
#                 every initialized executable block)
#   expected.txt  the SMOKE lines SmokeTest.java prints
#
# --update rewrites expected.txt from the current output instead of comparing.
# Environment as for tools/build.sh (GHIDRA_INSTALL_DIR, JAVA_HOME,
# GHIDRA_WORK, DEBUG).
#
set -euo pipefail
[ -n "${DEBUG:-}" ] && set -x

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=tools/env.sh
. "$ROOT/tools/env.sh"

UPDATE=
[ "${1:-}" = "--update" ] && { UPDATE=1; shift; }
[ -d "$EXTENSIONS/$NAME" ] || die "$NAME is not installed for this Ghidra; run tools/build.sh --install"

CASES=("$@")
if [ ${#CASES[@]} -eq 0 ]; then
  for d in "$ROOT"/tests/cases/*/; do CASES+=("$(basename "$d")"); done
fi
# Ghidra refuses project paths with a component starting with '.'.
PROJECT="$(mktemp -d "${TMPDIR:-/tmp}/ghidra-smoke-XXXXXX")"
trap 'rm -rf "$PROJECT"' EXIT
PREFIX="$(printf '%s' "$NAME" | tr '[:upper:]' '[:lower:]')"

failed=0
for c in "${CASES[@]}"; do
  dir="$ROOT/tests/cases/$c"
  [ -f "$dir/case.conf" ] || die "no case $c"
  LANGUAGE= CSPEC=default LOADER=BinaryLoader BASE= RANGES=
  # shellcheck disable=SC1091
  . "$dir/case.conf"
  image="$WORK/$c.bin"
  sed 's/#.*//' "$dir/input.hex" | python3 -c \
    'import sys; sys.stdout.buffer.write(bytes.fromhex("".join(sys.stdin.read().split())))' >"$image"
  args=(-loader "$LOADER")
  [ -n "$BASE" ] && args+=(-loader-baseAddr "$BASE")
  LOG="$WORK/smoke-$c.log"; : >"$LOG"

  run "$GHIDRA/support/analyzeHeadless" "$PROJECT" smoke \
    -import "$image" "${args[@]}" -processor "$LANGUAGE" -cspec "$CSPEC" \
    -noanalysis -scriptPath "$ROOT/tests" -postScript SmokeTest.java "$PREFIX" $RANGES \
    -deleteProject
  actual="$WORK/$c.txt"
  sed -n 's/.*SmokeTest.java> \(SMOKE .*\) (GhidraScript).*/\1/p' "$LOG" >"$actual"
  [ -s "$actual" ] || die "$c: SmokeTest printed nothing (see $LOG)"

  if [ -n "$UPDATE" ]; then
    cp "$actual" "$dir/expected.txt"
    note "$c: updated expected.txt ($(wc -l <"$actual" | tr -d ' ') lines)"
  elif diff -u "$dir/expected.txt" "$actual"; then
    note "$c: ok"
  else
    note "$c: FAILED"
    failed=1
  fi
done
exit $failed
