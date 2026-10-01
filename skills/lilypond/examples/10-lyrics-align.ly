\version "2.26.0"
%% 10 — Aligning lyrics to a melody (the robust way).
%% Name the Voice ("mel"), then \lyricsto "mel" so lyrics follow the
%% melody's rhythm exactly. Melismas: a word of fewer syllables than
%% notes = the extra notes get the underscore _ skip inside \lyricmode.
%% An extender "--" draws a line to the next word; "-" is a hyphen.

melody = \relative c'' {
  c4 d e f | g2 a | c2 b | c1 |
}

words = \lyricmode {
  This is the mel -- o -- dy __ test.
}

\score {
  <<
    \new Voice = "mel" { \melody }
    \new Lyrics \lyricsto "mel" \words
  >>
  \layout { }
  \midi { }
}