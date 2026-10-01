\version "2.26.0"
%% String quartet: four independent staves in a StaffGroup,
%% each with an instrument name. Viola uses alto clef, cello bass clef.

\header {
  title = "String quartet"
  composer = "L. van Beethoven"
}

violinI = \relative c'' { c2 d4 e | f2 e | d4 c b a | g1 }
violinII = \relative c' { a2 b4 c | d2 c | b4 a gis a | b1 }
viola = \relative c' { e2 fis4 g | a2 g | fis4 e d dis | e1 }
cello = \relative c, { c2 b4 a | d2 c | b4 c d e | c1 }

\score {
  \new StaffGroup <<
    \new Staff \with { instrumentName = "Violin I" } \violinI
    \new Staff \with { instrumentName = "Violin II" } \violinII
    \new Staff \with { instrumentName = "Viola" }
      { \clef alto \viola }
    \new Staff \with { instrumentName = "Cello" }
      { \clef bass \cello }
  >>
  \layout { indent = 2\cm }
  \midi { }
}