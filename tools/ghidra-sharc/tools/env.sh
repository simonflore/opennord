# Shared setup for tools/build.sh and tests/smoke.sh (sourced; expects $ROOT).
#
# Everything Ghidra and Gradle write goes under $GHIDRA_WORK, so a build never
# touches your own Ghidra settings, installed extensions or Gradle caches.

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
note() { printf '== %s\n' "$*"; }

NAME="$(sed -n 's/^rootProject.name *= *"\(.*\)"/\1/p' "$ROOT/settings.gradle")"
[ -n "$NAME" ] || die "no rootProject.name in settings.gradle"

GHIDRA="${GHIDRA_INSTALL_DIR:-}"
[ -n "$GHIDRA" ] || die "set GHIDRA_INSTALL_DIR to the Ghidra release to build against"
GHIDRA="$(cd "$GHIDRA" 2>/dev/null && pwd)" || die "no such directory: $GHIDRA_INSTALL_DIR"
PROPS="$GHIDRA/Ghidra/application.properties"
[ -f "$PROPS" ] || die "$GHIDRA is not a Ghidra install (no Ghidra/application.properties)"
prop() { sed -n "s/^$1=//p" "$PROPS" | tr -d '\r'; }
GHIDRA_VERSION="$(prop application.version)"
GHIDRA_RELEASE="$(prop application.release.name)"

[ -n "${JAVA_HOME:-}" ] && export PATH="$JAVA_HOME/bin:$PATH"
command -v java >/dev/null || die "no java: install JDK $(prop application.java.min)+ or set JAVA_HOME"

WORK="${GHIDRA_WORK:-$ROOT/scratch/$GHIDRA_VERSION}"
mkdir -p "$WORK/home/.config" "$WORK/home/.cache" "$ROOT/scratch/gradle"
WORK="$(cd "$WORK" && pwd)"
LOG="$WORK/$(basename "$0" .sh).log"
: >"$LOG"
# Ghidra puts its settings (and user-installed extensions) under
# $XDG_CONFIG_HOME/ghidra/ghidra_<version>_<release>; keeping that inside
# user.home keeps the directory name free of a user-name prefix.
export _JAVA_OPTIONS="-Duser.home=$WORK/home"
export XDG_CONFIG_HOME="$WORK/home/.config"
export XDG_CACHE_HOME="$WORK/home/.cache"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$ROOT/scratch/gradle}"
EXTENSIONS="$XDG_CONFIG_HOME/ghidra/ghidra_${GHIDRA_VERSION}_${GHIDRA_RELEASE}/Extensions"

# Run a noisy tool: its output goes to $LOG (or the terminal under DEBUG), and
# the end of the log is shown if it fails.
run() {
  if [ -n "${DEBUG:-}" ]; then
    "$@" 2>&1 | tee -a "$LOG"
    return "${PIPESTATUS[0]}"
  fi
  "$@" >>"$LOG" 2>&1 || {
    printf 'error: failed: %s\n' "$*" >&2
    tail -n 30 "$LOG" >&2
    printf '(full log: %s)\n' "$LOG" >&2
    return 1
  }
}
