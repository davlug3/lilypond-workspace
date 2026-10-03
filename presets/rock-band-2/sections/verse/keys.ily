% Rock piano, "Midnight Wire" — verse section (keys token).
% full-band.ly includes this plus sections/chorus/keys.ily.

pianoVerseARH = \relative c' {
  \clef treble
  \mark "Verse"
  e8\p g b g e8 g b g |            % bar 1 Em
  e8 g b g e8 g b b |              % bar 2 Em
  c8 e g e c8 e g e |              % bar 3 C
  d8 fis a fis d8 fis a fis |      % bar 4 D
}

pianoVerseBRH = \relative c' {
  \clef treble
  e8 g b g e8 g b g |              % bar 5 Em
  e8 g b g a8 b c b |              % bar 6 climbs into C
  c8\< e g e c8 e g a |            % bar 7 lift + crescendo
  d,8 fis a fis d8 fis a b\! |      % bar 8 D
}

pianoVerseLH = \relative c {
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

pianoVerseRH = { \pianoVerseARH \pianoVerseBRH }

