#!/usr/bin/env python3
"""barcalc.py -- sum LilyPond bar durations so probes stop failing on
arithmetic. Reads a bar body on argv, prints the total as N/16 and whether it
fills one 4/4 bar.

    python3 barcalc.py 'c4 d e f'
    python3 barcalc.py '\\tuplet 3/2 { c8 d e } c4'

Rules implemented: duration digits (1 2 4 8 16 32 64), dots, tuplets
(N notes in the time of M), and note/rest/spacer tokens a-g r R s.
"""
import re
import sys

BASE = {"1": 16, "2": 8, "4": 4, "8": 2, "16": 1, "32": 0.5, "64": 0.25}
# Tokens are notes/chords/rests. The command prefix (\\autoBeamOff and
# friends) is skipped explicitly, because \\autoBeamOff starts with "a" and
# would otherwise be misread as an "a" pitch, adding a spurious quarter note.
COMMAND = re.compile(r"\\[A-Za-z]+")
TOKEN = re.compile(r"(?:<[^>]*>)?\s*([a-gA-G]|[rsS])((?:[0-9]+)(?:\.{1,2})?|:)?(?![\w.])")
TUPLET = re.compile(r"\\tuplet\s+(\d+)\s*/\s*(\d+)\s*\{")


def sum_tokens(text, carried=None):
    """Total of a token stream, honouring nested \\tuplet groups.

    Implements LilyPond's duration carry-over: a note or rest with no
    explicit duration repeats the previous one. That carry-over is the exact
    rule the probes keep tripping over, so the calculator has to model it.
    `carried` is the inherited duration (in /16 units) into this group.
    """
    total = 0.0
    last = carried
    i = 0
    while i < len(text):
        # Tuplet must be recognised BEFORE the generic command skip, or
        # "\tuplet" is consumed as a plain command and its group never scaled.
        m = TUPLET.search(text, i)
        tok = TOKEN.match(text, i)
        cmd = COMMAND.match(text, i)
        if m and (not tok or m.start() < tok.start()):
            depth = 1
            j = m.end()
            while j < len(text) and depth:
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                j += 1
            inner = sum_tokens(text[m.end(): j - 1])
            # N notes printed in the time of M: scale so M notes fit N slots.
            n, den = int(m.group(1)), int(m.group(2))
            total += inner * den / n
            i = j
            continue
        if cmd and (not tok or cmd.start() < tok.start()):
            i = cmd.end()
            continue
        if tok:
            dur = tok.group(2)
            if dur:
                digits = re.match(r"(\d+)(\.*)", dur)
                if digits:
                    base = BASE.get(digits.group(1), 0)
                    val = base
                    if len(digits.group(2)) == 1:
                        val *= 1.5
                    elif len(digits.group(2)) == 2:
                        val *= 1.75
                    last = val
                elif dur.startswith(":") and last is not None:
                    # tremolo shorthand c4:32 -- the note keeps its own value
                    pass
            if last is not None:
                total += last
            i = tok.end()
            continue
        i += 1
    return total


def report(bar):
    total = sum_tokens(bar)
    print(f"{bar!r}\n  total = {total:g}/16  ({total / 16:g} of a 4/4 bar)")
    if abs(total - 16) < 1e-9:
        print("  OK - fills the bar")
    else:
        print(f"  SHORT by {16 - total:g}/16" if total < 16 else f"  OVER by {total - 16:g}/16")


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        report(arg)