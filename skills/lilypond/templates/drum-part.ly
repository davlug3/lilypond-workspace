\version "2.26.0"
%% Drum groove on a DrumStaff using \drummode.
%% Drum note names used below: bd (bass drum), sn (snare),
%% hh (closed hi-hat), hho (open hi-hat), cymc (crash), r (rest).
%% Add \midi { } and a DrumStaff with default instrument name for playback.

\header {
  title = "Drum groove"
  composer = "D. Drummer"
}

\score {
  \new DrumStaff \with {
    instrumentName = "Drums"
  } <<
    \new DrumVoice {
      \drummode {
        \time 4/4
        bd4 sn hh bd |
        hh8 hh hh hh sn4 hho |
        cymc4 bd sn8 sn sn sn |
        hh4 hh bd sn |
      }
    }
  >>
  \layout { }
  \midi { }
}