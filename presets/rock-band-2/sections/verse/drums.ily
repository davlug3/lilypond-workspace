% Rock drums, "Midnight Wire" — verse section.
% drumGlobal lives here (section-wide time + tempo; drums are unpitched).
% full-band.ly includes this plus sections/chorus/drums.ily.

drumGlobal = {
  \time 4/4
  \tempo 4 = 132
}

drumVerseHands = \drummode {
  \voiceOne
  \mark "Verse"
  hh8 hh hh hh hh hh hh hh |      % bar 1 tight hats
  hh8 hh hh hh hh hh hh hh |      % bar 2
  hh8 hh hh hh hh hh hh hh |      % bar 3
  hh8 hh hh hh hh hh hho8 hh |    % bar 4 (& of 4 opens)
  hh8 hh hh hh hh hh hh hh |      % bar 5
  hh8 hh hh hh hh hh hh hh |      % bar 6
  hho8^"open" hho hho hho hho8 hho hho hho | % bar 7 sloshy lift
  hh8 hh hh hh sn16 sn sn sn sn8 sn8 |       % bar 8 snare roll in
}

drumVerseFeet = \drummode {
  \voiceTwo
  bd4 sn4 r8 bd8 sn4 |            % bar 1 money beat
  bd4 sn4 r8 bd8 sn4 |            % bar 2
  bd4 sn4 r8 bd8 sn4 |            % bar 3
  bd4 sn4 r8 bd8 sn4 |            % bar 4
  bd4 sn4 r8 bd8 sn4 |            % bar 5
  bd4 sn4 r8 bd8 sn4 |            % bar 6
  bd8 bd sn sn bd8 bd sn sn |      % bar 7 double-time build
  bd8 bd sn sn bd8 bd sn sn |      % bar 8 double-time build
}

