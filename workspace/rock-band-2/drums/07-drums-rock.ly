\version "2.24.4"
% Rock drums. Notes live in drums.ily — edit there.
\include "../shared/shared.ily"
\include "drums.ily"

\header {
  title = "Midnight Wire — Drums"
  subtitle = "Money beat + Lift + Four-floor chorus + Stop + Fill"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  \new DrumStaff \with {
    instrumentName = "Drums"
  } {
    \drumGlobal
    <<
      \new DrumVoice { \drumFullHands }
      \new DrumVoice { \drumFullFeet }
    >>
  }
  \layout { }
  \midi { \tempo 4 = 132 }
}
