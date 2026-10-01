\version "2.26.0"
%% 14 — Repeats with alternative endings.
%% \repeat volta 2 { } \alternative { { } { } }.

music = \relative c' {
  \repeat volta 2 {
    c4 d e f
  }
  \alternative {
    { g2 a }
    { c,1 }
  }
  \bar "|."
}

\score {
  \new Staff \music
  \layout { }
  \midi { }
}