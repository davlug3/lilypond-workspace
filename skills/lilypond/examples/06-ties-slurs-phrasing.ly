\version "2.26.0"
%% 06 — Ties (~), slurs ( ), phrasing slurs ( \( \) ).
%% Tie: same pitch, inside the note. Slur: two+ notes, notes for one phrase.
%% Phrasing slur: longer structural slur. Breath marks and double bars.

\score {
  \new Staff {
    \relative c' {
      c4~ c d e |          %% tie c~ c
      c( d e f) |          %% slur over four notes
      g\( a b c\) |        %% phrasing slur
      e4 d c b |
      c2 r2 \bar "|."
    }
  }
  \layout { }
}