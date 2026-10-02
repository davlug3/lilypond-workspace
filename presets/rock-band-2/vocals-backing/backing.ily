% Backing vocal (Vocals 2), "Midnight Wire". Edit HERE.
% Wrappers (02, 08, 09, 10) include this file.
% Verse: soft "ooh" pads plus one-word echoes where the lead breathes
% (bars 2/4/6, beat 4). Chorus: thirds below the lead. Bar 13: silent.
% Octave rules: see lead.ily. One mark total (b' opens the chorus).

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

backingChorus = \relative c' {
  \global
  \clef treble
  \mark "Chorus"
  b'4\f b c8 e e4 |             % bar 9 (lead: d d e g g)
  fis4 e c8 b b4 |              % bar 10 (lead: a g e d d)
  c4 c e8 fis g4 |              % bar 11 (lead: e e g a b)
  a4 g fis8 e c8 e8 |           % bar 12 (lead: c b a g e g)
  R1 |                          % bar 13 STOP, lead alone
  fis4 e fis8 g a4 |            % bar 14 (lead: a g a b c)
  g4 fis e8 fis a4 |            % bar 15 (lead: b a g a c)
  g1 |                          % bar 16 held tag
}

backingFull = { \backingVerse \backingChorus }

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

backingWordsChorus = \lyricmode {
  we're the mid -- night wire       % bar 9
  we light it, we burn              % bar 10
  we're the mid -- night wire       % bar 11
  cop -- per hearts won't tire yet  % bar 12
                            % bar 13 = no lyric (voice rests)
  sparks fly high to -- night       % bar 14
  we're the mid -- night wire       % bar 15
  wire __                           % bar 16
}

backingWordsFull = \lyricmode {
  \backingWordsVerse
  \backingWordsChorus
}
