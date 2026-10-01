\version "2.26.0"
%% 03 — \transpose and transposing instruments.
%% \transpose FROM TO { music }: silently transposes so that a
%% note written FROM sounds as TO. Written B-flat clarinet part:
%% a written 'd' sounds as concert 'c'.

\header { title = "Transposing instruments" }

clarinetPart = \relative c'' { c d e f g a b c' }

\score {
  <<
    \new Staff \with { instrumentName = "B-flat clarinet (written)" }
      \clarinetPart
    \new Staff \with { instrumentName = "Concert pitch" }
      \transpose c' bes \clarinetPart
    \new Staff \with { instrumentName = "Written from concert" }
      \transpose bes c' \clarinetPart
  >>
  \layout { }
}