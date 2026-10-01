\version "2.26.0"
%% 07 — Grace notes, appoggiatura, acciaccatura.
%% \grace = unmeasured; \acciaccatura = struck and released quickly
%% (crossed stem); \appoggiatura = takes time from the main note.

\score {
  \new Staff {
    \relative c'' {
      \grace g g'1 |
      \acciaccatura g g'1 |
      \appoggiatura g g'1 |
    }
  }
  \layout { }
}