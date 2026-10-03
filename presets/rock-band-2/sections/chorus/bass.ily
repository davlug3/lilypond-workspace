% Rock bass, "Midnight Wire" — chorus section.
% full-band.ly includes this plus sections/verse/bass.ily.

bassChorus = \relative c {
  \clef bass
  \mark "Chorus"
  g'4\f r8 g8 r8 d8 g4 |               % bar 9 G
  d4 r8 d8 r8 a8 d4 |                  % bar 10 D
  e4 r8 e8 r8 b8 e4 |                  % bar 11 Em
  c4 r8 c8 r8 g8 c4 |                  % bar 12 C
  g'4\> r4 r2 |                        % bar 13 STOP
  d4\!\f r8 d8 r8 a8 d4 |              % bar 14 forte back in
  c8 d e fis g8 fis e d |              % bar 15 fill up and back down
  d1 |                                 % bar 16 final hit
}

