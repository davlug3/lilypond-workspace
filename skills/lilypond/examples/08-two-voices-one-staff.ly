\version "2.26.0"
%% 08 — Two voices on one staff with different rhythms.
%% << { } \\ { } >> is the classic polyphony idiom inside a single Voice;
%% \voiceOne / \voiceTwo set stem up/down and other defaults.

\score {
  \new Staff <<
    \new Voice = "one" {
      \voiceOne
      \relative c' { c4 d e f | g2 r4 g | }
    }
    \new Voice = "two" {
      \voiceTwo
      \relative c { c4 g' b, g' | c,2 s4 c | }
    }
  >>
  \layout { }
  \midi { }
}