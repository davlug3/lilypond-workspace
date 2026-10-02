% Rock piano, "Midnight Wire" — chorus section (keys token).
% full-band.ly includes this plus sections/verse/keys.ily.

pianoChorusRH = \relative c' {
  \global
  \clef treble
  \mark "Chorus"
  <g' b d>4\f <g b d> <g b d>8 <g b d> <g b d>4 |   % bar 9 G
  <d fis a>4 <d fis a> <d fis a>8 <d fis a> <d fis a>4 | % bar 10 D
  <e g b>4 <e g b> <e g b>8 <e g b> <e g b>4 |     % bar 11 Em
  <e g c>4 <e g c> <e g c>8 <e g c> <e g c>4 |     % bar 12 C
  <g b d>4\> r4 r2 |               % bar 13 STOP
  <d fis a>4\!\f <d fis a> <d fis a>8 <d fis a> <d fis a>4 | % bar 14 forte
  <e g c>4 <e g c> <e g c>8 <e g c> <e g c>4 |     % bar 15 C
  <d fis a>1\arpeggio |           % bar 16 rolled final
}

pianoChorusLH = \relative c {
  \global
  \clef bass
  \mark "Chorus"
  g4\f g g g |                     % bar 9
  d4 d d d |                       % bar 10
  e4 e e e |                       % bar 11
  c4 c c c |                       % bar 12
  g4\> r4 r2 |                     % bar 13 STOP
  d4\!\f d d d |                   % bar 14 forte back in
  c4 c c c |                       % bar 15
  d1 |                             % bar 16
}

