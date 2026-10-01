\version "2.26.0"
%% Lead sheet: melody + chord symbols + lyrics.
%% Reader note: the melody Voice must have a NAME ("mel") so that
%% \lyricsto can attach lyrics to exactly that voice, and the same
%% melody must be reused for MIDI, so keep it in a variable.

\header {
  title = "Lead sheet"
  subtitle = "melody + chords + lyrics"
  composer = "A. Composer"
  poet = "Lyrics by B. Writer"
}

melody = \relative c'' {
  \key c \major
  \time 4/4
  c4 d e f | g2 a4 g | f e d c | g'2 r2 |
}

harmony = \chordmode {
  \time 4/4
  c1 | g:7 | f | c |
}

wordsOne = \lyricmode {
  This is the lead -- sheet test, four bars long.
}

\score {
  <<
    \new ChordNames \harmony
    \new Voice = "mel" { \melody }
    \new Lyrics \lyricsto "mel" \wordsOne
  >>
  \layout { }
  \midi { }
}