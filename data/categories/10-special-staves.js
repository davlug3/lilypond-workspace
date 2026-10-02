// Non-standard staves: percussion/drum mode, tablature, staff lines,
// mensural signs, unpitched staves.
// Source: references/special-staves.md, examples/13.

module.exports = {
  id: "special",
  title: "Special staves",
  blurb:
    "Drums, guitar tablature, custom staff lines. These use their own " +
    "input modes; note names and durations still apply, but the pitch " +
    "meaning changes or disappears.",
  entries: [
    {
      id: "drummode",
      name: "\\drummode",
      syntax: '\\drummode { \\time 4/4 bd4 sn hh cymc }',
      kind: "command",
      scope: "top",
      desc: "Percussion input. Note names are drum instruments, not pitches.",
      insert: '\\drummode {\n  \\time 4/4\n  \\bar "|."\n  bd4 sn sn sn |\n}\n',
      note:
        "The drum context and the pitched staff are SEPARATE contexts in a " +
        "score, each with its own \\time. Declare \\new DrumStaff, not \\new Staff.",
      gotchas: [
        "130 names exist in 2.26. The ones worth knowing: bd (bass drum), sn (snare), hh (closed hi-hat), hho (open), cymc (crash cymbal), cymr (ride), cab, mar (maracas), toms tomh/toml, tamb, timh/timl, wbh/wbl (wood block), cl, cuim.",
        "COMMON WRONG NAMES, each rejected by 2.26 with error: not a note name -- ride, crash, cyc, splash, cymbal, ridecy, crashcy. Use ridecymbal, crashcymbal, cymc, splashhihat, splashcymbal instead.",
        "Checked against 2.26's own share/ly/drumpitch-init.ly, which defines exactly 130 names.",
        "Multi-stroke rolls: bd8-> ff bd ff means a flam.",
      ],
      probeFull:
        '\\version "2.26.0"\nperc = \\drummode {\n  \\time 4/4\n  \\bar "|."\n  bd4 sn sn sn |\n  bd4 sn hh4 hh4 |\n}\n\\score {\n  <<\n    \\new DrumStaff <<\n      \\new DrumVoice = "drums" { \\perc }\n    >>\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "no-drumsstaff",
      name: "There is no \\new DrumsStaff",
      syntax: "\\new DrumsStaff   -- does not exist in 2.26",
      kind: "warning",
      scope: "score",
      desc:
        "Only one drum context is creatable: \\new DrumStaff. Everything " +
        "else people reach for fails.",
      note:
        "Checked by compiling \\new X for each of Drum, Drums, Drumset, " +
        "DrumsStaff on 2.26.0: all four give warning: cannot create context: " +
        "X. Only DrumStaff works. The other identifiers are instrument " +
        "names used with \\set Staff.instrumentName, not contexts.",
      probeFull:
        '\\version "2.26.0"\nperc = \\drummode { \\time 4/4 bd4 sn hh8 hh hh hh | }\n\\score {\n  \\new DrumStaff <<\n    \\new DrumVoice { \\perc }\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "drum-notes",
      name: "Common drum names",
      syntax: "bd sn hh cymc ridecymbal crashcymbal",
      kind: "notation",
      scope: "drum",
      desc:
        "The instruments you will actually need. " +
        "bass/snare/cymbals/ride, plus hh = hi-hat.",
      insert: "bd4 sn hh8 hh ",
      note: "Never invent a name; compile it. An unknown drum name is an error naming the accepted list.",
      probeFull:
        '\\version "2.26.0"\nperc = \\drummode { \\time 4/4 bd4 sn sn sn | hh8 hh hh hh cymc4 ridecymbal4 | }\n\\score {\n  <<\n    \\new DrumStaff <<\n      \\new DrumVoice { \\perc }\n    >>\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "drum-mid-change",
      name: "Mid-piece drum change",
      syntax: '\\change Staff = "cymbals"',
      kind: "note",
      scope: "note",
      desc: "Two DrumStaves grouped in a StaffGroup, switched with \\change Staff = \"name\".",
      note:
        "The 'change' notation used in charts maps onto \\change Staff. " +
        "Name BOTH staves, and give the second staff its own DrumVoice " +
        "holding at least a spacer rest, or nothing can be switched into.",
      gotchas: [
        "There is NO \\new DrumGroup in 2.26: it fails with warning: cannot create context: DrumGroup. Confirmed by grepping 2.26's ly/*.ly, which define only Drum, DrumStaff, DrumVoice, Drums and Drumset. Use \\new StaffGroup.",
      ],
      probeFull:
        '\\version "2.26.0"\nperc = \\drummode {\n  \\time 4/4\n  \\bar "|."\n  bd4 sn sn sn |\n  \\change Staff = "cymbals"\n  cymc4 hh4 hh4 hh4 |\n  \\bar "|."\n}\n\\score {\n  <<\n    \\new StaffGroup <<\n      \\new DrumStaff = "drums" <<\n        \\new DrumVoice = "drumsVoice" { \\perc }\n      >>\n      \\new DrumStaff = "cymbals" <<\n        \\new DrumVoice = "cymbalsVoice" { s1 s1 }\n      >>\n    >>\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "tablature",
      name: "Guitar tablature",
      syntax: "tab = { e'\\2\\3 g'\\2\\0 b'\\3\\2 c'\\2\\1 }",
      kind: "snippet",
      scope: "top",
      desc:
        "A six-line staff carrying frets. The pitch letter picks the " +
        "octave; two numbers after it give the STRING then the FRET.",
      insert:
        "tab = {\n  \\time 4/4\n  e'\\2\\3 g'\\2\\0 b'\\3\\2 c'\\2\\1 |\n}\n",
      note:
        "Order is \\string then \\fret, both AFTER the duration. " +
        "String 1 is the highest-pitched (thin) E string; fret 0 is open.",
      gotchas: [
        "CORRECTION to the skill's special-staves.md, which shows e'0 g'0 B0 c'1. That form does not compile: `error: not a duration` on every number, and the capital B is not a note name.",
        "Writing one fret only (e'\\3) compiles but warns: Requested string for pitch requires negative fret ... Ignoring string request and recalculating. Always give both.",
        "Tablature is a SEPARATE context paired with the Staff in a << >>. Write both parts or the tab floats unaligned.",
      ],
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\'\' { \\time 4/4 c4 e g c\' | c,1 | }\ntab = { \\time 4/4 e\'\\2\\3 g\'\\2\\0 b\'\\3\\2 c\'\\2\\1 | c\'1\\2\\0 | }\n\\score {\n  <<\n    \\new TabStaff <<\n      \\new TabVoice = "tab" { \\tab }\n    >>\n    \\new Staff { \\melody }\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "staff-lines",
      name: "\\stopStaff",
      syntax: "c4\\stopStaff d\\startStaff e",
      kind: "command",
      scope: "music",
      desc: "Hide or restore staff lines under notes - used for fretted harmonics and some unpitched notation.",
      insert: "c4\\stopStaff ",
      probe: "c4\\stopStaff d4\\startStaff e4 f |",
    },
    {
      id: "remove-empty",
      name: "\\RemoveEmptyStaves",
      syntax: "\\layout { \\context { \\Staff \\RemoveEmptyStaves } }",
      insert: "\\RemoveEmptyStaves ",
      kind: "property",
      scope: "layout",
      desc: "Drop staves that rest for a whole section, so a tacet part does not print six empty systems.",
      note: "The right way to handle a part that enters late.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  <<\n    \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } }\n    \\new Staff { R1 | R1 | }\n  >>\n  \\layout { \\context { \\Staff \\RemoveEmptyStaves } }\n}\n',
    },
    {
      id: "remove-all-empty",
      name: "RemoveAllEmptyStaves",
      syntax: "\\layout { \\context { \\RemoveAllEmptyStaves } }",
      insert: "\\RemoveAllEmptyStaves ",
      kind: "property",
      scope: "layout",
      desc: "Same idea, applied to every context type at once.",
      note: "It must sit inside a \\context block, not directly in \\layout.",
      // \\RemoveAllEmptyStaves must live inside a \\context block. Placing it
      // directly in \\layout gives error: bad expression type (observed 2.26.0).
      probeFull:
        '\\version "2.26.0"\n\\score {\n  <<\n    \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } }\n    \\new Staff { R1 | R1 | }\n  >>\n  \\layout { \\context { \\RemoveAllEmptyStaves } }\n}\n',
    },
    {
      id: "hide-empty-lyrics",
      name: "Hiding empty lyric stanzas",
      syntax: "\\override VerticalAxisGroup.remove-empty = ##t",
      kind: "property",
      scope: "context",
      desc: "Stops blank verse lines printing under instrumental staves.",
      insert:
        '\\new Lyrics \\with {\n  \\override VerticalAxisGroup.remove-empty = ##t\n} \\lyricsto "mel" \\wordsOne\n',
      note:
        "Correct grob is VerticalAxisGroup, and the property is " +
        "remove-empty. LyricText.HideEmptyStaves is the intuitive guess and " +
        "it does not exist: observed warning: the property " +
        "'HideEmptyStaves' does not exist (perhaps a typing error).",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { la la la la }\nmelody = \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | }\n\\score {\n  <<\n    \\new Voice = "mel" { \\melody }\n    \\new Lyrics \\with { \\override VerticalAxisGroup.remove-empty = ##t } \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "mensural-signs",
      name: "Mensural signs",
      syntax: '\\numericTimeSignature \time 4/4',
      insert: "\\time 4/4 ",
      kind: "snippet",
      scope: "note",
      desc:
        "Common time and cut time can be written as C and cut-C on the " +
        "staff rather than 4/4 and 2/2.",
      note: "Use \\time 4/4 in the input; the sign is a rendering choice.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  <<\n    \\new Staff {\n      \\relative c\' { \\time 4/4 c4 d e f | g1 | }\n    }\n  >>\n  \\layout { }\n}\n',
    },
  ],
};