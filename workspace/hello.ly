global = {
  \key d \major
  \time 4/4 
  \tempo "Andante" 4 = 130
}

upper = \relative d'' {
  \clef treble
    %r2 fis8 g a g~    | 8  fis4 e8 e4 d8 d~ | 8 b2 r8 r4  | r1 |
    %r2 fis'8 g a g~ |  8  fis4 fis8 fis  e8 d4 | e2  fis2 g2 a2|

    %r2 fis8 g a a~ | 2 a8 a4 a8~ | 8 g8 fis4 d4 a'4 |
  g2 r4. fis8 |
    g4. g8 a4  d,4 | fis e2 d


}

lower = \relative d {
  \clef bass

   %d,8 r8 d8 r8   r2 |    r1    | g,4 b d e8 d8    |  g,4 b d e8 d8 | 
   %d,4 fis a b8 a8 | d,4 fis a b8 a8 | e2 fis2 | g2 a2 |
  %d4 d d d | c c c c | b b b b |

  ais ais ais ais |
  
  fis2 b2 | e2 a,2 | d1
  
}

percussion = \drummode {
  hh4 hh hh hh |
  bd4 hh hh hh |
  bd4 hh hh hh |
  bd4 hh hh hh |

}

metro = \relative {
    
}

\score {
  \new PianoStaff \with { instrumentName = "Piano" }
  <<
    \new Staff = "upper" << \global \upper >>
    \new Staff = "lower" << \global \lower >> 
    \new Staff = "metro" << \global \metro >> 
    \new DrumStaff \with {instrumentName = "Perc."}  << \global \percussion>>
  >>
  \layout { }
  \midi { }
}

