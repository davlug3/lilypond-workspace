global = {
  \key c \major
  \time 4/4
  \tempo 4 = 130
}

melody = \relative c'' {
  \global
  \clef treble
  r2 e8 f g f8~ | 8 e4 d8 d4 c8 c8~ | 8 a2.~ 8 |  r1 |
  r2 e'8 f g f8~ | 8 e4 d8 d8 c8 c8~ | 8 d2 e4~ |4 f4 g2 |
  r2 e8 f4 g4 g4 | r4. g8 g4 g4 f8 e4 c4 g'4 f4 | r4
  r2 d8 e4 f8 g,4 c4 e4 d4
   
}

text = \lyricmode {
}

upper = \relative c'' {
  \global
  \clef treble
  <<

    {d4 d4 r2 }
    {b4 b4 r2 }
    {g4 g4 r2 }
  >> | r1 | 
}

lower = \relative c {
  \global
  \clef bass

  <<
    { c4  c4 r2  }
    { c,4 c4 r2 }
  >> | r1 |
  \repeat unfold 2 {f4 a c d8 c8 }
  \repeat unfold 2 {c4 e g a8 g8 }
  {e2 a,2 d2 g,2} |
  {c4 c c c } | {bes bes bes bes} | {a a a a} | {gis gis gis gis }

}

percussion = \drummode {
  \time 4/4

  <<
    { r2           hh4   hh 4 }
    { bd4    bd     }
    { sn4    sn    r2 }
    { tomfl4 tomfl r2 }
  >> |

  <<
    { hh4 hh8 bd tomh16 tomh toml toml sn4   }
    { r2. tomfl4    }
  >> |

  \repeat unfold 5 { <<
    { cymc4  hh8 8  8 8  8 8  |  8 8  8 8  8 8  8 8  } 
    { bd4    sn      r    sn  | bd4    sn      r    sn   }
    >> } |

}

\score {
  <<
    \new Voice = "mel" {
      \autoBeamOff
      \melody
    }

    \new Lyrics \lyricsto "mel" {
      \text
    }

    \new PianoStaff <<
      \new Staff = "upper" {
        \upper
      }
      \new Staff = "lower" {
        \lower
      }
    >>

    \new DrumStaff = "percussion" {
      \percussion
    }
  >>

  \layout {
    \context {
      \Staff
      \RemoveEmptyStaves
    }
  }

  \midi { }
}
