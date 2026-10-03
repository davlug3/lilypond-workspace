% Rhythm guitar (Guitar 2), "Midnight Wire" — chorus section.
% full-band.ly includes this plus sections/verse/rhythm.ily.

rhythmChorusA = \relative c' {
  <g d' g>4\mf\> <g d' g> <g d' g>8 <g d' g> <g d' g>4 |    % bar 9 G
  <d a' d>4->\!\f <d a' d> <d a' d>8 <d a' d> <d a' d>4 |   % bar 10 D
  <e b' e>4 <e b' e> <e b' e>8 <e b' e> <e b' e>4 |         % bar 11 Em
  <c g' c>4 <c g' c> <c g' c>8 <c g' c> <c g' c>4 |         % bar 12 C
  <g d' g>4->\> r4 r2 |             % bar 13 STOP
}

rhythmChorusB = {
  \relative c' {
    <d a' d>4->\!\f <d a' d> <d a' d>8 <d a' d> <d a' d>4 |   % bar 14 D
  }
  \relative c' {
    <c g' c>4 <c g' c> <c g' c>8 <c g' c> <d a' d>4 |         % bar 15, beat 4 = D
  }
  \relative c' {
    <d a' d>1^"let ring" |            % bar 16 final D
  }
}

rhythmChorus = { \rhythmChorusA \rhythmChorusB }

