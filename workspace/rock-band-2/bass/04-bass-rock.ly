\version "2.24.4"
% Rock bass. Notes live in bass.ily — edit there.
\include "../shared/shared.ily"
\include "bass.ily"

\header {
  title = "Midnight Wire — Bass"
  subtitle = "Locked pocket + Walking pickups"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  \new Staff \with {
    instrumentName = "Bass"
    midiInstrument = "electric bass (finger)"
  } \bassFull
  \layout { }
  \midi { \tempo 4 = 132 }
}
