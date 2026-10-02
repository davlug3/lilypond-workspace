---
name: lilypond
description: LilyPond (.ly) music engraving — write, compile, and tweak sheet music scores. Use when creating or editing LilyPond files, compiling scores to PDF/PNG/MIDI, fixing notation output, or working with pitches, rhythms, voices, staves, lyrics, chords, MIDI, overrides, and layout.
---

# LilyPond Music Engraving (v2.24)

LilyPond is a text-based music compiler (like LaTeX for scores): write `.ly`
text, run `lilypond`, get PDF/PNG/MIDI. One source produces the full score
and all parts. This skill covers the v2.24 stable docs end to end.

## Retrieval sources (prefer over pre-training)

Syntax is version-sensitive. When unsure, fetch the official docs:

| Source | URL | Use for |
|--------|-----|---------|
| Learning Manual | `https://lilypond.org/doc/v2.24/Documentation/learning/index` | install, tutorial, concepts, tweaking, templates |
| Notation Reference | `https://lilypond.org/doc/v2.24/Documentation/notation/index` | exact syntax for every notation element |
| Application Usage | `https://lilypond.org/doc/v2.24/Documentation/usage/index` | CLI flags, `convert-ly`, `lilypond-book`, errors |
| Extending | `https://lilypond.org/doc/v2.24/Documentation/extending/index` | Scheme functions, markup, callbacks |
| Internals | `https://lilypond.org/doc/v2.24/Documentation/internals/index` | Grob/context/engraver property reference |
| Essay (architecture) | `https://lilypond.org/doc/v2.24/Documentation/essay/building-software` | why contexts/engravers exist |
| Snippets / LSR | `https://lilypond.org/doc/v2.24/Documentation/snippets/index`, `https://lsr.di.unimi.it` | copy-paste recipes |
| Manuals index | `https://lilypond.org/doc/v2.24/Documentation/web/manuals` | split-HTML / big-HTML / PDF formats |

## 1. Core philosophy and architecture

- **Compiled, not drawn.** No dragging notes onto a canvas. Text in,
  engraved notation out. This gives deterministic output, diffable sources,
  and scriptable part extraction.
- **Content vs. presentation split.** Input like `fis4` means "F-sharp
  quarter", not "black dot here". `\key`, clefs, and accidental rules decide
  how it prints. Consequence: you must always type the true pitch
  (`cis`/`bes`), even when the key signature would imply it.
- **Music expressions compose.** Sequential `{ }`, simultaneous `<< >>`
  (with `\\` separating voices), chords `< >`. They nest to arbitrary depth
  and are defined by a context-free grammar.
- **Contexts hold state.** Hierarchy: `Score > StaffGroup/PianoStaff >
  Staff > Voice`, plus `Lyrics`, `ChordNames`, `TabStaff`, etc. Bar lines
  sync at `Score` level; accidentals are remembered at `Staff` level;
  stems/slurs live at `Voice` level.
- **Engravers are plug-ins.** Each draws one symbol class
  (`Note_heads_engraver`, `Stem_engraver`, `Clef_engraver`, ...). Grouped
  per context. Add/remove them to change what gets printed at all.
- **Grobs are the drawing objects.** Every visible item is a grob with
  settable properties (`color`, `direction`, `padding`, `font-size`,
  `transparent`, `stencil`, ...). Tweaking = reading/writing grob properties.
- **Scheme (Guile) runs underneath.** `#value` enters Scheme mode for
  numbers, booleans (`##t`/`##f`), symbols, lists, and functions. Deep
  customization is Scheme; everyday work stays in the `\command` DSL.
- **Auto-engraving does the hard part.** Optical spacing, beaming,
  collision avoidance, accidental placement, line/page breaking. Describe
  intent; override only where the default displeases you.

## 2. Setup, compile, upgrade

### Install

```bash
# Debian/Ubuntu
sudo apt install lilypond
# macOS (either)
brew install lilypond
sudo port install lilypond
# Any OS: download from https://lilypond.org/download, unpack, run
/path/to/lilypond-x.y.z/bin/lilypond file.ly
lilypond --version
```

Editors: Frescobaldi (docs' recommendation: highlight, completion,
point-and-click PDF, MIDI play), Emacs/Vim modes (see Usage "Text editor
support"), or any plain-text editor. Never Word/rich text.

### Compile

```bash
printf '\\version "2.24.4"\n{ c'"'"' }\n' > test.ly
lilypond --pdf test.ly          # test.pdf
lilypond --png --pdf score.ly   # PNG + PDF
lilypond -dno-point-and-click -o out score.ly
```

Outputs: PDF (print), PNG (web), MIDI (only if a `\midi { }` block exists).
Useful flags: `--pdf --png --midi`, `-o` output name/prefix, `-dno-point-and-click`
(faster big runs, smaller PDFs), `--loglevel`, `-dverbose`.

### Upgrade

- First line of every file: `\version "2.24.4"` (quoted). Required for
  `convert-ly` and for anyone helping you.
- `convert-ly -e *.ly` auto-migrates syntax across versions. Some jumps need
  manual fixes; see Usage "Manual conversions".
- To support several versions, gate on version tests (see Usage "Writing code
  to support multiple versions") rather than forking files.

## 3. Fundamental concepts

### 3.1 File skeleton

A `\score` holds exactly one compound music expression. `\header`,
`\layout`, `\midi`, `\paper` are not music and may sit inside or outside
`\score` (a `\layout` inside affects only that score; outside affects the
whole `\book`).

```lilypond
\version "2.24.4"
\header {
  title = "Title"
  composer = "Name"
  % instrument, subtitle, poet, meter, tagline, copyright also common
}
\paper {
  % page size, margins, line-width, systems-per-page
}
\score {
  % exactly ONE music expression here, usually << ... >>
  \layout { }   % produce printed output
  \midi { \tempo 4 = 100 }  % produce MIDI output
}
```

Without explicit blocks LilyPond invents them: bare `{ c' d' }` becomes an
implicit `\book > \score > \Staff > \Voice`. Fine for toys; for real pieces
declare contexts explicitly or implicit creation yields surprise extra staves.

Multiple `\score` blocks = one output file with several pieces. Multiple
`\book` blocks = separate output files.

### 3.2 Lexical rules

- Case sensitive. `{ c' d' }` valid, `{ C D }` error.
- Music must sit in `{ }`; pad braces with spaces.
- Commands start with `\`: `\time`, `\key`, `\clef`, `\relative`, `\tuplet`.
- Comments: `%` to end of line. Inside Scheme code use `;` instead —
  `%` there triggers "Unbound variable %" errors.
- Files must be UTF-8 (else `FT_Get_Glyph_Name` errors).
- Variable names: alphabetic by convention
  (`melody`, `upper`, `keyTime`); invoke with backslash: `\melody`.

### 3.3 Pitches

- Default language is Dutch (`nederlands`): `c d e f g a b`.
- Alterations suffix the base: sharp `is`, flat `es`, double `isis`/`eses`:
  `cis fisis bes aeses`. `c` always means C-natural in the input.
- Octave marks: `'` up, `,` down, repeatable (`''`, `,,`). Middle C = `c'`.
- Other languages available (`\language "english"` etc.); see Notation
  "Note names in other languages". Pick one per file and stay with it.
- `\relative START { ... }` picks the octave closest to the previous note
  (within 3 staff spaces). Accidentals are ignored in that distance
  calculation. Always give the start pitch: `\relative c' { ... }`.
  For absolute (non-relative) entry see Learning "Absolute note names".
- Octave checks: append `=` plus expected pitch (e.g. `c'=`) at strategic
  points so drift is caught at compile time.

### 3.4 Durations, rests, bars

- `1 2 4 8 16 32 ...` after the pitch; `.` dots it: `a4. a8`. A missing
  duration repeats the previous one. State durations explicitly at section
  starts so cut-paste stays correct.
- Rests: `r4 r2 r8`. Full-measure rest: `R1`, multi-measure: `R2*3`.
  Spacer (invisible, for aligning voices): `s4`. Compress groups with
  `\compressMMRests { ... }`.
- Bar lines are automatic; force with `|`. Bar checks `|` after each bar make
  duration mistakes loud instead of pushing music off the page.
- `\time 3/4`, `\partial 8` (pickup/anacrusis), `\tempo "Andante" 4 = 120`
  or `\tempo 4. = 96`.
- Beams automatic; manual: `c8[ d e]`. Tuplets: `\tuplet 3/2 { f8 g a }`.
  Grace: `\grace { a32 b }`, also `\appoggiatura` / `\acciaccatura`.

### 3.5 Signatures that matter

```lilypond
\clef treble          % also alto tenor bass, plus "treble_8" etc.
\key d \major         % \major or \minor; pitch arg is absolute (d = D-natural)
\time 4/4
\tempo "Presto" 4 = 120
```

`\key` changes only the printed signature and accidental rules, never the
input pitch. In `\key d \major` you still type `fis`, never `f`.

### 3.6 Variables, includes, functions

```lilypond
violin = \new Staff \relative c'' { a4 b c b }
tripletA = \relative c' { \tuplet 3/2 { c8 e g } }
barA = { \tripletA \tripletA }
{ \barA \barA }
\include "horn-music.ly"   % paste another file here
```

Define before use; reuse across score and parts. Variables hold music,
strings, numbers, even `\paper { }` blocks. For real functions with
arguments see Learning "Saving typing with variables and functions" and the
Extending manual.

### 3.7 Voices

One melodic line = one `Voice`. Quick polyphony: `<< { ... } \\ { ... } >>`.
Explicit (preferred for long scores): name voices and set stem/slur
direction:

```lilypond
\new Staff <<
  \new Voice = "up"   { \voiceOne   \relative c'' { e4 f g a } }
  \new Voice = "down" { \voiceTwo   \relative c'  { c4 d e f } }
>>
```

- `\voiceOne`/`\voiceThree` = stems up; `\voiceTwo`/`\voiceFour` = down;
  `\oneVoice` = reset to solo behavior.
- Same-direction collisions warn ("needs a `\voiceXx` or `\shiftXx`").
  Fix with `\voiceOne..Four`, `\shiftOn(n)(n)`, or `\shiftOff`.
- Note columns shift automatically to avoid head collisions; `s` spacers pad
  silent stretches of a voice.

### 3.8 Contexts and engravers (practical)

- Create: `\new Staff`, `\new Voice`, `\new Lyrics`, `\new ChordNames`,
  `\new PianoStaff`, `\new StaffGroup`, `\context`. Name them
  (`\new Staff = "solo"`) when lyrics/transposition target them.
- Set context properties: `\set Staff.instrumentName = "Violin"`.
- One-off context defaults: `\with { ... }` on creation.
- Change engravers (what gets drawn at all):
  ```lilypond
  \new Staff \with {
    \remove "Time_signature_engraver"
  } { ... }
  ```
- Common hierarchy: `Score` (bar sync) > `PianoStaff`/`StaffGroup` >
  `Staff` (accidentals, clef) > `Voice` (notes, stems, slurs).
- Polymeter (e.g. 4/4 against 3/4) means moving bar-line sync out of
  `Score`; see Notation "Contexts explained".

## 4. Notation coverage (what to reach for)

- **Ties/slurs/phrasing:** `g4~ g` tie (same pitch only; bare durations
  allowed after: `g4~ 4`); `d4( c16)` slur; `g4\( ... \)` phrasing slur.
  They nest: `c''4(~ c8 d~ 4 e)`.
- **Articulations/fingering:** dash plus code: `c4-^ c-+ c-- c-! c-> c-.
  c-_`, fingering `c4-3`. Direction: `-` auto, `^` up, `_` down.
- **Dynamics:** `\pp \p \mp \mf \f \ff`, hairpins `c2\< c \f`, `c4\ff\> c
  c c\!`. `\!` closes an open hairpin.
- **Text/markup:** `c4^"pizz."`, `c4_\markup { \italic dolce }`. Long
  outside-staff text usually needs `\textLengthOn`.
- **Chords:** `<c' e' g'>4`; single-note tweaks inside chords need `\tweak`
  or `\single` (see section 6).
- **Chord names:** `\chordmode { c1 g:7 c }` in a `\new ChordNames` context.
- **Repeats:** `\repeat volta 2 { ... }`, `\alternative { { ... } { ... } }`,
  tremolo and percent repeats; see Notation "Repeats".
- **Lyrics:** `\lyricmode { ... }` + `\lyricsto "voicename"`. Hyphen between
  syllables: `--` (spaced). Melisma (one syllable, many notes): slur the
  notes or put `_` per extra note. Extender line: `__` (spaced). Several
  syllables on one note: `go_al` or quotes.
- **Transposition:** `\transpose f c' \hornNotes` (horn in F example from
  Learning 4.4.5). From-pitch first, to-pitch second.
- **Clefs/keys/times mid-piece:** just restate `\clef`, `\key`, `\time`;
  cautionary accidentals and styles via Notation "Automatic accidentals".
- **Ornaments:** `\trill`, `\mordent`, `\turn`, arpeggios, glissandi,
  falls/doits; see Notation "Expressive marks".
- **Percussion/tablature/figured bass/ancient notation:** dedicated contexts
  (`DrumStaff`, `TabStaff`, `FiguredBass`, mensural/Gregorian templates).
  Start from Appendix A templates, not from scratch.
- **MIDI:** needs `\midi { }`. Control with `\tempo`, per-staff
  `\set Staff.midiInstrument = "flute"`, dynamics, and
  `\unfoldRepeats` for repeats. Fermatas need explicit time-stretch for MIDI
  (Learning "Simulating a fermata in MIDI"). No `\midi` = no `.midi`, by
  design.
- **Page control:** `\header`, `\paper { #(set-paper-size "a5")
  line-width = 60 }`, `\layout`, system/page breaks, vertical spacing
  (`staff-staff-spacing`, `stretchability`), `\book` for multi-file output.

## 5. Templates — start here, not from blank

Copy from Learning Appendix A, then fill variables:

| Need | Template |
|------|----------|
| Solo / melody + lyrics / chords | A.2 single-staff set |
| Solo piano, piano + voice | A.3 `solo-piano` and siblings |
| String quartet (+ parts) | A.4 |
| SATB / SSAATTBB / hymn / psalm | A.5; A.1 built-ins |
| Orchestra + choir + piano | A.6 |
| Jazz combo | A.8 |
| Mensural / Gregorian | A.7 |

Building from scratch (organ-prelude pattern, Learning 4.4.3): header,
shared `keyTime` variable, one music variable per voice, then mirror the
staff tree in `\score` (`PianoStaff` for braced pairs, `<< >>` around
simultaneous staves, `\voiceOne`/`\voiceTwo` per multi-voice staff).

Scores-and-parts pattern (Learning 4.4.5): enter music once in
`horn-music.ly` as `hornNotes`, then `\include` it in both a transposed
part file and the combined score file.

## 6. Tweaking output (the override system)

Order of escalation: `\once` < `\override`/`\revert` < `\tweak`/\
`single` < `\with` / stylesheet < Scheme.

```lilypond
\relative c' {
  c4 d
  \override NoteHead.color = "red"   % all following note heads, this context
  e4 f
  \once \override NoteHead.color = "green"  % next note head only
  g4 a
  \revert NoteHead.color             % back to default (not "previous")
  b4 c
}
```

- General form: `\override [Context.]Grob.property = #value`
  (`\override Staff.NoteHead.color = #red`). Context often omittable for
  `Voice`-level grobs; mandatory when ambiguous (the classic extra-staff
  bug is an override landing on an implicitly created context — put the
  override *inside* the `\new Staff { }`).
- `\set` = context property (`\set Staff.instrumentName = ...`);
  `\override` = grob (layout object) property. Do not mix them up.
- `\tweak prop #value` (no `=`, no context) hits only the immediately
  following item — the way to color one head inside `<c e g>`. Long form
  names the grob: `\tweak Accidental.color #red cis''4`.
- `\single \myOverrideFn` turns an override-function into a tweak so it
  applies to one chord member.
- Scheme values need `#`: `\override NoteHead.font-size = #-3`,
  booleans `##t` / `##f`, strings `"red"`.
- Useful grob properties: `color`, `transparent`, `stencil = ##f`
  (invisible but spaced), `font-size`, `direction`, `padding`,
  `staff-padding`, `extra-offset`, `positions`, `force-hshift`,
  `outside-staff-priority`, `break-visibility`, thickness/length pairs.
- Find any property: Internals grob pages list every interface and default;
  `\displayLilyMusic` and point-and-click reveal grob names.
- Collisions: prefer `padding`/`staff-padding`/`positions` over
  `extra-offset` (which blinds the spacing engine). Fix real overlaps with
  `\voiceXx`/`\shiftXx` first.
- Keep music/style separate: layout overrides belong in `\layout { }` or an
  imported `.ily` stylesheet, not scattered through notes. See Learning
  "Style sheets".

## 7. CLI, companion tools, editors

- `lilypond [options] file.ly ...` — shell globbing works; `-o` sets output
  prefix; `--pdf/--png/--midi/--svg` select backends; `-d...` sets Scheme
  options (`-dno-point-and-click`, `-dverbose`); see Usage "Command-line usage".
- `convert-ly` — syntax migrator; always keep `\version` so it knows the
  source dialect.
- `lilypond-book` — embeds fragments in LaTeX/Texinfo/HTML/DocBook for
  musicological writing.
- `midi2ly`, `musicxml2ly`, `abc2ly`, `etf2ly` — import from other formats
  (quantized starting points, always hand-fix after).
- Point-and-click: click a PDF note to jump to its source line (needs a
  supported viewer; disable for release builds).
- Frescobaldi / Emacs / Vim / VS Code extensions give highlight, completion,
  and templates; LilyPond itself stays editor-agnostic.
- Large-project builds: `make`/Makefiles compiling parts and score from
  shared includes; see Usage "Make and Makefiles".

## 8. Agent workflow (how to work a task)

1. **Start from a template**, never blank. Copy the closest Appendix A
   example.
2. **One bar per line, bar checks everywhere**, explicit durations at section
   starts. Compile early: `lilypond --pdf file.ly`.
3. **Read the log bottom-up.** Fix the first error; later ones are usually
   fallout. Isolate by commenting voices/staves with `%` or `s` spacers.
4. **Separate print and MIDI concerns.** Engraving tweaks live in
   `\layout`; timing/voices for playback live in `\midi`. Fermatas and
   repeats need MIDI-specific handling.
5. **Tweak last.** Get notes right, then spacing, then colors/offsets.
6. **Extract parts by reuse**, not copy-paste: `\include` shared files,
   `\transpose` where needed, `\compressMMRests` for tacets.

## 9. Best practices and gotchas

- Key signature never changes input spelling. Black-key pitch = always
  `-is`/`-es` in the source.
- `~` joins equal pitches; `( )` articulates groups; `\( \)` phrases. Never
  substitute one for another.
- Omitted durations inherit. `c4 a 8 8` = `c4 a8 a8`, not `c4 a4 ...`.
- `\relative` octaves drift on big leaps; re-anchor with `'`/`,` and verify
  with `=` octave checks.
- Overrides before `\new Staff` create a phantom staff. Overrides go
  inside the context they target.
- `\score` takes one expression: wrap sibling staves in `{ }` (sequential)
  or `<< >>` (simultaneous). Bare sibling `\new Staff` lines error with
  "unexpected `\new`".
- Wrong durations push music off the page (no break points inside
  over-long measures). Bar checks find the culprit instantly.
- `%` in Scheme code breaks parsing; use `;` there. Save everything UTF-8.
- Lead sheets with only `ChordNames`/`Lyrics` warn about staff affinities;
  set `\override VerticalAxisGroup.staff-affinity = ##f` on one context.
- Same-direction simultaneous voices need `\voiceOne..\voiceFour` or
  `\shiftXx`, or the "needs a voiceXx or shiftXx" warning fires.
- Keep `.ily` stylesheets for house style; keep per-piece tweaks in
  `\layout`. Comment themes and bar numbers for the next editor (possibly you).

## 10. Worked examples

### Example 1 — Single-staff melody

```lilypond
\version "2.24.4"
\header { title = "Scale test" }

\relative c' {
  \clef treble
  \key c \major
  \time 3/4
  \tempo "Andante" 4 = 120
  c2 e8 c' |
  g2. |
  f4 e d |
  c4 c, r |
}
```

### Example 2 — Piano staff with MIDI

```lilypond
\version "2.24.4"
\header { title = "Solo Piano" composer = "Trad." }

upper = \relative c'' {
  \clef treble \key c \major \time 4/4
  a4 b c d |
  e2 d |
}

lower = \relative c {
  \clef bass \key c \major \time 4/4
  a2 c |
  g2 a |
}

\score {
  \new PianoStaff \with { instrumentName = "Piano" }
  <<
    \new Staff = "upper" \upper
    \new Staff = "lower" \lower
  >>
  \layout { }
  \midi { \tempo 4 = 100 }
}
```

### Example 3 — Lead sheet (chords + lyrics)

```lilypond
\version "2.24.4"
\header { title = "Lead Sheet" }

mel = \relative c' {
  \clef treble \key c \major \time 4/4
  c4 d e f |
  g2 c, |
}

harmony = \chordmode {
  c1 |
  g:7 |
}

words = \lyricmode {
  This is a sim -- ple song __ |
}

\score {
  <<
    \new ChordNames \harmony
    \new Staff {
      \new Voice = "singer" \mel
    }
    \new Lyrics \lyricsto "singer" \words
  >>
  \layout { }
}
```

### Example 4 — Explicit two-voice polyphony, one staff

```lilypond
\version "2.24.4"

\new Staff <<
  \new Voice = "up" {
    \voiceOne
    \relative c'' { e4 f g a | b2 a | }
  }
  \new Voice = "down" {
    \voiceTwo
    \relative c' { c4 d e f | g2 f | }
  }
>>
\layout { }
```

Stems point apart; note columns shift automatically. For three-plus voices
add `\voiceThree`/`\voiceFour` with `s` spacers over silent stretches.

### Example 5 — Score and transposed part from one source

```lilypond
% horn-music.ly
hornNotes = \relative c' {
  \time 2/4
  r4 f8 a | cis4 f | e4 d |
}
```

```lilypond
% part.ly
\version "2.24.4"
\include "horn-music.ly"
\header { instrument = "Horn in F" }
{ \transpose f c' \compressMMRests \hornNotes }
```

```lilypond
% score.ly
\version "2.24.4"
\include "horn-music.ly"
% \include "bassoon-music.ly"  % second voice lives in its own file
\score {
  <<
    \new Staff \hornNotes
    % \new Staff \bassoonNotes
  >>
  \layout { }
}
```

### Example 6 — Targeted tweak (one red head, debug colors)

```lilypond
\version "2.24.4"

\relative c' {
  c4 d
  \override NoteHead.color = "red"
  e4 f |
  \once \override NoteHead.color = "green"
  g4 a
  \revert NoteHead.color
  b4 c |
  <c \tweak font-size #-3 e g>4  % only the E shrinks
}
```

Prefer `\once` for single moments, `\tweak`/`\single` inside chords,
`\revert` to restore defaults, and stylesheets for anything house-wide.
