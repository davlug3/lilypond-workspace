% Rock drums, "Midnight Wire". Edit HERE. Wrappers (07, 08, 09, 10) include it.
% Hands = cymbals, feet = kick + snare. Kick locks with the bass.
% Verse = money beat (kick on 1 + & of 3). Chorus = four-on-the-floor
% kicks under the backbeat. Bar 13 STOP (choke it). Bar 15: tom fill.
% drumGlobal has time + tempo only, no key (drums are unpitched).

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

drumChorusHands = \drummode {
  \voiceOne
  \mark "Chorus"
  cymc4 hh hh hh |                % bar 9 crash on 1
  hho4 hh hh hh |                 % bar 10 open hat on 1
  cymc4 hh hh hh |                % bar 11 crash on 1
  hho4 hh hh hh |                 % bar 12 open hat on 1
  cymc4^"choke" r4 r2 |           % bar 13 STOP, then silence
  cymc4 hh hh hh |                % bar 14 crash back in
  tommh8 tomml tommh tomml sn8 sn sn sn | % bar 15 tom fill (no hats)
  cymc1 |                         % bar 16 final crash
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

drumChorusFeet = \drummode {
  \voiceTwo
  bd4 <bd sn>4 bd4 <bd sn>4 |      % bar 9 (<bd sn> = both together)
  bd4 <bd sn>4 bd4 <bd sn>4 |      % bar 10
  bd4 <bd sn>4 bd4 <bd sn>4 |      % bar 11
  bd4 <bd sn>4 bd4 <bd sn>4 |      % bar 12
  bd4 r4 r2 |                      % bar 13 STOP
  bd4 <bd sn>4 bd4 <bd sn>4 |      % bar 14
  bd4 r4 r2 |                      % bar 15 kick starts the fill
  bd1 |                            % bar 16 with final crash
}

drumFullHands = { \drumVerseHands \drumChorusHands }
drumFullFeet = { \drumVerseFeet \drumChorusFeet }
