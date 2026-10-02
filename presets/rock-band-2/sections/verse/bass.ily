% Rock bass, "Midnight Wire" — verse section.
% full-band.ly includes this plus sections/chorus/bass.ily.

bassVerse = \relative c {
  \global
  \clef bass
  \mark "Verse"
  e4\p r4 r8 e8 r4 |                   % bar 1 Em
  e4 r4 r8 b8 c4 |                     % bar 2, beat 4 = C already
  c4 r4 r8 g8 c4 |                     % bar 3 C
  d4 r4 r8 a8 d8 e8 |                  % bar 4 walks D-E into Em
  e4 r8 e8 r4 e8 e8 |                  % bar 5, busier
  e8 e g8 g a8 b c4 |                  % bar 6 walks up into the lift
  c8\< c c c d8 d e fis |              % bar 7 climb
  d8 d d d e8 e fis fis\! |            % bar 8 climb to F#
}

