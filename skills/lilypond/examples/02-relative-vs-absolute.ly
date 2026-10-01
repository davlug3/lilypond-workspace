\version "2.26.0"
%% 02 — \relative vs absolute octave entry.
%% \relative c' { } means: start at c', then each note is the NEAREST
%% available pitch of its name, unless ' or , shift it by an octave.
%% Absolute mode: c' is middle C; ' raises, , lowers.

\score {
  <<
    \new Staff {
      \clef treble
      \relative c' { c d e f g a b c' }   %% one octave up from c'
    }
    \new Staff {
      \clef bass
      c4 d e f g a b c'                    %% absolute: same octave
    }
  >>
  \layout { }
}