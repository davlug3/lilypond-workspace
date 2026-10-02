// Chord input mode, chord symbols, inversions, chord grids, figured bass.
// Source: references/chords-and-chordnames.md, examples/09.

module.exports = {
  id: "chords",
  title: "Chords & chord names",
  blurb:
    "\\chordmode is a separate input language from note mode. Symbols " +
    "inside notes, or c:7 outside chordmode, is the classic mixup.",
  entries: [
    {
      id: "chordmode",
      name: "\\chordmode",
      syntax: "\\chordmode { c1 | g:7 | a:m7 | f:maj7 | }",
      kind: "command",
      scope: "top",
      desc: "Chord-symbol input mode. No angle brackets; durations work as in note mode.",
      insert: "harmony = \\chordmode {\n  c1 | g:7 | f |\n}\n",
      note: "A chord lasts until the next symbol. Restate durations after rests. ~ holds a chord across the barline.",
      gotchas: ["Typing note-mode <c e g> inside \\chordmode is an error. The modes do not mix."],
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode {\n  \\time 4/4 c1 | g:7 | f | c |\n}\n\\score {\n  \\new ChordNames \\harmony\n  \\layout { }\n}\n',
    },
    {
      id: "chord-spellings",
      name: "Chord spellings",
      syntax: "c  c:m  c:7  c:maj7  c:m7  c:dim  c:aug  c:sus4  c:6  c:9",
      insert: "c:maj7 ",
      kind: "notation",
      scope: "chordmode",
      desc: "Bare letter = major. Colon then the quality. Alterations append: c:7.9-, c:9+.5+",
      note:
        "When unsure of a spelling, compile it and read the printed symbol - " +
        "ChordNames echoes exactly what it understood.",
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode {\n  \\time 4/4 c1 | c:m | c:7 | c:maj7 | c:m7 | c:dim | c:aug | c:sus4 | c:6 | c:9 |\n}\n\\score {\n  \\new ChordNames \\harmony\n  \\layout { }\n}\n',
    },
    {
      id: "inversion",
      name: "Slash chords / inversions",
      syntax: "\\chordmode { c/e  c/g }",
      kind: "notation",
      scope: "chordmode",
      desc: "Put the third or fifth in the bass. The symbol prints as a slash chord.",
      insert: "c/e",
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode {\n  \\time 4/4 c1 | c/e | c/g |\n}\n\\score {\n  \\new ChordNames \\harmony\n  \\layout { }\n}\n',
    },
    {
      id: "chordnames-context",
      name: "\\new ChordNames",
      syntax: "\\new ChordNames \\harmony",
      kind: "command",
      scope: "score",
      desc: "Prints the symbols on their own context above the staff.",
      insert: "\\new ChordNames \\harmony\n",
      note: "Group it with the staff in a << >> so it sits above.",
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode { \\time 4/4 c1 | g:7 | f | c | }\nmelody = \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | }\n\\score {\n  <<\n    \\new ChordNames \\harmony\n    \\new Staff { \\melody }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "chordname-props",
      name: "ChordNames properties",
      syntax: '\\new ChordNames \\with { majorSevenSymbol = "M7" }',
      kind: "property",
      scope: "context",
      desc: "Reshape the printed symbols. chordChanges hides repeats, chordNameSeparator, minorChordSymbol.",
      insert:
        '\\new ChordNames \\with {\n  majorSevenSymbol = "M7"\n} \\harmony',
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode { \\time 4/4 c1:maj7 | c1:maj7 | c1:maj7 | }\n\\score {\n  \\new ChordNames \\with { majorSevenSymbol = "M7" chordChanges = ##f } \\harmony\n  \\layout { }\n}\n',
    },
    {
      id: "chord-grid",
      name: "Chord grid (rhythm slash)",
      syntax: "\\chordmode { <c e g>1 }",
      insert: "\\chordmode {\n  <c e g>1\n}\n",
      kind: "notation",
      scope: "chordmode",
      desc: "Angle brackets INSIDE chordmode print a slash pattern instead of a symbol.",
      note: "One grid event per chord. Keep grids on their own staff.",
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode {\n  \\time 4/4\n  <c e g>1 | <c e g>2 <f a c>2 |\n}\n\\score {\n  \\new ChordNames \\harmony\n  \\layout { }\n}\n',
    },
    {
      id: "figured-bass",
      name: "\\new FiguredBass",
      syntax: "\\new FiguredBass { \\figuremode { <6 4>4 <7 3> <6> <_!> } }",
      kind: "snippet",
      scope: "score",
      desc: "Numbers under a bass staff. _ holds a figure, ! adds an accidental, - and + alter.",
      insert: "\\new FiguredBass {\n  \\figuremode {\n    <6 4>4 <7 3> <6> <_!>\n  }\n}\n",
      note: "Place the FiguredBass context below the bass staff.",
      probeFull:
        '\\version "2.26.0"\nbassLine = \\relative c { \\clef bass \\time 4/4 c2 e | g e | }\nfigs = { \\figuremode { \\time 4/4 <6 4>2 <7 3>2 | <6>2 <_!>2 | } }\n\\score {\n  <<\n    \\new Staff { \\bassLine }\n    \\new FiguredBass \\figs\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "lead-sheet",
      name: "Lead sheet skeleton",
      syntax: "ChordNames + Voice + Lyrics",
      kind: "template",
      scope: "score",
      desc: "Melody, chord symbols and lyrics in that order.",
      insert:
        "\\score {\n  <<\n    \\new ChordNames \\harmony\n    \\new Voice = \"mel\" { \\melody }\n    \\new Lyrics \\lyricsto \"mel\" \\wordsOne\n  >>\n  \\layout { }\n  \\midi { }\n}",
      note: "The Voice must be named \"mel\" so \\lyricsto can attach to it.",
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\'\' { \\time 4/4 c4 d e f | g2 a4 g | }\nharmony = \\chordmode { \\time 4/4 c1 | g:7 | f | c | }\nwordsOne = \\lyricmode { This is the lead sheet test }\n\\score {\n  <<\n    \\new ChordNames \\harmony\n    \\new Voice = "mel" { \\melody }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "mode-mixup",
      name: "Note mode vs chordmode",
      syntax: "notes: <c e g>2      chordmode: c:7",
      kind: "note",
      scope: "chordmode",
      desc: "Two separate input languages. Never mix them in one block.",
      note:
        "Typing c:7 in note mode prints nothing useful. Typing <c e g> " +
        "inside chordmode is a syntax error.",
    },
  ],
};