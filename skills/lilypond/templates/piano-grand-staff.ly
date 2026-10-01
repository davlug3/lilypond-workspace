\version "2.26.0"
%% Piano grand staff: right hand + left hand on a PianoStaff,
%% with dynamics, pedal, and a midi block.
%% Note: notes entered \relative c (each staff's base octave differs);
%% each hand goes in its own named Staff so \change Staff etc. can find them.

\header {
  title = "Piano"
  subtitle = "grand staff"
  composer = "C. Composer"
}

upper = \relative c'' {
  \time 4/4
  \dynamicUp
  c4 e g c | g2 e4 c | g'4\ff e c g | c2 r2 |
}

lower = \relative c {
  \clef bass
  c'2 e | g e | c a, | c r |
}

\score {
  \new PianoStaff <<
    \new Staff = "up" { \upper }
    \new Staff = "down" { \lower }
  >>
  \layout { }
  \midi { }
}

%% Sustain pedal (verified 2.26 syntax): attach \sustainOn / \sustainOff
%% to notes inside either staff.
pedalScore = {
  \new PianoStaff <<
    \new Staff = "up" {
      \relative c'' { c4\sustainOn d e g <c, f a>1\sustainOff }
    }
    \new Staff = "down" {
      \clef bass \relative c { c2 d e1 }
    }
  >>
}