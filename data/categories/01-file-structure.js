// File-level skeleton: version line, header, variables, score/book,
// layout/midi/paper placement, includes.
// Source: references/file-structure.md, examples/01-file-anatomy.ly.

module.exports = {
  id: "file",
  title: "File structure",
  blurb:
    "The shape of every .ly file: version first, then header, then named " +
    "variables, then the score that assembles them. Define before use, " +
    "top to bottom.",
  entries: [
    {
      id: "version",
      name: "\\version",
      syntax: '\\version "2.26.0"',
      kind: "command",
      scope: "top",
      desc: "Line 1 of every file. Pins the syntax rules and tells convert-ly which rules to apply.",
      insert: '\\version "2.26.0"\n',
      note: "Omitting it produces: warning: no \\version statement found, please add",
      gotchas: [
        "Must be the very first line. A \\header above it is not allowed.",
        "Bump to 2.26.0 after running convert-ly; a stale version string compiles but misbehaves.",
      ],
      probeFull: '\\version "2.26.0"\n\\score { \\new Staff { c4 } \\layout { } }\n',
    },
    {
      id: "header",
      name: "\\header",
      syntax: '\\header { title = "..." composer = "..." }',
      kind: "command",
      scope: "top",
      desc: "Title block metadata.",
      insert: '\\header {\n  title = "Untitled"\n  composer = "Anon."\n}\n',
      note:
        "Fields: title subtitle subsubtitle composer arranger poet opus " +
        "piece meter instrument dedication copyright tagline.",
      gotchas: ["`lyrics` is reserved; never use it as a variable name."],
      probeFull:
        '\\version "2.26.0"\n\\header {\n  title = "Untitled"\n  composer = "Anon."\n}\n\\score { \\new Staff { c4 } \\layout { } }\n',
    },
    {
      id: "header-no-tagline",
      name: "\\header with tagline = ##f",
      syntax: "\\header { tagline = ##f }",
      kind: "snippet",
      scope: "top",
      desc: "Suppress the tagline on every page, not just page 1.",
      insert: "\\header { tagline = ##f }\n",
      probeFull:
        '\\version "2.26.0"\n\\header {\n  title = "No tagline"\n  tagline = ##f\n}\n\\score { \\new Staff { c4 } \\layout { } }\n',
    },
    {
      id: "music-variable",
      name: "Music variable",
      syntax: "melody = \\relative c' { c4 d e f }",
      kind: "snippet",
      scope: "top",
      desc: "A named music expression, reusable in \\score, \\include files, and other variables.",
      insert: "melody = \\relative c' {\n  c4 d e f | g2 r2 |\n}\n",
      note:
        "Write music in small named variables so each part compiles and " +
        "debugs on its own. Use a variable by naming it: \\melody",
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\' { \\key c \\major \\time 4/4 c4 d e f | g2 r2 | }\n\\score { \\new Staff \\melody \\layout { } }\n',
    },
    {
      id: "global",
      name: "global settings variable",
      syntax: "global = { \\key c \\major \\time 4/4 }",
      kind: "snippet",
      scope: "top",
      desc: "Shared key and meter, included into each voice so every part agrees.",
      insert: "global = {\n  \\key c \\major\n  \\time 4/4\n}\n",
      probeFull:
        '\\version "2.26.0"\nglobal = { \\key c \\major \\time 4/4 }\nmelody = \\relative c\' { \\global c4 d e f | g2 r2 | }\n\\score { \\new Staff \\melody \\layout { } }\n',
    },
    {
      id: "score",
      name: "\\score",
      syntax: "\\score { \\new Staff \\melody \\layout { } \\midi { } }",
      kind: "command",
      scope: "top",
      desc: "One printed system sequence. Several \\score blocks in one file print in order.",
      insert: "\\score {\n  \\new Staff \\melody\n  \\layout { }\n  \\midi { }\n}\n",
      gotchas: [
        "Bare music with no \\score still prints in 2.26 (implicit score), but you get no layout control and no MIDI file.",
      ],
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\' { \\key c \\major \\time 4/4 c4 d e f | g2 r2 | }\n\\score {\n  \\new Staff \\melody\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "score-no-layout",
      name: "\\score with \\midi only",
      syntax: "\\score { \\new Staff \\melody \\midi { } }",
      insert: "\\score {\n  \\new Staff { \\melody }\n  \\layout { }\n  \\midi { }\n}\n",
      kind: "snippet",
      scope: "top",
      desc: "Valid: you get a MIDI file and no PDF pages.",
      note: "Useful when you only want to hear the result.",
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\' { \\key c \\major \\time 4/4 c4 d e f | g2 r2 | }\n\\score {\n  \\new Staff \\melody\n  \\midi { }\n}\n',
    },
    {
      id: "book",
      name: "\\book / \\bookpart",
      syntax: "\\book { \\bookpart { \\score { ... } } }",
      kind: "snippet",
      scope: "top",
      desc: "Wrap movements in \\bookpart inside \\book. Each movement gets its own \\score and \\header.",
      insert:
        "\\book {\n  \\bookpart {\n    \\header { subtitle = \"I. Fast\" }\n    \\score { \\new Staff \\movementOne \\layout { } }\n  }\n}",
      probeFull:
        '\\version "2.26.0"\nmovementOne = \\relative c\' { \\key c \\major \\time 4/4 c4 d e f | g2 r2 | }\nmovementTwo = \\relative c\' { \\key c \\major \\time 4/4 c\'4 d\' e\' f\' | g\'2 r2 | }\n\\book {\n  \\bookpart {\n    \\header { subtitle = "I. Fast" }\n    \\score { \\new Staff \\movementOne \\layout { } \\midi { } }\n  }\n  \\bookpart {\n    \\header { subtitle = "II. Slow" }\n    \\score { \\new Staff \\movementTwo \\layout { } }\n  }\n}\n',
    },
    {
      id: "paper",
      name: "\\paper",
      syntax: '\\paper { #(set-paper-size "a4") }',
      kind: "command",
      scope: "top",
      desc: "Page setup for the whole file. Lengths take \\mm \\cm \\in \\pt.",
      insert: "\\paper {\n  #(set-paper-size \"a4\")\n}\n",
      gotchas: [
        "\\paper NEVER goes inside \\score. Top level only.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\paper {\n  #(set-paper-size "a4")\n}\n\\score { \\new Staff { \\time 4/4 c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "layout-block",
      name: "\\layout",
      syntax: "\\layout { #(layout-set-staff-size 16) }",
      kind: "command",
      scope: "score",
      desc: "Engraving settings for this score. Inside \\score = this score only; at top level = every score.",
      insert: "\\layout { }\n",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { }\n}\n',
    },
    {
      id: "midi-block",
      name: "\\midi",
      syntax: "\\midi { \\tempo 4 = 100 }",
      kind: "command",
      scope: "score",
      desc: "Playback block. No \\midi block means no MIDI file is written at all.",
      insert: "\\midi { }\n",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\midi { \\tempo 4 = 100 }\n}\n',
    },
    {
      id: "include",
      name: "\\include",
      syntax: '\\include "parts/violin.ily"',
      kind: "command",
      scope: "top",
      desc: "Paste another file at this point, relative to the current .ly file.",
      insert: '\\include "parts/shared.ily"\n',
      note: "Use it for variable definitions, placed BEFORE the \\score that uses them.",
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\' { \\key c \\major \\time 4/4 c4 d e f | g2 r2 | }\n\\score { \\new Staff \\melody \\layout { } }\n',
    },
    {
      id: "midi-instrument",
      name: "midiInstrument",
      syntax: '\\new Staff \\with { midiInstrument = "violin" }',
      kind: "property",
      scope: "context",
      desc: "General MIDI instrument for a staff (lowercase names). Drums use channel 10 automatically.",
      insert: "\\new Staff \\with { midiInstrument = \"acoustic grand\" } ",
      note:
        "Common names: acoustic grand, electric piano, violin, viola, " +
        "cello, contrabass, harp, flute, clarinet, oboe, trumpet, " +
        "trombone, tuba, alto sax, tenor sax, church organ, harpsichord.",
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\' { \\key c \\major \\time 4/4 c4 d e f | g2 r2 | }\n\\score {\n  \\new Staff \\with { midiInstrument = "violin" } \\melody\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "set-midi-instrument",
      name: "\\set Staff.midiInstrument",
      syntax: '\\set Staff.midiInstrument = "acoustic grand"',
      kind: "command",
      scope: "music",
      desc: "Change the MIDI instrument mid-piece.",
      insert: '\\set Staff.midiInstrument = "acoustic grand"',
      probe: '\\set Staff.midiInstrument = "acoustic grand" c4 d e f | g2 r2 |',
    },
    {
      id: "skeleton",
      name: "Minimal whole file",
      syntax: "version + header + melody + score",
      kind: "template",
      scope: "top",
      desc: "The shape of every file. Start from this rather than a blank buffer.",
      insert:
        '\\version "2.26.0"\n\n\\header {\n  title = "Piece"\n  composer = "Anon."\n}\n\nmelody = \\relative c\' {\n  \\key c \\major\n  \\time 4/4\n  c4 d e f | g2 r2 |\n}\n\n\\score {\n  \\new Staff \\melody\n  \\layout { }\n  \\midi { }\n}\n',
      probeFull:
        '\\version "2.26.0"\n\\header {\n  title = "Piece"\n  composer = "Anon."\n}\nmelody = \\relative c\' {\n  \\key c \\major\n  \\time 4/4\n  c4 d e f | g2 r2 |\n}\n\\score {\n  \\new Staff \\melody\n  \\layout { }\n  \\midi { }\n}\n',
    },
  ],
};