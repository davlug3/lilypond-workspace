\version "2.26.0"
%% 09 — Chords in note mode and chord names in chord mode.
%% Note mode: <c e g> = chord, duration goes AFTER the >.
%% Chord mode: \chordmode without angle brackets, ~ keeps a chord.

harmony = \chordmode {
  c1 | g:7 | a:m7 | f:maj7 |
}

melody = \relative c'' { c4 c c c | d c b c | e c2 d4 | c1 }

\score {
  <<
    \new ChordNames \harmony
    \new Staff { \melody }
  >>
  \layout { }
  \midi { }
}