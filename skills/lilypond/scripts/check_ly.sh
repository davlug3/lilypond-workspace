#!/bin/sh
# check_ly.sh — compile a LilyPond file, print a clean verdict.
# Exit codes (the skill's verify-and-fix loop depends on these):
#   0 = compiled with NO errors and NO warnings
#   1 = compiled but emitted warnings (fix them anyway)
#   2 = compile errors or misuse
# Usage: ./check_ly.sh [lilypond-options] file.ly
# Options are passed through to lilypond (e.g. -o name).

set -u

LILYPOND="${LILYPOND:-}"
if [ -z "$LILYPOND" ]; then
    LILYPOND=$(command -v lilypond 2>/dev/null)
fi
if [ -z "$LILYPOND" ]; then
    echo "check_ly.sh: lilypond not found on PATH; set LILYPOND=/path/to/lilypond." >&2
    exit 2
fi

LY=""
FLAGS=""
for a in "$@"; do
    case "$a" in
        *.ly)
            if [ -n "$LY" ]; then
                echo "check_ly.sh: only one .ly input supported." >&2
                exit 2
            fi
            LY="$a"
            ;;
        *)
            FLAGS="$FLAGS $a"
            ;;
    esac
done

if [ -z "$LY" ]; then
    echo "usage: check_ly.sh [lilypond-options] file.ly" >&2
    exit 2
fi
if [ ! -f "$LY" ]; then
    echo "check_ly.sh: no such file: $LY" >&2
    exit 2
fi

BASE="${LY%.ly}"
LOGFILE=$(mktemp 2>/dev/null || echo "${TMPDIR:-/tmp}/check_ly_$$.log")
trap 'rm -f "$LOGFILE"' EXIT HUP INT TERM

# shellcheck disable=SC2086
"$LILYPOND" -dno-point-and-click -o "$BASE" $FLAGS "$LY" >"$LOGFILE" 2>&1
STATUS=$?

echo "=== compile log for: $LY ==="
cat "$LOGFILE"
echo "=== END LOG (exit $STATUS) ==="

if grep -qE ':[0-9]+:[0-9]+:[[:space:]]*(error|fatal)' "$LOGFILE"; then
    echo "RESULT: FAIL (compile errors)." >&2
    exit 2
fi
if grep -qE ':[0-9]+:[0-9]+:[[:space:]]*warning' "$LOGFILE"; then
    echo "RESULT: WARNINGS — treat as FAIL; fix them." >&2
    exit 1
fi
if [ "$STATUS" -ne 0 ]; then
    echo "RESULT: FAIL (exit $STATUS)." >&2
    exit 2
fi
echo "RESULT: OK — clean compile."
exit 0