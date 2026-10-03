% Lead guitar (Guitar 1), "Midnight Wire" — chorus section.
% full-band.ly includes this plus sections/verse/guitar.ily.

guitarChorus = \relative c' {
  g''4\f g8 g g4 g4 |               % bar 9 G5 riff
  a4 a8 a a4 a4 |                   % bar 10 riff on A (5th of D)
  b4 b8 b b4 b4 |                   % bar 11 riff on B (5th of Em)
  g4 g8 g g4 g4 |                   % bar 12 riff on G (5th of C)
  g4\> r4 r2 |                      % bar 13 STOP
  a4\!\f a8 a a4 a4 |               % bar 14 D riff, forte back in
  g4 g8 g g4 a4 |                   % bar 15 steps up to A
  b1^"let ring" |                   % bar 16 high B, unison with singer
}

