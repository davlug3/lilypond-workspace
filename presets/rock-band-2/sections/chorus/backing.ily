% Backing vocal (Vocals 2), "Midnight Wire" — chorus section.
% full-band.ly includes this plus sections/verse/backing.ily.

backingChorus = \relative c' {
  \global
  \clef treble
  \mark "Chorus"
  b'4\f b c8 e e4 |             % bar 9 (lead: d d e g g)
  fis4 e c8 b b4 |              % bar 10 (lead: a g e d d)
  c4 c e8 fis g4 |              % bar 11 (lead: e e g a b)
  a4 g fis8 e c8 e8 |           % bar 12 (lead: c b a g e g)
  R1 |                          % bar 13 STOP, lead alone
  fis4 e fis8 g a4 |            % bar 14 (lead: a g a b c)
  g4 fis e8 fis a4 |            % bar 15 (lead: b a g a c)
  g1 |                          % bar 16 held tag
}

backingWordsChorus = \lyricmode {
  we're the mid -- night wire       % bar 9
  we light it, we burn              % bar 10
  we're the mid -- night wire       % bar 11
  cop -- per hearts won't tire yet  % bar 12
                            % bar 13 = no lyric (voice rests)
  sparks fly high to -- night       % bar 14
  we're the mid -- night wire       % bar 15
  wire __                           % bar 16
}

