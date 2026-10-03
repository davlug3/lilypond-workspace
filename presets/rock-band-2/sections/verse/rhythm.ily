% Rhythm guitar (Guitar 2), "Midnight Wire" — verse section.
% full-band.ly includes this plus sections/chorus/rhythm.ily.

rhythmVerse = \relative c' {
  R1 |                               % bar 1 tacet
  R1 |                               % bar 2 tacet
  c8\mp^"P.M." c c c c8 c c c |      % bar 3 C chug
  d8 d d d d8 d d d |                % bar 4 D chug
  e8 e e e e8 e e e |                % bar 5 Em chug
  e8 e e e e8 e fis8 g8 |            % bar 6 climbs F#->G
  <c, g' c>4\<^"open" <c g' c> <c g' c>8 <c g' c> <c g' c>4 | % bar 7 lift
  <d a' d>4 <d a' d> <d a' d>8 <d a' d> <d a' d>4\! |          % bar 8 D
}

