% Lead vocal (Vocals 1), "Midnight Wire". Edit notes and lyrics HERE.
% Wrappers (01, 08, 09, 10) include this file, so every view stays in sync.
% Cuts: A = bars 1-4, B = 5-8, C = 9-12, D = 13-16.
%
% Octaves: each block below starts fresh from middle C, so every first note
% must read right on its own. Bare notes pick the closest pitch; a ' mark
% adds an octave on top. Use marks only to set a new height on a block's
% first note — never on repeats (a second identical mark climbs again).
% Here that means two marks total: d' opens the chorus (D5), b'' opens
% the stop bar (B5). Everything else is bare and stepwise.

leadVerseA = \relative c' {
  \global
  \clef treble
  \mark "Verse"
  r4\p e8 g a4 g8 a8 |           % bar 1 (5 notes)
  g4 e8 e a4 r4 |               % bar 2 (4 + breath)
  c4 b a8 g a4 |                % bar 3 (5)
  g4 e8 fis g4 r4 |             % bar 4 (4 + breath)
}

leadVerseB = \relative c' {
  \global
  \clef treble
  r4 e8 g a4 b8 c8 |            % bar 5 (5)
  b4 a8 g b4 r4 |               % bar 6 (4 + breath)
  c4 c8 b a8 g a4 |             % bar 7 (6, builds)
  b2~\mp\< b8 r8 r4\! |          % bar 8 (held build note)
}

leadChorusA = \relative c' {
  \global
  \clef treble
  \mark "Chorus"
  d'4\f d e8 g g4 |             % bar 9 hook (5)
  a4 g e8 d d4 |                % bar 10 (5)
  e4 e g8 a b4 |                % bar 11 hook again (5)
  c4 b a8 g e8 g8 |             % bar 12 (6)
}

leadChorusB = \relative c' {
  \global
  \clef treble
  b''2 r2 |                     % bar 13 STOP, voice alone (1)
  a4 g a8 b c4 |                % bar 14 (5)
  b4 a g8 a c4 |                % bar 15 (5)
  b1 |                          % bar 16 held tag (1)
}

leadVerse = { \leadVerseA \leadVerseB }
leadChorus = { \leadChorusA \leadChorusB }
leadFull = { \leadVerse \leadChorus }

leadWordsVerse = \lyricmode {
  % No | bar checks here: a lyric | breaks when the next bar starts
  % off the downbeat (our syncopated pickups do exactly that).
  dash -- board glows red -- hot    % bar 1 (5)
  ra -- di -- o howls               % bar 2 (4)
  head -- lights cut the black      % bar 3 (5)
  town sleeps, we run               % bar 4 (4)
  en -- gine hums be -- neath       % bar 5 (5)
  ti -- res bite rain               % bar 6 (4)
  chas -- ing ev -- ery red light   % bar 7 (6)
  run __                            % bar 8 (held)
}

leadWordsChorus = \lyricmode {
  % "we're" = 1 syllable, fits the 5-note hook.
  we're the mid -- night wire       % bar 9 (5)
  we light it, we burn              % bar 10 (5)
  we're the mid -- night wire       % bar 11 (5)
  cop -- per hearts won't tire yet  % bar 12 (6)
  wire!                             % bar 13 (held over silence)
  sparks fly high to -- night       % bar 14 (5)
  we're the mid -- night wire       % bar 15 (5)
  wire __                           % bar 16 (held tag)
}

leadWordsFull = \lyricmode {
  \leadWordsVerse
  \leadWordsChorus
}
