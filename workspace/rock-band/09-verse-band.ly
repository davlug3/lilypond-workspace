\version "2.24.4"
% Full band, VERSE ONLY (bars 1-8). Notes live in parts/*.ily.
% Play this MIDI to hear (or loop) just the verse.
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
  title = "Midnight Wire — Verse (Band)"
  subtitle = "Bars 1-8 in E minor"
  composer = "Example"
  tagline = "LilyPond 2.24 readable rock example"
}

\score {
  <<
    \new ChordNames \verseChords
    \new Staff \with {
      instrumentName = "Vocals 1"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "lead" \leadVerse
    }
    \new Lyrics \lyricsto "lead" \leadWordsVerse
    \new Staff \with {
      instrumentName = "Vocals 2"
      midiInstrument = "voice oohs"
    } {
      \new Voice = "backing" \backingVerse
    }
    \new Lyrics \lyricsto "backing" \backingWordsVerse
    \new PianoStaff \with {
      instrumentName = "Piano"
      midiInstrument = "acoustic grand"
    } <<
      \new Staff = "upper" \pianoVerseRH
      \new Staff = "lower" \pianoVerseLH
    >>
    \new Staff \with {
      instrumentName = "Guitar 1"
      midiInstrument = "overdriven guitar"
    } {
      \clef "treble_8"
      \guitarVerse
    }
    \new TabStaff \with {
      instrumentName = "Tab 1"
      midiInstrument = "overdriven guitar"
    } {
      \guitarVerse
    }
    \new Staff \with {
      instrumentName = "Guitar 2"
      midiInstrument = "distorted guitar"
    } {
      \clef "treble_8"
      \rhythmVerse
    }
    \new TabStaff \with {
      instrumentName = "Tab 2"
      midiInstrument = "distorted guitar"
    } {
      \rhythmVerse
    }
    \new Staff \with {
      instrumentName = "Bass"
      midiInstrument = "electric bass (finger)"
    } \bassVerse
    \new DrumStaff \with {
      instrumentName = "Drums"
    } {
      \drumGlobal
      <<
        \new DrumVoice \drumVerseHands
        \new DrumVoice \drumVerseFeet
      >>
    }
  >>
  \layout { }
  \midi { \tempo 4 = 132 }
}
