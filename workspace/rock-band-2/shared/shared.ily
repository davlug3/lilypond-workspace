% Shared setup for "Midnight Wire". Included by wrappers, never compiled alone.
% Timing + chord grids (verse = bars 1-8, chorus = bars 9-16; mixed/triad/five spellings).

global = {
  \key e \minor
  \time 4/4
  \tempo 4 = 132
}

verseChords = \chordmode {
  e1:m | e:m | c:5 | d:5 |
  e1:m | e:m | c:5 | d:5 |
}
chorusChords = \chordmode {
  g1:5 | d:5 | e:5 | c:5 |
  g1:5 | d:5 | c:5 | d:5 |
}
fullChords = \chordmode {
  \verseChords
  \chorusChords
}

triadVerseChords = \chordmode {
  e1:m | e:m | c | d |
  e1:m | e:m | c | d |
}
triadChorusChords = \chordmode {
  g1 | d | e:m | c |
  g1 | d | c | d |
}
triadFullChords = \chordmode {
  \triadVerseChords
  \triadChorusChords
}

fiveVerseChords = \chordmode {
  e1:5 | e:5 | c:5 | d:5 |
  e1:5 | e:5 | c:5 | d:5 |
}
fiveChorusChords = \chordmode {
  g1:5 | d:5 | e:5 | c:5 |
  g1:5 | d:5 | c:5 | d:5 |
}
fiveFullChords = \chordmode {
  \fiveVerseChords
  \fiveChorusChords
}
