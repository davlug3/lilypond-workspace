\version "2.26.0"
%% SATB hymn with lyrics: soprano and alto share a staff,
%% tenor and bass share a staff; each voice gets its own lyrics.
%% The \voiceOne / \voiceTwo marks set stems/directions per voice.

\header {
  title = "SATB hymn"
  composer = "H. Composer"
}

global = {
  \key g \major
  \time 4/4
}

soprano = \relative c'' { g4 a b c | d2 b | g4 a b c | d2 r2 }
alto = \relative c' { d4 fis g a | b2 g | d4 fis g a | b2 r2 }
tenor = \relative c' { b4 c d e | fis2 d | b4 c d e | fis2 r2 }
bass = \relative c { g4 a b c | b2 g | g4 a b c | g2 r2 }

sopranoWords = \lyricmode { A men, A men, a -- men. }
altoWords   = \lyricmode { A men, A men, a -- men. }
tenorWords  = \lyricmode { A men, A men, a -- men. }
bassWords   = \lyricmode { A men, A men, a -- men. }

\score {
  \new ChoirStaff <<
    \new Staff = "sa" <<
      \clef treble
      \new Voice = "soprano" { \voiceOne \global \soprano }
      \new Voice = "alto"    { \voiceTwo \global \alto }
    >>
    \new Lyrics \lyricsto "soprano" \sopranoWords
    \new Lyrics \lyricsto "alto" \altoWords
    \new Staff = "tb" <<
      \clef "treble_8"
      \new Voice = "tenor" { \voiceOne \global \tenor }
      \new Voice = "bass"  { \voiceTwo \global \bass }
    >>
    \new Lyrics \lyricsto "tenor" \tenorWords
    \new Lyrics \lyricsto "bass" \bassWords
  >>
  \layout { }
  \midi { }
}