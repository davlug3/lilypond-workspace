\version "2.24.4"
% Rhythm guitar + TAB + chords. Notes live in guitar2.ily — edit there.
\include "../shared/shared.ily"
\include "guitar2.ily"

\header {
  title = "Midnight Wire — Guitar 2 (Rhythm)"
  subtitle = "Palm-mute chugs + Open power chords + TAB"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new ChordNames \fiveFullChords
    \new Staff \with {
      instrumentName = "Guitar 2"
      midiInstrument = "distorted guitar"
    } {
      \clef "treble_8"
      \rhythmFull
    }
    \new TabStaff \with {
      instrumentName = "Tab 2"
      midiInstrument = "distorted guitar"
    } {
      \rhythmFull
    }
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
