\version "2.26.0"
%% 15 — Manual beaming.
%% [ ... ] groups notes under one beam. Auto beaming comes from the
%% time signature; manual beams override it. < > inside a beam = chord.

\score {
  \new Staff {
    \time 3/4
    \relative c'' {
      c8[ c] d[ d] e[ e] |
      c16[ d e f] g[ a b c] d[ e f g] |
      c4 \autoBeamOff c8. e16 \autoBeamOn g4 |
    }
  }
  \layout { }
}