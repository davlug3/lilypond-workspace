\version "2.24.4"
% Lead vocal. Notes live in parts/lead.ily — edit there.
\include "parts/shared.ily"
\include "parts/lead.ily"

\header {
  title = "Midnight Wire — Lead Vocal"
  subtitle = "Verse + Chorus in E minor"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new ChordNames \triadFullChords
    \new Staff \with {
      instrumentName = "Vocals 1"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "lead" \leadFull
    }
    \new Lyrics \lyricsto "lead" \leadWordsFull
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
