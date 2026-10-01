\version "2.24.4"
% Full band, CHORUS ONLY (bars 9-16). Notes live in parts/*.ily.
% Play this MIDI to hear (or loop) just the chorus.
\include "parts/shared.ily"
\include "parts/lead.ily"
\include "parts/backing.ily"
\include "parts/piano.ily"
\include "parts/guitar1.ily"
\include "parts/guitar2.ily"
\include "parts/bass.ily"
\include "parts/drums.ily"

#(set-global-staff-size 15)

\header {
  title = "Midnight Wire — Chorus (Band)"
  subtitle = "Bars 9-16 in E minor"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new ChordNames \chorusChords
    \new Staff \with {
      instrumentName = "Vocals 1"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "lead" \leadChorus
    }
    \new Lyrics \lyricsto "lead" \leadWordsChorus
    \new Staff \with {
      instrumentName = "Vocals 2"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "backing" \backingChorus
    }
    \new Lyrics \lyricsto "backing" \backingWordsChorus
    \new PianoStaff \with {
      instrumentName = "Piano"
      midiInstrument = "acoustic grand"
    } <<
      \new Staff = "upper" \pianoChorusRH
      \new Staff = "lower" \pianoChorusLH
    >>
    \new Staff \with {
      instrumentName = "Guitar 1"
      midiInstrument = "overdriven guitar"
    } {
      \clef "treble_8"
      \guitarChorus
    }
    \new TabStaff \with {
      instrumentName = "Tab 1"
      midiInstrument = "overdriven guitar"
    } {
      \guitarChorus
    }
    \new Staff \with {
      instrumentName = "Guitar 2"
      midiInstrument = "distorted guitar"
    } {
      \clef "treble_8"
      \rhythmChorus
    }
    \new TabStaff \with {
      instrumentName = "Tab 2"
      midiInstrument = "distorted guitar"
    } {
      \rhythmChorus
    }
    \new Staff \with {
      instrumentName = "Bass"
      midiInstrument = "electric bass (finger)"
    } \bassChorus
    \new DrumStaff \with {
      instrumentName = "Drums"
    } {
      \drumGlobal
      <<
        \new DrumVoice \drumChorusHands
        \new DrumVoice \drumChorusFeet
      >>
    }
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
