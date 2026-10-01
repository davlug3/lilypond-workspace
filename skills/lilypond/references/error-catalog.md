# Error catalog (message → cause → fix)

Every entry below was produced by compiling a broken file with LilyPond
2.26.0. Match the message, apply the fix, recompile with
`scripts/check_ly.sh`.

## 1. `warning: no \version statement found, please add`

Cause: `\version` missing or not on line 1.
Fix: put `\version "2.26.0"` first.

## 2. `error: syntax error, unexpected X`

Cause: unbalanced `{ }` / `<< >>`, a reserved word misused as a name,
or a command in the wrong mode. Three frequent shapes:

```
error: syntax error, unexpected \lyrics
```
Variable named `lyrics` (reserved). Rename to `wordsOne`.

```
error: syntax error, unexpected \layout
...
error: syntax error, unexpected end of input, expecting '}'
```
Unclosed `{` or `<<` earlier — count closers from the top.

```
error: post-event expected
```
Old-style `<c-\tweak ...>` inside a chord, or markup returned from a
music function. Use prefix `\tweak color #blue <c e g>1`.

## 3. `warning: bar check failed at: X/Y`

Cause: the bar holds X/Y of a measure — under- or over-full.
Fix: recount durations (dots? tuplets? missing rest restatement?),
then recompile. Never delete the `|`; it is the self-test.

## 4. `error: bad grob property path`

Cause: `\override` names something that is not `Grob.property` —
a misspelled grob (`NoteHed.color`) or a context property forced
through `\override` (`Staff.instrumentName`).
Fix: for context state use `\set Staff.instrumentName = ...`;
for appearance check the grob name in the Internals Reference.

## 5. `warning: cannot find or create context: X` + `the property ... does not exist`

Cause: `\set` aimed at a grob (`\set NoteHead.color`).
Fix: appearance changes go through `\override NoteHead.color`.

## 6. Lyrics shifted by one note

No error is printed — the PNG shows words under the wrong notes.
Cause: syllable count ≠ note count (missing `_` skip or `--` hyphen).
Fix: count syllables against notes; recompile after every verse edit.

## 7. Unterminated hairpin spans to the end

A `\<` with no `\!` (or closing dynamic) stretches past its bar,
sometimes with a warning, sometimes silently. Fix: end every hairpin.

## 8. `errors found, ignoring music expression` + `Unfinished main input`

Cause: an earlier error poisoned the parse — almost always unbalanced
brackets or a stray command. Fix: repair the FIRST reported error;
the cascade usually vanishes.

## 9. Silent wrong output (no message at all)

- `\override` with a wrong-but-plausible property name: ignored, no
  warning. Look the property up; do not guess twice.
- `\relative` octave drift: right rhythm, wrong octave. Shorten the
  `\relative` block and re-anchor leaps.
- Chordmode/note-mode mixup: symbols print as notes or vice versa.
  Check which mode the block is in.

## 10. Triage order

1. Read the FIRST error only; fix it.
2. Recompile — cascades collapse.
3. Then fix warnings top-down (bar checks, hairpins, contexts).
4. Finally inspect the page-1 PNG (`render_preview.sh`) for silent
   errors: octaves, lyric alignment, collisions.
