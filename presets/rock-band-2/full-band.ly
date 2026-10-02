\version "2.24.4"
% Full rock band. All notes live in each part folder — edit there.
% Breaks mark the form: verse | build | chorus | stop+tag.

\include "shared/shared.ily"
\include "sections/intro/guitar.ily"
\include "sections/intro/keys.ily"
\include "sections/intro/drums.ily"
\include "sections/intro/bass.ily"
\include "sections/intro/vocals.ily"
\include "sections/intro/backing.ily"
\include "sections/intro/rhythm.ily"
\include "sections/verse/guitar.ily"
\include "sections/verse/keys.ily"
\include "sections/verse/drums.ily"
\include "sections/verse/bass.ily"
\include "sections/verse/vocals.ily"
\include "sections/verse/backing.ily"
\include "sections/verse/rhythm.ily"
\include "sections/chorus/guitar.ily"
\include "sections/chorus/keys.ily"
\include "sections/chorus/drums.ily"
\include "sections/chorus/bass.ily"
\include "sections/chorus/vocals.ily"
\include "sections/chorus/backing.ily"
\include "sections/chorus/rhythm.ily"

% Stitched variables: full-band view = verse + chorus.
leadFull = { \leadVerse \leadChorus }
leadWordsFull = \lyricmode { \leadWordsVerse \leadWordsChorus }
backingFull = { \backingVerse \backingChorus }
backingWordsFull = \lyricmode { \backingWordsVerse \backingWordsChorus }
pianoFullRH = { \pianoVerseRH \pianoChorusRH }
pianoFullLH = { \pianoVerseLH \pianoChorusLH }
guitarFull = { \guitarVerse \guitarChorus }
rhythmFull = { \rhythmVerse \rhythmChorus }
bassFull = { \bassVerse \bassChorus }
drumFullHands = { \drumVerseHands \drumChorusHands }
drumFullFeet = { \drumVerseFeet \drumChorusFeet }

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
