#!/usr/bin/env bash
#
# Build the extension zip for one Ghidra release.
#
#   tools/build.sh [--install]
#
# buildExtension does not compile SLEIGH, and a zip without the .sla files
# installs cleanly and then fails at import with "Unsupported language".  This
# compiles every .slaspec with the target release's own compiler, builds the
# zip, and checks that it holds every .sla and the module jar.
#
# --install unpacks the zip into the user Extensions directory of the Ghidra
# that tests/smoke.sh runs (under $GHIDRA_WORK, not your own settings).
#
# Environment:
#   GHIDRA_INSTALL_DIR  Ghidra release to build against (required)
#   JAVA_HOME           JDK the release accepts (21 for Ghidra 12)
#   GHIDRA_WORK         scratch for user.home, settings and Gradle caches
#                       (default scratch/<Ghidra version>)
#   DEBUG               set to show every command and the tools' full output
#
set -euo pipefail
[ -n "${DEBUG:-}" ] && set -x

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=tools/env.sh
. "$ROOT/tools/env.sh"

note "Ghidra $GHIDRA_VERSION ($GHIDRA), $(java -version 2>&1 | grep -v _JAVA_OPTIONS | head -1)"

note "compiling SLEIGH"
rm -f "$ROOT"/data/languages/*.sla
run "$GHIDRA/support/sleigh" -a "$ROOT/data/languages"
for spec in "$ROOT"/data/languages/*.slaspec; do
  [ -s "${spec%.slaspec}.sla" ] || die "no $(basename "${spec%.slaspec}").sla (see $LOG)"
done

note "building $NAME"
rm -f "$ROOT"/dist/*_"$NAME".zip
GRADLE="$GHIDRA/support/gradle/gradlew"
[ -x "$GRADLE" ] || GRADLE="$(command -v gradle)" || die "no gradle: the release has no support/gradle/gradlew and none is on PATH"
( cd "$ROOT" && run "$GRADLE" -PGHIDRA_INSTALL_DIR="$GHIDRA" buildExtension )
ZIP="$(ls "$ROOT"/dist/ghidra_"$GHIDRA_VERSION"_*_"$NAME".zip 2>/dev/null | head -1)"
[ -n "$ZIP" ] || die "buildExtension produced no zip (see $LOG)"

note "checking the zip"
LISTING="$(unzip -Z1 "$ZIP")"
has() { grep -qx "$1" <<<"$LISTING" || die "$(basename "$ZIP") has no $1"; }
has "$NAME/extension.properties"
has "$NAME/lib/$NAME.jar"
for spec in "$ROOT"/data/languages/*.slaspec; do
  has "$NAME/data/languages/$(basename "${spec%.slaspec}").sla"
done
printf '  %s\n' "$ZIP"

if [ "${1:-}" = "--install" ]; then
  note "installing into $EXTENSIONS"
  rm -rf "${EXTENSIONS:?}/$NAME"
  mkdir -p "$EXTENSIONS"
  unzip -q "$ZIP" -d "$EXTENSIONS"
fi
