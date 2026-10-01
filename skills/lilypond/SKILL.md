---
name: lilypond
description: Write correct, compilable LilyPond (.ly) sheet-music code and fix broken scores. Use whenever the user mentions LilyPond, .ly files, engraving sheet music, lead sheets, chord symbols, guitar tab, lyrics under notes, SATB/choir scores, transposing parts, staff size or page layout of scores, MIDI output from notation, lilypond compile errors or warnings, convert-ly, or lilypond-book — even if they do not say the word LilyPond. Pinned to LilyPond 2.26.0.
---

# LilyPond code-writing skill (v2.26.0)

Teach the model to emit valid, compilable `.ly` files on the first try
and to repair broken ones. The reader is an LLM, not a musician:
prefer copy-adaptable code over prose. Every snippet below compiles
under LilyPond 2.26.0.

## Mandatory workflow

Follow these steps in order for every LilyPond task:

1. Translate the request into a plan: key, meter, voices, staves,
   lyrics, chord symbols, layout (paper size, staff size, page count).
2. Start from the nearest file in `templates/`; copy it, do not start
   blank. Single-concept needs start from `examples/`.
3. Write the `.ly` with `\version "2.26.0"` as line 1.
4. Compile with `scripts/check_ly.sh song.ly`.
5. Read EVERY warning, not just errors — warnings are failures.
   Fix them all.
6. Recompile until exit 0 with an empty warning set.
7. Render `scripts/render_preview.sh song.ly` and inspect the page-1
   PNG when image input is available: check octaves, lyric alignment,
   collisions, beaming.
8. Report anything unverified (e.g. "compiled clean, PNG not
   inspected") instead of claiming it looks right.

Write music in small named variables (`melody`, `bass`, `wordsOne`)
so each part compiles and debugs independently.

## Task → reference table

| User wants | Read first |
|---|---|
| any file skeleton, header, book, include | `references/file-structure.md` |
| key/time/clef, notes, rhythm, transpose | `references/pitches-durations-rests.md` |
| basic theory (what is 6/8, intervals, clefs) | `references/music-fundamentals.md` |
| two voices one staff, piano staff, quartet, instrument names | `references/voices-staves-polyphony.md` |
| chord symbols, slash chords, figured bass, grids | `references/chords-and-chordnames.md` |
| lyrics, verses, lead sheet, hymn, SATB | `references/lyrics-and-vocal.md` |
| articulations, dynamics, slurs, text, fonts | `references/articulation-dynamics-markup.md` |
| drums, tab/guitar, piano pedals, ancient chant | `references/special-staves.md` |
| repeats, endings, beaming, barlines, cadenza | `references/repeats-beaming-timing.md` |
| staff size, fit on page, margins, spacing, breaks | `references/layout-paper-spacing.md` |
| override/set/tweak, find a property, hide/move objects | `references/tweaking-and-internals.md` |
| Scheme functions, `#`/`$`, custom commands | `references/scheme-music-functions.md` |
| compile flags, PNG/PDF/MIDI output, convert-ly | `references/command-line-and-tools.md` |
| old forum code, deprecated commands | `references/version-differences.md` |
| any error or warning text | `references/error-catalog.md` |
| quick syntax lookup | `references/cheatsheet.md` |

## Starter: the shape of every file

```lilypond
\version "2.26.0"

\header {
  title = "Piece"
  composer = "Anon."
}

melody = \relative c' {
  \key c \major
  \time 4/4
  c4 d e f | g2 r2 |
}

\score {
  \new Staff \melody
  \layout { }
  \midi { }
}
```

Templates (all compile clean): `lead-sheet.ly`, `piano-grand-staff.ly`,
`satb-lyrics.ly`, `string-quartet.ly`, `guitar-tab.ly`, `drum-part.ly`,
`multi-movement-book.ly` in `templates/`.

## Top LLM mistakes in LilyPond

1. Missing or wrong `\version` — always `\version "2.26.0"` line 1.
2. Unbalanced `{ }` / `<< >>` — count closers before compiling.
3. Missing spaces around tokens (`c4d4`, `}<<`) — LilyPond needs
   whitespace between most tokens.
4. `\relative` octave drift — keep blocks short, re-anchor leaps with
   `'`/`,`, prefer `\relative c'` / `\relative c''` starts.
5. Duration carry-over — restate durations after rests and voice
   changes; end every bar with `|`.
6. Ignoring bar-check warnings — `bar check failed at: X/Y` means the
   bar is wrong; never delete the `|`.
7. `\override` without the context (writes `NoteHead.color` with no
   `Staff.`/`Voice.` where one is needed) or on a context property.
8. `\set` vs `\override` confusion — state goes to `\set`,
   appearance to `\override` (`tweaking-and-internals.md` §3).
9. Lyrics misaligned — use `\new Lyrics \lyricsto "voice"` with a
   named voice; count syllables, `_` skips, `--` hyphens exactly.
10. Chordmode vs note-mode mixup — `<c e g>` in notes, bare `c:7` in
    `\chordmode`; never both at once.
11. `<<{a}{b}>>` vs `{ }` confusion — simultaneous needs `<< >>`.
12. Wrong `\\` usage — `\\` separates voices on one staff only.
13. Invented commands or properties — never guess; look up or compile.
14. Scheme quoting errors — `#` evaluates, `$` inserts, `#'` quotes;
    keep `#{ #}` boundaries clean.
15. Deprecated syntax (`<c-\tweak>`, `\roman`, `\whiteout`, `\%`,
    `\partcombine`, `keySignature`) — see `version-differences.md`.
16. Missing `\new Staff` / `\new Voice` wrappers around bare music.
17. Using a variable before its definition — order files top-down.
18. Naming anything `lyrics` — reserved word; use `wordsOne`.
19. Unterminated hairpins (`\<` with no `\!`) spanning to piece end.
20. Claiming success without compiling — compile every time.

## Bar checks are the self-test

End every bar with `|`. A clean compile with zero `bar check failed`
warnings proves durations sum correctly. When a check fails, recount
that bar (dots, tuplets, unrestated durations after rests) — do not
remove the check.

## The never-invent rule

Never emit a command, grob, property, drum name, chord spelling, or
Scheme function from memory when unsure. Look it up in `references/`
or the 2.26.0 docs, or prove it by compiling a three-line probe file.
A wrong-but-plausible `\override` is silently ignored — the PNG is the
only witness, so inspect it.
