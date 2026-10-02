// Multiple staves: the context tree, \\new, naming, instrument names,
// staff switching, and the group contexts that bracket and connect them.
// Source: references/voices-staves-polyphony.md §5-7, examples/08.

module.exports = {
  id: "staves",
  title: "Staves & contexts",
  blurb:
    "Score → StaffGroup/ChoirStaff/PianoStaff → Staff → Voice. Settings " +
    "inherit downward. Give every voice a name if anything needs to find it.",
  entries: [
    {
      id: "context-tree",
      name: "Context hierarchy",
      syntax: "Score → StaffGroup|ChoirStaff|PianoStaff → Staff → Voice",
      kind: "note",
      scope: "context",
      desc: "How contexts nest. Everything else follows from this.",
      note:
        "Settings inherit downward. Put shared key and time in each voice " +
        "(or a \\global variable), staff size in \\layout, page setup in \\paper.",
    },
    {
      id: "new-staff",
      name: "\\new Staff",
      syntax: "\\new Staff { c4 }",
      kind: "command",
      scope: "score",
      desc: "Creates a staff context holding music.",
      insert: "\\new Staff { c4 }\n",
      gotchas: ["Bare music with no \\new Staff wrapper will not attach to a score."],
      probe: "\\new Staff { c4 d e f | g2 r2 | }",
    },
    {
      id: "new-staff-named",
      name: "\\new Staff = \"name\"",
      syntax: '\\new Staff = "down" { \\clef bass \\lower }',
      kind: "command",
      scope: "score",
      desc: "A named staff. Needed when another voice must \\change Staff into it.",
      insert: '\\new Staff = "down" {\n  \\clef bass\n  c4 d e f | g2 r2 |\n}\n',
      probeFull:
        '\\version "2.26.0"\nupper = \\relative c\'\' { \\time 4/4 c4 e g c | g2 e4 c | }\nlower = \\relative c { \\clef bass \\time 4/4 c2 e | g e | }\n\\score {\n  \\new PianoStaff <<\n    \\new Staff = "up" { \\upper }\n    \\new Staff = "down" { \\lower }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "piano-staff",
      name: "\\new PianoStaff",
      syntax: '\\new PianoStaff << \\new Staff = "up" { } \\new Staff = "down" { } >>',
      kind: "snippet",
      scope: "score",
      desc: "Two staves joined by a brace with shared barlines. Right hand up, left hand down.",
      insert:
        '\\new PianoStaff <<\n  \\new Staff = "up" { \\clef treble \\upper }\n  \\new Staff = "down" { \\clef bass \\lower }\n>>',
      note: "Related: piano pedal attaches to notes as \\sustainOn / \\sustainOff.",
      probeFull:
        '\\version "2.26.0"\nupper = \\relative c\'\' { \\time 4/4 c4 e g c | g2 e4 c | }\nlower = \\relative c { \\clef bass \\time 4/4 c2 e | g e | }\n\\score {\n  \\new PianoStaff <<\n    \\new Staff = "up" { \\upper }\n    \\new Staff = "down" { \\lower }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "staff-group",
      name: "\\new StaffGroup",
      syntax: "\\new StaffGroup << \\new Staff ... \\new Staff ... >>",
      kind: "snippet",
      scope: "score",
      desc: "Several staves under a bracket, each keeping its own barlines. Quartet, band.",
      insert: "\\new StaffGroup <<\n  \\new Staff { \\partOne }\n  \\new Staff { \\partTwo }\n>>",
      probeFull:
        '\\version "2.26.0"\npartOne = \\relative c\'\' { \\time 4/4 c4 d e f | g2 r4 g | }\npartTwo = \\relative c\' { \\time 4/4 e4 f g a | b2 r4 b | }\n\\score {\n  \\new StaffGroup <<\n    \\new Staff { \\partOne }\n    \\new Staff { \\partTwo }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "choir-staff",
      name: "\\new ChoirStaff",
      syntax: "\\new ChoirStaff << \\new Staff { } \\new Staff { } >>",
      kind: "snippet",
      scope: "score",
      desc: "Like StaffGroup but with shared barlines. The SATB choice.",
      insert: "\\new ChoirStaff <<\n  \\new Staff = \"sa\" { }\n  \\new Staff = \"tb\" { }\n>>",
      probeFull:
        '\\version "2.26.0"\nsop = \\relative c\'\' { \\key g \\major \\time 4/4 g4 a b c | d2 b | }\nten = \\relative c\' { \\clef "treble_8" \\key g \\major \\time 4/4 b4 c d e | fis2 d | }\n\\score {\n  \\new ChoirStaff <<\n    \\new Staff = "sa" { \\new Voice = "soprano" { \\voiceOne \\sop } }\n    \\new Staff = "tb" { \\new Voice = "tenor" { \\voiceOne \\ten } }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "new-voice-named",
      name: '\\new Voice = "name"',
      syntax: '\\new Voice = "mel" { \\melody }',
      kind: "command",
      scope: "score",
      desc: "Creates a named voice. The name is how \\lyricsto and \\change Staff find it.",
      insert: '\\new Voice = "mel" {\n  \\melody\n}\n',
      note: "Name a voice whenever lyrics, MIDI lanes, or tweaks must attach to it.",
      probe: '\\new Voice = "mel" { \\voiceOne c4 d e f | g2 r4 g | }',
    },
    {
      id: "instrument-name",
      name: "instrumentName / shortInstrumentName",
      syntax: '\\new Staff \\with { instrumentName = "Violin I" }',
      kind: "property",
      scope: "context",
      desc: "Long name prints before the first system, short name before each later one.",
      insert:
        '\\new Staff \\with {\n  instrumentName = "Violoncello"\n  shortInstrumentName = "Vc."\n} ',
      note: "\\with customizes the context at creation. Set both names or the score looks half-finished.",
      probeFull:
        '\\version "2.26.0"\nvln = \\relative c\'\' { \\time 4/4 c4 d e f | g2 r4 g | }\nvc = \\relative c { \\clef bass \\time 4/4 c2 e | g e | }\n\\score {\n  \\new StaffGroup <<\n    \\new Staff \\with { instrumentName = "Violin I" shortInstrumentName = "Vln." } \\vln\n    \\new Staff \\with { instrumentName = "Violoncello" shortInstrumentName = "Vc." } { \\clef bass \\vc }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "change-staff",
      name: '\\change Staff = "down"',
      syntax: '\\change Staff = "down"',
      kind: "command",
      scope: "music",
      desc: "Move a voice to a different staff mid-piece. Both staves must be named.",
      insert: '\\change Staff = "down"',
      note:
        "Verified 2.26.0 shape: the TARGET staff must itself contain a " +
        "\\new Voice, and the switch is issued inside a voice. Compiles clean " +
        "and the music moves to the named staff.",
      gotchas: [
        "A target staff with no voice inside -- \\new Staff = \"down\" { \\clef bass } -- fails with: warning: cannot find context to change to: Staff = down (observed on 2.26.0, not stated in the skill's reference).",
        "Both staves must exist and be named.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new PianoStaff <<\n    \\new Staff = "up" <<\n      \\new Voice = "v" { \\voiceOne \\time 4/4 c4 e g c | g2 e4 c | }\n    >>\n    \\new Staff = "down" <<\n      \\new Voice = "w" {\n        \\voiceOne \\clef bass\n        \\time 4/4 c2 e | g e |\n        \\change Staff = "up"\n        c4 e g c | g2 e4 c |\n      }\n    >>\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "chordnames-context",
      name: "\\new ChordNames",
      syntax: "\\new ChordNames \\harmony",
      kind: "command",
      scope: "score",
      desc: "Its own context above the staff that prints chord symbols from \\chordmode music.",
      insert: "\\new ChordNames \\harmony\n",
      gotchas: [
        "\\chordmode music dropped straight into a Staff prints notes, not symbols. It needs \\new ChordNames.",
      ],
      probeFull:
        '\\version "2.26.0"\nharmony = \\chordmode { \\time 4/4 c1 | g:7 | }\nmelody = \\relative c\' { \\time 4/4 c4 d e f | g2 r4 g | }\n\\score {\n  <<\n    \\new ChordNames \\harmony\n    \\new Staff { \\melody }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "lyrics-context",
      name: "\\new Lyrics",
      syntax: '\\new Lyrics \\lyricsto "mel" \\wordsOne',
      kind: "command",
      scope: "score",
      desc: "A lyrics context bound to a named voice.",
      insert: '\\new Lyrics \\lyricsto "mel" \\wordsOne\n',
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { Three4 blind mice2 }\nmelody = \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | }\n\\score {\n  <<\n    \\new Voice = "mel" { \\melody }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "two-staves-simplest",
      name: "Two staves, minimal",
      syntax: "\\new StaffGroup << \\new Staff { } \\new Staff { } >>",
      kind: "snippet",
      scope: "score",
      desc: "The smallest multi-staff score. Copy this as the starting point for a band.",
      insert:
        "\\new StaffGroup <<\n  \\new Staff { \\partOne }\n  \\new Staff { \\partTwo }\n>>\n\\layout { }\n\\midi { }",
      probeFull:
        '\\version "2.26.0"\npartOne = \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | }\npartTwo = \\relative c { \\time 4/4 c4 d e f | g2 r2 | }\n\\score {\n  \\new StaffGroup <<\n    \\new Staff { \\partOne }\n    \\new Staff { \\partTwo }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "quartet",
      name: "String quartet skeleton",
      syntax: "StaffGroup with instrument names",
      kind: "snippet",
      scope: "score",
      desc: "Four independent staves, viola in alto clef, cello in bass clef.",
      insert:
        '\\new StaffGroup <<\n  \\new Staff \\with { instrumentName = "Violin I" } \\violinI\n  \\new Staff \\with { instrumentName = "Violin II" } \\violinII\n  \\new Staff \\with { instrumentName = "Viola" } { \\clef alto \\viola }\n  \\new Staff \\with { instrumentName = "Cello" } { \\clef bass \\cello }\n>>\n\\layout { indent = 2\\cm }\n\\midi { }',
      probeFull:
        '\\version "2.26.0"\nviolinI  = \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | }\nviolinII = \\relative c\' { \\time 4/4 e4 f g a | b2 r2 | }\nviola    = \\relative c { \\clef alto \\time 4/4 c4 d e f | g2 r2 | }\ncello    = \\relative c { \\clef bass \\time 4/4 c,2 d,2 | e,1 | }\n\\score {\n  \\new StaffGroup <<\n    \\new Staff \\with { instrumentName = "Violin I" } \\violinI\n    \\new Staff \\with { instrumentName = "Violin II" } \\violinII\n    \\new Staff \\with { instrumentName = "Viola" } { \\clef alto \\viola }\n    \\new Staff \\with { instrumentName = "Cello" } { \\clef bass \\cello }\n  >>\n  \\layout { indent = 2\\cm }\n  \\midi { }\n}\n',
    },
    {
      id: "satb",
      name: "SATB skeleton",
      syntax: "ChoirStaff, two voices per staff, \\clef \"treble_8\" for tenor",
      kind: "snippet",
      scope: "score",
      desc: "Soprano and alto share a staff, tenor and bass share another. Tenor staff uses treble_8.",
      insert:
        '\\new ChoirStaff <<\n  \\new Staff = "sa" <<\n    \\clef treble\n    \\new Voice = "soprano" { \\voiceOne \\global \\soprano }\n    \\new Voice = "alto"    { \\voiceTwo \\global \\alto }\n  >>\n  \\new Lyrics \\lyricsto "soprano" \\sopranoWords\n  \\new Lyrics \\lyricsto "alto" \\altoWords\n  \\new Staff = "tb" <<\n    \\clef "treble_8"\n    \\new Voice = "tenor" { \\voiceOne \\global \\tenor }\n    \\new Voice = "bass"  { \\voiceTwo \\global \\bass }\n  >>\n  \\new Lyrics \\lyricsto "tenor" \\tenorWords\n  \\new Lyrics \\lyricsto "bass" \\bassWords\n>>\n\\layout { }\n\\midi { }',
      probeFull:
        '\\version "2.26.0"\nglobal = { \\time 4/4 }\nsoprano = \\relative c\' { c4 d e f | g2 r2 | }\nalto    = \\relative c\' { e4 f g a | b2 r2 | }\ntenor   = \\relative c\' { c4 d e f | g2 r2 | }\nbass    = \\relative c { c,4 d, e, f, | g,2 r2 | }\nsopranoWords = \\lyricmode { la la la la | la la la }\n   altoWords = \\lyricmode { la la la la | la la la }\n   tenorWords = \\lyricmode { la la la la | la la la }\n   bassWords  = \\lyricmode { la la la la | la la la }\n\\score {\n  \\new ChoirStaff <<\n    \\new Staff = "sa" <<\n      \\clef treble\n      \\new Voice = "soprano" { \\voiceOne \\global \\soprano }\n      \\new Voice = "alto"    { \\voiceTwo \\global \\alto }\n    >>\n    \\new Lyrics \\lyricsto "soprano" \\sopranoWords\n    \\new Lyrics \\lyricsto "alto" \\altoWords\n    \\new Staff = "tb" <<\n      \\clef "treble_8"\n      \\new Voice = "tenor" { \\voiceOne \\global \\tenor }\n      \\new Voice = "bass"  { \\voiceTwo \\global \\bass }\n    >>\n    \\new Lyrics \\lyricsto "tenor" \\tenorWords\n    \\new Lyrics \\lyricsto "bass" \\bassWords\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
  ],
};