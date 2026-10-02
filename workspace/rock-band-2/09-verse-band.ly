\version "2.24.4"
% Full band, VERSE ONLY (bars 1-8). Notes live in each part folder.
% Play this MIDI to hear (or loop) just the verse.
\include "shared/shared.ily"
\include "vocals-lead/lead.ily"
\include "vocals-backing/backing.ily"
\include "piano/piano.ily"
\include "guitar1/guitar1.ily"
\include "guitar2/guitar2.ily"
\include "bass/bass.ily"
\include "drums/drums.ily"

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
