\version "2.26.0"
%% 11 — Articulations and dynamics.
%% Articulations attach after a note and are flipped with - (down)
%% or ^ (up). Dynamics: \p \mp \mf \f \ff and hairpins \< \! \>.

\score {
  \new Staff {
    \relative c'' {
      c4-.\p c4-^ c4-_ c4-! |
      c4\mf\> d e f\! |
      g4\pp\< a b c\! |
      g2\ff r2\fermata |
    }
  }
  \layout { }
  \midi { }
}