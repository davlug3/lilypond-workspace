\version "2.24.4"
% Backing vocal. Notes live in backing.ily — edit there.
\include "../shared/shared.ily"
\include "backing.ily"

\header {
  title = "Midnight Wire — Backing Vocal"
  subtitle = "Echoes + Chorus harmony in thirds"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new ChordNames \triadFullChords
    \new Staff \with {
      instrumentName = "Vocals 2"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "backing" \backingFull
    }
    \new Lyrics \lyricsto "backing" \backingWordsFull
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
