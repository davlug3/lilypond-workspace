% Rock drums, "Midnight Wire" — chorus section.
% full-band.ly includes this plus sections/verse/drums.ily.

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

