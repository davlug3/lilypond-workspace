% Lead vocal (Vocals 1), "Midnight Wire" — chorus section.
% full-band.ly includes this plus sections/verse/vocals.ily.

leadChorusA = \relative c' {
  \global
  \clef treble
  \mark "Chorus"
  d'4\f d e8 g g4 |             % bar 9 hook (5)
  a4 g e8 d d4 |                % bar 10 (5)
  e4 e g8 a b4 |                % bar 11 hook again (5)
  c4 b a8 g e8 g8 |             % bar 12 (6)
}

leadChorusB = \relative c' {
  \global
  \clef treble
  b''2 r2 |                     % bar 13 STOP, voice alone (1)
  a4 g a8 b c4 |                % bar 14 (5)
  b4 a g8 a c4 |                % bar 15 (5)
  b1 |                          % bar 16 held tag (1)
}

leadChorus = { \leadChorusA \leadChorusB }

leadWordsChorus = \lyricmode {
  % "we're" = 1 syllable, fits the 5-note hook.
  we're the mid -- night wire       % bar 9 (5)
  we light it, we burn              % bar 10 (5)
  we're the mid -- night wire       % bar 11 (5)
  cop -- per hearts won't tire yet  % bar 12 (6)
  wire!                             % bar 13 (held over silence)
  sparks fly high to -- night       % bar 14 (5)
  we're the mid -- night wire       % bar 15 (5)
  wire __                           % bar 16 (held tag)
}

