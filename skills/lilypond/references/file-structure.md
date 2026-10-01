# File structure

Contents: version line · header · variables · score vs book · layout/midi/paper · include · top vs score level.

## 1. Every file starts with \version

```lilypond
\version "2.26.0"
```

Write it first, exactly so, with the pinned version. Without it LilyPond
warns and `convert-ly` cannot tell which syntax rules to apply.

## 2. Canonical skeleton

```lilypond
\version "2.26.0"

\header {
  title = "Piece"
  composer = "Anon."
}

global = {
  \key c \major
  \time 4/4
}

melody = \relative c' {
  \global
  c4 d e f | g2 r2 |
}

\score {
  \new Staff \melody
  \layout { }
  \midi { }
}
```

Work inside out: variables hold music, `\score` assembles it,
`\layout` engraves it, `\midi` performs it.

## 3. \header fields

`title subtitle subsubtitle composer arranger poet opus piece meter
instrument dedication copyright tagline`. Suppress the footer with:

```lilypond
\header { tagline = ##f }
```

Score-level `\header { piece = "..." }` inside a `\score` labels that
movement only. See `templates/multi-movement-book.ly`.

## 4. Variables: define before use

```lilypond
melody = \relative c' { c d e f }   % music variable
words  = \lyricmode { la la la la } % lyric variable
```

Use a variable by naming it: `\melody`. Referring to a variable defined
*later* in the file is an error — order the file top-down:
`\version`, `\header`, variables, `\score`.

## 5. \score, \book, \bookpart

- One `\score { ... \layout { } }` prints one system sequence.
- Add `\midi { }` inside the same `\score` for playback output.
- Several `\score` blocks in one file print in order.
- Wrap movements in `\bookpart`, parts in `\book`:

```lilypond
\book {
  \bookpart {
    \header { subtitle = "I. Fast" }
    \score { \new Staff \movementOne \layout { } \midi { } }
  }
  \bookpart {
    \header { subtitle = "II. Slow" }
    \score { \new Staff \movementTwo \layout { } \midi { } }
  }
}
```

Full example: `templates/multi-movement-book.ly`.

## 6. \layout, \midi, \paper

- `\layout { }` inside `\score`: engraving for that score
  (staff size, contexts, spacing overrides).
- `\midi { }` inside `\score`: performance for that score
  (tempo, instruments). Silent without it — no MIDI file is written.
- `\paper { }` at top level: page setup for the whole book
  (size, margins). Never put `\paper` inside `\score`.
- `\layout` at top level applies to every score in the file.

## 7. \new and \context

`\new Staff`, `\new Voice`, `\new Lyrics`, `\new ChordNames`,
`\new DrumStaff`, `\new TabStaff`, `\new PianoStaff`,
`\new StaffGroup`, `\new ChoirStaff` create contexts.
Give voices a name whenever lyrics or MIDI lanes attach to them:

```lilypond
\new Voice = "mel" { \melody }
\new Lyrics \lyricsto "mel" \words
```

## 8. \include

```lilypond
\include "english.ly"      % installed language / init files
\include "parts/violin.ily" % your own files, relative to the .ly file
```

Included files are pasted at that point, so `\include` a file of
variable definitions *before* the `\score` that uses them.

## 9. Top level vs score level

| Top level (outside `\score`) | Score level (inside `\score`) |
|---|---|
| `\version`, `\header`, `\paper` | music, `\new` contexts |
| variable definitions | `\layout`, `\midi` |
| `\book`, `\bookpart` | `\header` (movement title) |
| `\include`, Scheme `#(define ...)` | `\override` for that score |

Putting `\layout` at top level affects all scores; putting it in one
`\score` affects only that score.

## 10. Gotchas

- Bare music with no `\score` still prints in 2.26 (implicit score +
  default layout) — but without `\layout`/`\midi` you get no control
  and no MIDI file. Always write the `\score` explicitly.
- `\midi { }` with no `\layout { }` still works: you get MIDI, no PDF pages.
- `lyrics` is a reserved word — never name a variable `lyrics`
  (use `wordsOne`, `verseOne`). The error is:
  `error: syntax error, unexpected \lyrics`.

## 11. MIDI output and instruments

```lilypond
\score {
  \new Staff \melody
  \layout { }
  \midi {
    \tempo 4 = 100
  }
}
```

No `\midi` block, no MIDI file. Instruments per staff (General MIDI
names, lowercase):

```lilypond
\new Staff \with { midiInstrument = "violin" } \violinOne
\set Staff.midiInstrument = "acoustic grand"
```

Common names: `acoustic grand`, `bright acoustic`, `electric grand`,
`honky-tonk`, `electric piano`, `violin`, `viola`, `cello`,
`contrabass`, `harp`, `acoustic guitar (nylon)`,
`acoustic guitar (steel)`, `electric guitar (jazz)`, `flute`,
`clarinet`, `oboe`, `bassoon`, `trumpet`, `trombone`, `french horn`,
`tuba`, `alto sax`, `tenor sax`, `recorder`, `choir aahs`,
`church organ`, `harpsichord`. Drums play on channel 10 automatically
in `DrumStaff`. Repeats unfold in MIDI with `\unfoldRepeats` around
the music; `\articulate` (include `articulate.ly`) humanizes
articulations; `\swing` adds swing feel — both wrap the music, not the
`\midi` block.
