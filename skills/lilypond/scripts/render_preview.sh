#!/bin/sh
# render_preview.sh — compile a .ly file and produce page-1 PNG preview(s)
# plus PDF (and MIDI if a \midi block is present) for visual verification.
# Usage: ./render_preview.sh [-d crop] file.ly
# Extra flags are passed through to lilypond.

set -u

LILYPOND="${LILYPOND:-}"
if [ -z "$LILYPOND" ]; then
    LILYPOND=$(command -v lilypond 2>/dev/null)
fi
if [ -z "$LILYPOND" ]; then
    echo "render_preview.sh: lilypond not found on PATH; set LILYPOND." >&2
    exit 2
fi

LY=""
FLAGS="-dpreview -dresolution=90 -dno-point-and-click"
for a in "$@"; do
    case "$a" in
        *.ly) LY="$a" ;;
        *) FLAGS="$FLAGS $a" ;;
    esac
done
[ -z "$LY" ] && { echo "usage: render_preview.sh [-d crop] file.ly" >&2; exit 2; }

BASE="${LY%.ly}"
echo "render: $LY -> ${BASE}.pdf, ${BASE}.preview*.png, ${BASE}.midi"
# shellcheck disable=SC2086
"$LILYPOND" $FLAGS -o "$BASE" "$LY" 2>&1 | grep -vE '^$'
STATUS=${PIPESTATUS:-0}
if [ "$STATUS" -ne 0 ]; then
    echo "render_preview.sh: compile failed (exit $STATUS)." >&2
    exit 2
fi
PNG=$(ls "${BASE}".*png 2>/dev/null | head -1)
if [ -n "$PNG" ]; then
    for p in "${BASE}".*png; do [ -f "$p" ] && echo "$p"; done
else
    echo "render_preview.sh: no PNG produced; run check_ly.sh for diagnostics." >&2
    exit 1
fi