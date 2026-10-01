\version "2.26.0"
%% 01 — File anatomy: \version, \header, \score, \layout, \midi.
%% \version MUST be the first line. \header/paper/layout/midi blocks
%% default to wrapping the implicit book when you leave them out.

\header {
  title = "File anatomy"
  composer = "Anon."
}

music = \relative c' { c d e f g a b c' }

\score {
  \new Staff \music
  \layout { }
  \midi { }
}