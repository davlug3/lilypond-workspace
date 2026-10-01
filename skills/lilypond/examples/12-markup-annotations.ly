\version "2.26.0"
%% 12 — \markup: text, fonts, alignment, columns.
%% \markup attaches text to notes; \markup alone creates free text.
%% Common commands: \bold \italic \fontsize \center-column \column.

\score {
  <<
    \new Staff {
      \relative c' {
        c4^\markup { \bold "forte" \italic "molto" } d e f |
        g1^\markup \center-column { "two lines" \small "of text" }
      }
    }
    \new Staff {
      \relative c' {
        c4 d e f
        \bar "|."
      }
    }
  >>
  \layout { }
}