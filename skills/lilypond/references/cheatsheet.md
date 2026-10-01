# Cheatsheet (2.26.0)

## File

```lilypond
\version "2.26.0"
\header { title = "T" composer = "C" tagline = ##f }
melody = \relative c' { \key c \major \time 4/4 c4 d e f | g2 r2 | }
\score { \new Staff \melody \layout { } \midi { } }
```

## Pitches/rhythm

`c' ` middle C · `'` up · `,` down · `cis/des/fis/ges/bes/as/es` ·
`\key g \major` · `\clef treble|bass|alto|tenor|"treble_8"|"G_8"|percussion` ·
`1 2 4 8 16 32 64` · `4.` dotted · `r R1 s` · `\tuplet 3/2 {}` ·
`~` tie · `( )` slur · `\( \)` phrasing · `\grace \acciaccatura
\appoggiatura` · `\partial 4` · `|` bar check · `\bar "|."|".|:"
":|."|":|.:"|"||"` · `\time 4/4|3/4|6/8|2/2` ·
`\tempo "Allegro" 4 = 120` · `\transpose c d'` ·
`\cadenzaOn ... \cadenzaOff`.

## Voices/staves

`{}` seq · `<<>>` simul · `<c e g>2` chord · `\voiceOne \voiceTwo
\voiceThree \voiceFour \oneVoice` · `\new Staff|Voice|Lyrics|
ChordNames|DrumStaff|DrumVoice|TabStaff|PianoStaff|StaffGroup|
ChoirStaff` · `\parallelMusic a,b {}` · `\change Staff = "down"` ·
`\with { instrumentName = ".." shortInstrumentName = ".." }`.

## Chords/lyrics

`\chordmode { c1 g:7 a:m7 f:maj7 }` · `c/e` inversion ·
`\new ChordNames \harmony` · `\new FiguredBass { \figuremode { <6 4> } }` ·
`words = \lyricmode { la2 -- __ }` · `\new Lyrics \lyricsto "mel"` ·
`--` hyphen · `__` extender · `_` skip.

## Expressive

`-. -^ -_ -! -- -+` · `\staccato \tenuto \marcato \accent \espressivo
\portato \fermata \upbow \downbow \open \stopped \harmonic
\prall \mordent \trill \turn` · `\p \mp \mf \f \< \> \!` ·
`\glissando \arpeggio \startTrillSpan \stopTrillSpan \breathe
\bendAfter #4` · `c^\markup { \bold \italic \fontsize #2 }`.

## Layout/tweak

`\paper { #(set-paper-size "a4") margins indent }` ·
`#(set-global-staff-size 18)` · `\layout { #(layout-set-staff-size 16) }` ·
`\break \pageBreak \noBreak` · `\set Staff.x =` · `\override
Grob.x =` · `\revert` · `\once` · `\tweak color #blue` (prefix!) ·
`\single` · `\offset Y-offset 2.5 NoteHead` · `\omit`.

## Special/MIDI/CLI

`\drummode { bd sn hh }` · `\stringTuning <e, a, d g b e'>` ·
`c\sustainOn ... \sustainOff` · `\midi { }` ·
`\set Staff.midiInstrument = "acoustic grand"` ·
`lilypond -o out --pdf/--png/--svg song.ly` · `-dpreview
-dno-point-and-click -dcrop -I DIR -s -l WARN` ·
`convert-ly -e old.ly` · `lilypond-book --format=latex --pdf doc`.

## Scheme

`#expr $var ##t ##f #'sym #"str"` · `#{ $m #}` ·
`define-music-function (args) (preds?)` · `define-scheme-function` ·
`define-event-function`.

## Never emit

`<c-\tweak>` · `\whiteout` · `\roman` · `\text` · `\%` `\*` ·
`\partcombine` · `\autochange` · `\fermataMarkup` ·
`\compressFullBarRests` · `keySignature` · `defaultBarType` ·
`automaticBars = ##f` · `\bar "-"` · `\compoundMeter` ·
`enablePolymeter` · variable named `lyrics`. See
`version-differences.md`.
