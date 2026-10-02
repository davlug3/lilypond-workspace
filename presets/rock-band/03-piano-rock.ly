\version "2.24.4"
% Rock piano. Notes live in parts/piano.ily — edit there.
\include "parts/shared.ily"
\include "parts/piano.ily"

\header {
  title = "Midnight Wire — Piano"
  subtitle = "Broken verse + Punchy chorus"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  \new PianoStaff \with {
    instrumentName = "Piano"
    midiInstrument = "acoustic grand"
  } <<
    \new Staff = "upper" \pianoFullRH
    \new Staff = "lower" \pianoFullLH
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
