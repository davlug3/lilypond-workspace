% Lead vocal (Vocals 1), "Midnight Wire" — verse section.
% full-band.ly includes this plus sections/chorus/vocals.ily.

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

leadVerse = { \leadVerseA \leadVerseB }

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

