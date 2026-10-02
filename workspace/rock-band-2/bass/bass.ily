% Rock bass, "Midnight Wire". Edit HERE. Wrappers (04, 08, 09, 10) include it.
% Locks with the kick (1 + & of 3 in the verse, four-on-floor in chorus).
% Beat-4 pickups point at the next chord; bars 7-8 climb into the chorus.
% Bar 13 STOP, bar 15 scalar fill into the final D.
% Octave rules: see lead.ily. Two marks: g' opens bars 9 and 13 (G3).

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

bassChorus = \relative c {
  \global
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

bassFull = { \bassVerse \bassChorus }
