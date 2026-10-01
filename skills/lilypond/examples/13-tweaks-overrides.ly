\version "2.26.0"
%% 13 — \set, \override, \revert, \once, \tweak.
%% \set  context.property     = value   (context/translation property)
%% \override Grob.property    = value   (grob layout property)
%% \revert Grob.property                (back to default)
%% \once  limits either to the next object.
%% \tweak = one-object override (2.26 syntax: \tweak property value,
%% unquoted property, placed before the music — NOT post-event ``<c-\tweak ..>'').

\score {
  \new Staff {
    \relative c' {
      \set Staff.instrumentName = "Tweaked"
      c4 \override NoteHead.color = #red d
      \revert NoteHead.color e f |
      \once \override NoteHead.font-size = #+3 g2 a |
      \tweak color #blue <c e g c>1 |
    }
  }
  \layout { }
}