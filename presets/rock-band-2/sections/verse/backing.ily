% Backing vocal (Vocals 2), "Midnight Wire" — verse section.
% full-band.ly includes this plus sections/chorus/backing.ily.

backingVerse = \relative c' {
  \global
  \clef treble
  \mark "Verse"
  e1\p |                        % bar 1 ooh
  r2 r4 e4 |                    % bar 2 echo "howls"
  e1 |                          % bar 3 ooh
  r2 r4 e4 |                    % bar 4 echo "run"
  e1 |                          % bar 5 ooh
  r2 r4 e4 |                    % bar 6 echo "rain"
  e1\< |                        % bar 7 lift
  fis1\! |                      % bar 8 build (3rd of D)
}

backingWordsVerse = \lyricmode {
  % NOTE: no | bar checks in lyrics (see lead.ily).
  ooh __                    % bar 1
  howls                     % bar 2 echo
  ooh __                    % bar 3
  run                       % bar 4 echo
  ooh __                    % bar 5
  rain                      % bar 6 echo
  ooh __                    % bar 7
  ooh __                    % bar 8
}

