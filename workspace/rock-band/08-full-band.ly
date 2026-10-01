\version "2.24.4"
% Full rock band. All notes live in parts/*.ily — edit there.
% Breaks mark the form: verse | build | chorus | stop+tag.
\include "parts/shared.ily"
\include "parts/lead.ily"
\include "parts/backing.ily"
\include "parts/piano.ily"
\include "parts/guitar1.ily"
\include "parts/guitar2.ily"
\include "parts/bass.ily"
\include "parts/drums.ily"

#(set-global-staff-size 15)

\paper {
  % 13 staves on A4: tall systems may print a harmless "over-full page"
  % note. The PDF and MIDI are complete; 01-07 are the roomy reading copies.
}

\header {
  title = "Midnight Wire — Full Band"
  subtitle = "Verse + Chorus in E minor"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new ChordNames \fullChords
    \new Staff \with {
      instrumentName = "Vocals 1"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "lead" {
        \leadVerseA \break
        \leadVerseB \break
        \leadChorusA \break
        \leadChorusB
      }
    }
    \new Lyrics \lyricsto "lead" \leadWordsFull
    \new Staff \with {
      instrumentName = "Vocals 2"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "backing" \backingFull
    }
    \new Lyrics \lyricsto "backing" \backingWordsFull
    \new PianoStaff \with {
      instrumentName = "Piano"
      midiInstrument = "acoustic grand"
    } <<
      \new Staff = "upper" \pianoFullRH
      \new Staff = "lower" \pianoFullLH
    >>
    \new Staff \with {
      instrumentName = "Guitar 1"
      midiInstrument = "overdriven guitar"
    } {
      \clef "treble_8"
      \guitarFull
    }
    \new TabStaff \with {
      instrumentName = "Tab 1"
      midiInstrument = "overdriven guitar"
    } {
      \guitarFull
    }
    \new Staff \with {
      instrumentName = "Guitar 2"
      midiInstrument = "distorted guitar"
    } {
      \clef "treble_8"
      \rhythmFull
    }
    \new TabStaff \with {
      instrumentName = "Tab 2"
      midiInstrument = "distorted guitar"
    } {
      \rhythmFull
    }
    \new Staff \with {
      instrumentName = "Bass"
      midiInstrument = "electric bass (finger)"
    } \bassFull
    \new DrumStaff \with {
      instrumentName = "Drums"
    } {
      \drumGlobal
      <<
        \new DrumVoice \drumFullHands
        \new DrumVoice \drumFullFeet
      >>
    }
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
