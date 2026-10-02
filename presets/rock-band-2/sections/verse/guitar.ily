% Lead guitar (Guitar 1), "Midnight Wire" — verse section.
% full-band.ly includes this plus sections/chorus/guitar.ily.

guitarVerse = \relative c' {
  \global
  R1 |                               % bar 1 lays out
  r2 r4\mp e8 g8 |                   % bar 2 answer
  R1 |                               % bar 3 lays out
  r2 r4 a8 b8 |                      % bar 4 answer, climbing
  R1 |                               % bar 5 lays out
  r2 r4 b8 c8 |                      % bar 6 answer into the lift
  c8\< c b b a a g a |               % bar 7 build
  b8 b b b c8 c d d\! |              % bar 8 build to D5
}

