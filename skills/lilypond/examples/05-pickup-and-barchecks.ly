\version "2.26.0"
%% 05 — Pickups (\partial) and bar checks (|).
%% Bar checks are a free built-in self-test: if the music before '|'
%% does not fill the measure exactly, LilyPond warns you.
%% Run check_ly.sh and fix ANY bar-check warning.

\score {
  \new Staff {
    \time 4/4
    \partial 4 { c8 d }      %% pickup: quarter-note entrance
    e4 e4 e4 c8 d |          %% bar 1 must be 4 beats
    e4 e4 g4 d |             %% bar 2
    c2 r2 |                  %% bar 3 (ends the phrase on the downbeat)
  }
  \layout { }
}