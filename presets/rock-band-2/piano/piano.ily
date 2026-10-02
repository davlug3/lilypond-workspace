% Rock piano, "Midnight Wire". Edit HERE. Wrappers (03, 08, 09, 10) include it.
% Verse: rolling broken-chord 8ths (RH) + root holds with 5-1 pickups (LH).
% Chorus: punchy quarters, last beat split in two to push the next bar.
% Bar 13 STOP: one hit, then silence. Octave rules: see lead.ily.
% Two marks in this file: verseB bar-8 d, (D5 after A5) and chorus
% bar-9 beat-1 <g' b d> (G4 from a fresh start). Everything else is bare.
% RH verse stays split A/B so bar 5 restarts low at E4.

pianoVerseARH = \relative c' {
  \global
  \clef treble
  \mark "Verse"
  e8\p g b g e8 g b g |            % bar 1 Em
  e8 g b g e8 g b b |              % bar 2 Em
  c8 e g e c8 e g e |              % bar 3 C
  d8 fis a fis d8 fis a fis |      % bar 4 D
}

pianoVerseBRH = \relative c' {
  \global
  \clef treble
  e8 g b g e8 g b g |              % bar 5 Em
  e8 g b g a8 b c b |              % bar 6 climbs into C
  c8\< e g e c8 e g a |            % bar 7 lift + crescendo
  d,8 fis a fis d8 fis a b\! |      % bar 8 D
}

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

pianoVerseLH = \relative c {
  \global
  \clef bass
  \mark "Verse"
  e2\p b8 b e4 |                   % bar 1 (B = 5th)
  e2 b8 b c4 |                     % bar 2 (C hints at bar 3)
  c2 g8 g c4 |                     % bar 3 (G = 5th)
  d2 a8 a d4 |                     % bar 4 (A = 5th)
  e2 b8 b e4 |                     % bar 5
  e2 b8 b c4 |                     % bar 6 (C hints at bar 7)
  c4\< c c8 c c4 |                 % bar 7 drive
  d4 d d8 d d4\! |                  % bar 8 drive into chorus
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

pianoVerseRH = { \pianoVerseARH \pianoVerseBRH }
pianoFullRH = { \pianoVerseRH \pianoChorusRH }
pianoFullLH = { \pianoVerseLH \pianoChorusLH }
