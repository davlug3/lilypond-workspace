// Grob tweaking: \\set vs \\override, the tweak operator, span commands,
// common grobs and their properties, and how to undo a change.
// Source: references/tweaking-and-internals.md.

module.exports = {
  id: "tweaks",
  title: "Tweaking & overrides",
  blurb:
    "\\override Grob.property = value for engraving, \\set Context.property " +
    "for behaviour. Change nothing until the PNG tells you what to change.",
  entries: [
    {
      id: "override-shape",
      name: "\\override",
      syntax: "\\override NoteHead.color = #red",
      kind: "command",
      scope: "music",
      desc: "Sets a property on a grob (a drawn object). This is the engraving tool.",
      insert: "\\override NoteHead.color = #red ",
      note: "Affects every following NoteHead until reverted or the music ends.",
      probe: "\\override NoteHead.color = #red c4 d e f | g2 r2 |",
    },
    {
      id: "set-shape",
      name: "\\set",
      syntax: "\\set Staff.instrumentName = \"Vln.\"",
      kind: "command",
      scope: "music",
      desc: "Sets a property on a CONTEXT. This is the behaviour tool.",
      insert: '\\set Staff.instrumentName = "Vln." ',
      note: "Timing, naming, counting, MIDI and instrument settings all go through \\set.",
      probe: '\\set Staff.instrumentName = "Vln." c4 d e f | g2 r2 |',
    },
    {
      id: "set-vs-override-rule",
      name: "Which one?",
      syntax: "\\set Context.x   vs   \\override Grob.y",
      kind: "note",
      scope: "note",
      desc: "Decide by asking whether the thing is a drawing or a behaviour.",
      note:
        "\\set     = Staff.instrumentName, Score.tempo, Voice.Strings, Timing.transposition, any midiInstrument\n" +
        "\\override = NoteHead.color, Stem.length, StaffSymbol.line-count, LyricText.font-size\n" +
        "In \\layout both are written as \\override or \\set inside the block.",
    },
    {
      id: "set-on-grob-fails",
      name: "\\set aimed at a grob fails",
      syntax: "\\set NoteHead.color = #red   -- broken",
      kind: "warning",
      scope: "music",
      desc: "The most common \\set/\\override confusion, and its exact 2.26 output.",
      note:
        "Observed on 2.26.0, two warnings, and the music still prints:\n" +
        "  warning: cannot find or create context: NoteHead\n" +
        "  warning: the property 'color' does not exist (perhaps a typing error)",
      gotchas: [
        "It is a WARNING, not an error - the run completes and you get a PDF that ignores your change. Look at the PNG.",
        "Conversely \\override with a misspelled grob is a hard error: error: bad grob property path.",
      ],
      // Verified by expecting the documented failure, not by compiling clean.
      expectFail: true,
      expectText: "cannot find or create context: NoteHead",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 \\set NoteHead.color = #red c4 d e f | g2 r2 | } }\n  \\layout { }\n}\n',
    },
    {
      id: "revert",
      name: "\\revert",
      syntax: "\\override NoteHead.color = #red   \\override NoteHead.color = #black",
      kind: "command",
      scope: "music",
      desc: "Returns a grob property to its default.",
      insert: "\\override NoteHead.color = #black ",
      note: "\\revert is rarely needed; simply override again with the default value.",
      probe: "\\override NoteHead.color = #red c4 d e f | \\override NoteHead.color = #black g2 r2 |",
    },
    {
      id: "tweak-op",
      name: "\\tweak (one note only)",
      syntax: "c4\\tweak color #red",
      kind: "command",
      scope: "music",
      desc: "Attaches a property change to the single preceding note, without a global override.",
      insert: "c4\\tweak color #red ",
      note:
        "\\tweak is a standalone command placed AFTER the note, and it " +
        "takes bare property/value pairs with NO '=' sign. Use it for " +
        "one-offs; \\override when the change should last several notes.",
      gotchas: [
        "CORRECTION to the skill's tweaking-and-internals.md, which shows c-\\tweak color #red. The hyphen form is a hard error on 2.26.0: error: post-event expected. Write c4\\tweak color #red.",
        "There is no standalone \\color or any other property command: \\color gives error: unknown command: `\\color'.",
      ],
      probe: "c4\\tweak color #red d4 e4 f4 | g2 r2 |",
    },
    {
      id: "tweak-dotted",
      name: "\\tweak on a chord",
      syntax: "<c e g>4\\tweak color #red",
      kind: "snippet",
      scope: "music",
      desc: "Place \\tweak after the chord event; the change applies to that chord only.",
      insert: "<c e g>4\\tweak color #red ",
      note:
        "\\tweak attaches to the preceding music EVENT, so for a chord " +
        "the whole chord is affected. It does not go inside the <>.",
      gotchas: [
        "Putting \\tweak inside the angle brackets (<c e-\\tweak color #red g>4) is error: post-event expected on 2.26.0.",
      ],
      probe: "<c e g>4\\tweak color #red <d f a>4 <c e g>4 <b d g>4 |",
    },
    {
      id: "span-commands",
      name: "Span commands",
      syntax: "\\override Stem.color = #red c4 d e f \\revert Stem.color g2",
      kind: "note",
      scope: "music",
      desc: "An override followed by \\revert (or a later override) limits the change to a span.",
      note: "This is how you colour one passage and not the whole piece.",
      probe: "\\override Stem.color = #red c4 d e f \\revert Stem.color g2 r2 |",
    },
    {
      id: "common-notehead",
      name: "NoteHead properties",
      syntax: "\\override NoteHead.duration-log = #2",
      insert: "\\override NoteHead.duration-log = #2 ",
      kind: "property",
      scope: "music",
      desc: "Turn quarters into diamonds, doubles into triangles, or black a note.",
      note:
        "duration-log = #2 diamonds, #3 double-diamond, #1 triangles. " +
        "Also: color, style #'black, font-size, direction, note-names.",
      probe: "\\override NoteHead.duration-log = #2 c4 d e f | g2 r2 |",
    },
    {
      id: "common-stem",
      name: "Stem properties",
      syntax: "\\override Stem.length = #8",
      kind: "property",
      scope: "music",
      desc: "Stem length, direction, thickness and colour.",
      insert: "\\override Stem.length = #8 ",
      note: "Forcing stems on a single-voice staff: \\override Stem.neutral-direction = #UP",
      probe: "\\override Stem.length = #8 c4 d e f | g2 r2 |",
    },
    {
      id: "common-staffsymbol",
      name: "StaffSymbol properties",
      syntax: "\\override StaffSymbol.line-count = #5",
      kind: "property",
      scope: "music",
      desc: "Line count and thickness. Useful for tablature and for staffless notation.",
      insert: "\\override StaffSymbol.line-count = #5 ",
      probe: "\\override StaffSymbol.line-count = #5 c4 d e f | g2 r2 |",
    },
    {
      id: "common-script",
      name: "Script grobs",
      syntax: "\\override Script.color = #blue",
      kind: "property",
      scope: "music",
      desc: "Script covers text scripts and dynamic marks attached to notes.",
      insert: "\\override Script.color = #blue ",
      probe: "\\override Script.color = #blue c4\\p d4\\accent e4\\staccato f4 | g2 r2 |",
    },
    {
      id: "common-slurbeam",
      name: "Slur and Beam properties",
      syntax: "\\override Slur.color = #red   \\override Beam.gap = #4",
      kind: "property",
      scope: "music",
      desc: "Slur: color thickness, direction. Beam: gap, thickness, slope, position.",
      insert: "\\override Beam.gap = #4 ",
      probe: "\\override Slur.color = #red c4( d e f) | g4 a4 b4 c' |",
    },
    {
      id: "common-time-signature",
      name: "TimeSignature and Clef",
      syntax: "\\override TimeSignature.color = #red",
      insert: "\\override TimeSignature.color = #red ",
      kind: "property",
      scope: "music",
      desc: "Appearance of the meter and clef at a point in the music.",
      probe: "\\override TimeSignature.color = #red \\time 3/4 c4 d e | f2. |",
    },
    {
      id: "colors",
      name: "Colours",
      syntax: "#red #blue #darkcyan #(x11-color 'red)",
      kind: "notation",
      scope: "note",
      desc: "Named basic colours: red green blue cyan magenta yellow white black darkgrey lightgrey.",
      insert: "#red ",
      note:
        "Custom: #(x11-color 'orange) or #(rgb-color 1 0.5 0). " +
        "Colours do NOT appear in printed output unless a colour profile " +
        "is defined in \\paper - that is advanced and usually not wanted.",
      probe: "\\override NoteHead.color = #darkcyan c4 d e f | g2 r2 |",
    },
    {
      id: "paper-colour-profile",
      name: "colormaps / colour profiles",
      kind: "note",
      scope: "paper",
      desc: "Required before colour reaches print output.",
      note:
        "In \\paper: #(define output-ps-file #f) plus a colormaps block. " +
        "Skip this unless the user explicitly asks for coloured PDF; the " +
        "default is black-and-white print and colour affects only the PNG preview.",
    },
    {
      id: "tweak-vs-override-choice",
      name: "\\tweak or \\override?",
      syntax: "c4\\tweak color #red   /   \\override NoteHead.color = #red",
      kind: "note",
      scope: "note",
      desc: "One note or one-off: \\tweak. Several notes or a passage: \\override.",
      note: "\\tweak needs no \\revert; an \\override without one leaks to the end of the block.",
    },
    {
      id: "layout-block-overrides",
      name: "Overrides in \\layout and \\paper",
      syntax: "\\layout { \\context { \\Score \\override MetronomeMark.font-size = #2 } }",
      insert: "\\context {\n  \\Score\n  \\override MetronomeMark.font-size = #2\n}\n",
      kind: "snippet",
      scope: "layout",
      desc: "The same override language applies inside \\layout and \\paper, nested in \\context blocks.",
      note: "Global settings belong here so the music stays readable.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\tempo 4 = 100 \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout {\n    \\context {\n      \\Score\n      \\override MetronomeMark.font-size = #2\n    }\n  }\n}\n',
    },
    {
      id: "examine",
      name: "Looking up a property's legal values",
      syntax: "\\override Stem.direction = #BOGUS",
      kind: "note",
      scope: "note",
      desc: "Assign a nonsense value and 2.26 tells you the legal ones in a warning.",
      note:
        "This is the reliable way to avoid guessing. Observed on 2.26.0: " +
        "warning: direction of grob Stem must be UP or DOWN; using UP " +
        "(plus a Guile error on the bogus constant). Grep LilyPond's own " +
        "share/ly/*.ly for existing usages of a property you are unsure of.",
      gotchas: [
        "Omitting the value does NOT list them. \\override Stem (no value) gives error: bad grob property path.",
        "A misspelled PROPERTY is often ignored in silence - the log is the only way to notice.",
      ],
      expectFail: true,
      expectText: "must be UP or DOWN",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 \\override Stem.direction = #BOGUS c4 d e f | g2 r2 | } }\n  \\layout { }\n}\n',
    },
  ],
};