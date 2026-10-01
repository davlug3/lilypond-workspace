% Lead guitar (Guitar 1), "Midnight Wire". Edit HERE.
% Wrappers (05, 08, 09, 10) include it. One variable feeds Staff + TabStaff,
% so notation and TAB always agree.
% Verse lays out bars 1/3/5 and answers in the vocal breaths (2/4/6).
% Chorus: fifth-based riff, STOP on 13, high B unison with the singer.
% Octave rules: see lead.ily. One mark: g'' opens the chorus (G5).

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

guitarChorus = \relative c' {
  \global
  g''4\f g8 g g4 g4 |               % bar 9 G5 riff
  a4 a8 a a4 a4 |                   % bar 10 riff on A (5th of D)
  b4 b8 b b4 b4 |                   % bar 11 riff on B (5th of Em)
  g4 g8 g g4 g4 |                   % bar 12 riff on G (5th of C)
  g4\> r4 r2 |                      % bar 13 STOP
  a4\!\f a8 a a4 a4 |               % bar 14 D riff, forte back in
  g4 g8 g g4 a4 |                   % bar 15 steps up to A
  b1^"let ring" |                   % bar 16 high B, unison with singer
}

guitarFull = { \guitarVerse \guitarChorus }
