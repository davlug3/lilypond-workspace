\version "2.26.0"
%% Multi-movement book: several \bookpart blocks, each with its own
%% subtitle, wrapped in one \book so all movements share a page setup.
%% Each \score carries both \layout and \midi.

\header {
  title = "A small suite"
  composer = "Suite. Composer"
}

movementOne = \relative c' {
  \time 4/4
  c4 d e f | g2 a4 g | f2 e4 d | c2 r2 |
}

movementTwo = \relative c' {
  \time 3/4
  g4 a b | c2 d4 | e2 c4 | d2. |
}

\book {
  \bookpart {
    \header { subtitle = "I. Moderato" }
    \score {
      \new Staff \movementOne
      \layout { }
      \midi { }
    }
  }

  \bookpart {
    \header { subtitle = "II. Lento" }
    \score {
      \new Staff \movementTwo
      \layout { }
      \midi { }
    }
  }
}