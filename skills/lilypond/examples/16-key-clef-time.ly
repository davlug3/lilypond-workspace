\version "2.26.0"
%% 16 — Key, clef, and time signature changes mid-flow.
%% \key works with \major \minor (and modes dorian etc.).
%% Clef names: treble, treble_8, bass, bass_8, alto, tenor, soprano.

\score {
  \new Staff {
    \relative c' {
      \key g \major
      \time 4/4
      g4 a b c | d2 d |
      \key es \major
      \clef bass
      \time 6/8
      es4 g bes | c2. |
    }
  }
  \layout { }
}