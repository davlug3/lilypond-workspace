% Rhythm guitar (Guitar 2), "Midnight Wire". Edit HERE.
% Wrappers (06, 08, 09, 10) include it. One variable feeds Staff + TabStaff.
% Bars 1-2 silent. Bars 3-6: palm-muted root chugs. Bars 7-8 open up.
% Chorus: open 5-chords (no 3rd). Accents mark arrivals only.
%
% Octaves: see lead.ily. Power chords are <root fifth' octave> — the fifth
% always carries ' (a bare fifth would sink a fourth below the root).
% One comma in the file: bar-7 beat 1, coming down off the G4 chugs.
% No marked chord-roots anywhere (each one drags following music down).
% Written pitches are treble_8 (sounding one octave lower).

rhythmVerse = \relative c' {
  \global
  R1 |                               % bar 1 tacet
  R1 |                               % bar 2 tacet
  c8\mp^"P.M." c c c c8 c c c |      % bar 3 C chug
  d8 d d d d8 d d d |                % bar 4 D chug
  e8 e e e e8 e e e |                % bar 5 Em chug
  e8 e e e e8 e fis8 g8 |            % bar 6 climbs F#->G
  <c, g' c>4\<^"open" <c g' c> <c g' c>8 <c g' c> <c g' c>4 | % bar 7 lift
  <d a' d>4 <d a' d> <d a' d>8 <d a' d> <d a' d>4\! |          % bar 8 D
}

rhythmChorusA = \relative c' {
  \global
  <g d' g>4\mf\> <g d' g> <g d' g>8 <g d' g> <g d' g>4 |    % bar 9 G
  <d a' d>4->\!\f <d a' d> <d a' d>8 <d a' d> <d a' d>4 |   % bar 10 D
  <e b' e>4 <e b' e> <e b' e>8 <e b' e> <e b' e>4 |         % bar 11 Em
  <c g' c>4 <c g' c> <c g' c>8 <c g' c> <c g' c>4 |         % bar 12 C
  <g d' g>4->\> r4 r2 |             % bar 13 STOP
}

% Bars 14-16 restart fresh per bar: shared \relative chord variables
% drift down here when Staff+Tab both read them (audited D2/C2,
% unfrettable). Fresh blocks resolve only from middle C, so each bar is
% exact: D4/C4/D4 with zero TAB warnings. Bar 13 chokes low, 14 crashes back high.
rhythmChorusB = {
  \relative c' {
    \global
    <d a' d>4->\!\f <d a' d> <d a' d>8 <d a' d> <d a' d>4 |   % bar 14 D
  }
  \relative c' {
    \global
    <c g' c>4 <c g' c> <c g' c>8 <c g' c> <d a' d>4 |         % bar 15, beat 4 = D
  }
  \relative c' {
    \global
    <d a' d>1^"let ring" |            % bar 16 final D
  }
}

rhythmChorus = { \rhythmChorusA \rhythmChorusB }

rhythmFull = { \rhythmVerse \rhythmChorus }
