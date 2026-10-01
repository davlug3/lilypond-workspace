\version "2.24.4"
% Lead guitar + TAB. Notes live in parts/guitar1.ily — edit there.
\include "parts/shared.ily"
\include "parts/guitar1.ily"

\header {
  title = "Midnight Wire — Guitar 1 (Lead)"
  subtitle = "Answers + Build + Riff + TAB"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new Staff \with {
      instrumentName = "Guitar 1"
      midiInstrument = "overdriven guitar"
    } {
      \clef "treble_8"
      \guitarFull
    }
    \new TabStaff \with {
      instrumentName = "Tab 1"
      midiInstrument = "overdriven guitar"
    } {
      \guitarFull
    }
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
