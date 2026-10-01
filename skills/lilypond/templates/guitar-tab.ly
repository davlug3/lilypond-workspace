\version "2.26.0"
%% Guitar with tablature: standard notation on top, tab staff below,
%% same music in both (TabStaff transposes to tab automatically).
%% A bend and a slide are shown for illustration.

\header {
  title = "Guitar & tab"
  composer = "G. Composer"
}

music = \relative c' {
  \time 4/4
  e4 < a c e> d8 c b a |
  c4\glissando d gis\bendAfter #4 <g b d>4 |
}

\score {
  \new StaffGroup <<
    \new Staff \with {
      instrumentName = "Guitar"
    } {
      \clef "G_8"
      \music
    }
    \new TabStaff \with {
      instrumentName = "Tab"
      stringTunings = \stringTuning <e, a, d g b e'>
    } {
      \music
    }
  >>
  \layout { }
  \midi { }
}