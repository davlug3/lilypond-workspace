\version "2.22.2"
\header { title = "Scale + Chords (MIDI demo)" }

\score {
  <<
    \new Staff \relative c' {
      \clef treble \key g \major \time 3/4
      g4 a b | c d e | fis g2 |
      g,4 a b | c d e | g2. |
    }
    \new Staff \relative c {
      \clef bass \key g \major \time 3/4
      g2. | c | d |
      g, | c | g' |
    }
  >>
  \layout {}
  \midi { \tempo 4 = 120 }
}
