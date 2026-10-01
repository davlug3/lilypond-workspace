# Special staves

Contents: drums · tablature/guitar · piano/keyboard · strings/winds ·
rhythmic staff · ancient/world notation.

## 1. Drums and percussion

```lilypond
\score {
  \new DrumStaff \with { instrumentName = "Drums" } <<
    \new DrumVoice {
      \drummode {
        \time 4/4
        bd4 sn hh bd |
      }
    }
  >>
  \layout { }
  \midi { }
}
```

`\drummode` switches input to drum names: `bd` bass drum, `sn` snare,
`hh` closed hi-hat, `hho` open hi-hat, `cymc` crash, `tomh` high tom,
`r` rest. Pitched notes (`cis4`) inside DrumStaff are an error —
drums take drum names only. The full name table lives in the Notation
Reference appendix "Percussion notes". Template: `templates/drum-part.ly`.

## 2. Guitar and tablature

```lilypond
music = \relative c' { e4 <a c e> d8 c b a | }

\score {
  \new StaffGroup <<
    \new Staff { \clef "G_8" \music }
    \new TabStaff \with {
      stringTunings = \stringTuning <e, a, d g b e'>
    } { \music }
  >>
  \layout { }
}
```

Notation on top, tab below, same music variable in both — TabStaff
computes frets automatically. String numbers: `c\3`. Bends:
`gis\bendAfter #4`. Slides: `c\glissando d`. Dead notes: `c\x`.
Other tunings: `\stringTuning <...>` or presets (`#bass-tuning`,
banjo tunings). Template: `templates/guitar-tab.ly`.

## 3. Piano and keyboard

```lilypond
\new PianoStaff <<
  \new Staff = "up" { \upper }
  \new Staff = "down" { \clef bass \lower }
>>
```

Pedals attach to notes (verified 2.26 syntax):

```lilypond
\relative c'' { c4\sustainOn d e g <c, f a>1\sustainOff }
```

Manual staff changes: `\change Staff = "down"` inside a voice.
Template: `templates/piano-grand-staff.ly`. Organ adds pedal staves;
harp adds `\harpPedal` diagrams; accordion uses register symbols —
look each up in the Notation Reference chapter before generating.

## 4. Unfretted strings and winds

```lilypond
c4\downbow d\upbow e\open f\stopped |   % violin family
g4\harmonic a\snappizzato |            % harmonics, Bartók pizz
```

Woodwind diagrams, bagpipe `\bagpipe` definitions, brass mutes are
chapter-level features: read the Notation Reference section first,
then adapt the shape of the example above.

## 5. Rhythmic staff (rhythm slashes)

```lilypond
\new RhythmicStaff { c4 c8 c c4 c | }
```

Pitches are ignored, stems/beams print. For chord grids see
`chords-and-chordnames.md` §6.

## 6. Ancient and world notation

Dedicated contexts, modern music will not compile in them and vice
versa: `GregorianTranscriptionStaff` / `MensuralStaff` /
`PetrucciStaff` / `KievanStaff` with matching `*Voice` contexts,
`\divisio` bar lines, `\custosOn`. Non-Western pitch systems switch
with `\language "arabic"` and makam/mirror accidentals. These are
rare requests: read the Notation Reference chapter (Ancient notation /
World music) end-to-end before writing a single bar, and compile after
every two bars.

## 7. Gotchas

- Drum names outside `\drummode`: `bd4` in note mode is a syntax error.
- Tab without matching notation staff: keep both from one variable or
  they drift apart.
- `\clef "G_8"` vs `\clef "treble_8"`: guitar vs vocal-tenor octave
  transposition — same pitch, different convention.
- Ancient contexts need their own clefs (`\clef "C"`) and no `\time`.
