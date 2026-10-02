// Sequential vs simultaneous, chords, multiple voices on one staff,
// and parallel authoring. Source: references/voices-staves-polyphony.md §1-4,
// examples/08-two-voices-one-staff.ly.
//
// Every `probe` is a staff-level body wrapped by scripts/verify-syntax.js;
// every `probeFull` is a complete file. Nothing here is included in the
// palette unless it compiles clean with zero warnings.

module.exports = {
  id: "polyphony",
  title: "Polyphony",
  blurb:
    "Playing several things at once. The one decision that matters: a chord " +
    "is one voice with several pitches, several voices are several rhythms. " +
    "Never mix the two notations.",
  entries: [
    {
      id: "sequential",
      name: "Sequential { }",
      syntax: "{ c4 d e f }",
      kind: "notation",
      scope: "music",
      desc: "One voice, notes in order. The default container for music.",
      insert: "{ c4 d e f }",
      note:
        "Braces must balance. An unclosed { is the single most common " +
        "generated-file error and the cascade of errors that follows it.",
      probe: "{ c4 d e f }",
    },
    {
      id: "simultaneous",
      name: "Simultaneous << >>",
      syntax: "<< { c4 d e f } { c,2 c,} >>",
      kind: "notation",
      scope: "music",
      desc: "Two or more music expressions stacked to sound at the same time.",
      insert: "<< { c4 d e f } { c,2 c,} >>",
      note:
        "Every << needs a >>. Count both bracket pairs before compiling; " +
        "LilyPond's first error is rarely the real one.",
      gotchas: [
        "<< >> at the top of a score is also how you group contexts (\\new Staff ...), not just voices.",
      ],
      probe: "\\new Voice = \"a\" { \\voiceOne c4 d e f | g2 r4 g | } \\new Voice = \"b\" { \\voiceTwo c,2 c, | }",
    },
    {
      id: "chord",
      name: "Chord < >",
      syntax: "<c e g>2",
      kind: "notation",
      scope: "music",
      desc: "One voice sounding several pitches together.",
      insert: "<c e g>2",
      note:
        "The duration goes AFTER the closing >. Inside a chord you write " +
        "pitches, never voice commands or << >>.",
      gotchas: [
        "Duration carries over between chords, so <c e g>4 <d f a>4 restates it.",
        "<c e g> is homorhythm. Independent rhythms need real voices.",
      ],
      probe: "<c e g>2 <d f a>4 <c e g>4",
    },
    {
      id: "two-voices-staff",
      name: "Two voices on one staff",
      syntax:
        '\\new Staff <<\n  \\new Voice = "one" { \\voiceOne \\relative c\' { c4 d e f | g2 r4 g | } }\n  \\new Voice = "two" { \\voiceTwo \\relative c { c4 g\' b, g\' | c,2 s4 c | } }\n>>',
      kind: "snippet",
      scope: "score",
      desc: "Two independent rhythms engraved on a single staff, stems up and stems down.",
      insert:
        '\\new Staff <<\n  \\new Voice = "one" { \\voiceOne \\relative c\' { c4 d e f | g2 r4 g | } }\n  \\new Voice = "two" { \\voiceTwo \\relative c { c4 g\' b, g\' | c,2 s4 c | } }\n>>',
      note:
        "Without \\voiceOne / \\voiceTwo the stems collide and rests print " +
        "twice. The fix is the voice command, never manual offsets.",
      probeFull:
        '\\version "2.26.0"\n' +
        "\\score {\n" +
        "  \\new Staff <<\n" +
        "    \\new Voice = \"one\" { \\voiceOne \\relative c' { \\key c \\major \\time 4/4 c4 d e f | g2 r4 g | } }\n" +
        "    \\new Voice = \"two\" { \\voiceTwo \\relative c { \\key c \\major \\time 4/4 c4 g' b, g' | c,2 s4 c | } }\n" +
        "  >>\n" +
        "  \\layout { }\n" +
        "  \\midi { }\n" +
        "}\n",
    },
    {
      id: "voice-one",
      name: "\\voiceOne",
      syntax: "\\voiceOne",
      kind: "command",
      scope: "music",
      desc: "Stems up for this voice. Mandatory whenever a staff holds more than one voice.",
      insert: "\\voiceOne",
      probe: "\\new Voice = \"one\" { \\voiceOne c4 d e f | g2 r4 g | }",
    },
    {
      id: "voice-two",
      name: "\\voiceTwo",
      syntax: "\\voiceTwo",
      kind: "command",
      scope: "music",
      desc: "Stems down for this voice. The second voice on a staff always takes it.",
      insert: "\\voiceTwo",
      probe: "\\new Voice = \"two\" { \\voiceTwo c,4 d e f | g,2 r4 d | }",
    },
    {
      id: "voice-three-four",
      name: "\\voiceThree / \\voiceFour",
      syntax: "\\voiceThree   \\voiceFour",
      insert: "\\voiceThree ",
      kind: "command",
      scope: "music",
      desc: "Directions for a third and fourth voice on one staff.",
      note:
        "The palette only supports two voice directions on a single staff. " +
        "Three or four voices on one staff is legal but needs manual editing.",
      unprobed: "two simultaneous voices cannot be verified in one staff-level probe",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff <<\n    \\new Voice = "a" { \\voiceThree \\time 4/4 c4 d e f | g2 r2 | }\n    \\new Voice = "b" { \\voiceFour \\time 4/4 c,4 d e f | g,2 r2 | }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "one-voice",
      name: "\\oneVoice",
      syntax: "\\oneVoice",
      kind: "command",
      scope: "music",
      desc: "Cancel the voice direction and go back to a single unstemmed voice.",
      insert: "\\oneVoice",
      probe: "c4 d e f | \\oneVoice g2 r2 |",
    },
    {
      id: "spacer",
      name: "s (spacer rest)",
      syntax: "s4",
      kind: "notation",
      scope: "music",
      desc: "Invisible rest that holds time. Use in the lower voice where a printed rest would clutter.",
      insert: "s4",
      note: "Holds the beat without printing anything.",
      probe: "\\new Voice = \"a\" { \\voiceOne c4 d e f | g2 r4 g | } \\new Voice = \"b\" { \\voiceTwo c4 s4 s4 s4 | }",
    },
    {
      id: "parallel-music",
      name: "\\parallelMusic",
      syntax: "\\parallelMusic voiceA,voiceB { ... }",
      kind: "snippet",
      scope: "music",
      desc: "Author two parts bar by bar: each bar's line 1 is voiceA, line 2 is voiceB.",
      insert: "\\parallelMusic voiceA,voiceB {\n  %% Bar 1\n  c'4 d' e' f'   |\n  c4 d e f       |\n}",
      note:
        "Bar checks are mandatory here, and every part of one bar system " +
        "must have the same total length or you get a bar-check warning.",
      gotchas: [
        "The number of voice names must match the number of lines per bar.",
      ],
      probeFull:
        '\\version "2.26.0"\n' +
        "voiceA = \\relative c' { c'4 d' e' f' | g2 a2 | }\n" +
        "voiceB = \\relative c { c4 d e f | e2 f2 | }\n" +
        "\\score {\n" +
        "  \\new Staff <<\n" +
        "    \\new Voice = \"A\" { \\voiceOne \\voiceA }\n" +
        "    \\new Voice = \"B\" { \\voiceTwo \\voiceB }\n" +
        "  >>\n" +
        "  \\layout { }\n" +
        "  \\midi { }\n" +
        "}\n",
    },
    {
      id: "backslash-separator",
      name: "\\\\ (voice separator)",
      syntax: "\\new Staff << \\voiceA \\\\ \\voiceB >>",
      insert: "\\\\ ",
      kind: "notation",
      scope: "music",
      desc: "Separates two voices inside one << >> on a staff.",
      note:
        "\\\\ is staff-local. \\new Voice blocks need no \\\\ between them, and " +
        "it is not a general sequence separator.",
      probeFull:
        '\\version "2.26.0"\n' +
        "\\score {\n" +
        "  \\new Staff <<\n" +
        "    \\relative c' { \\voiceOne c4 d e f | g2 r4 g | }\n" +
        "    \\relative c { \\voiceTwo c4 g' b, g' | c,2 s4 c | }\n" +
        "  >>\n" +
        "  \\layout { }\n" +
        "}\n",
    },
    {
      id: "chord-vs-voices",
      name: "Chord or voices?",
      syntax: "<c e g>  vs  << { c4 e } { g,2 } >>",
      kind: "note",
      scope: "music",
      desc:
        "Same pitches, different meaning. Chords are homorhythmic (one " +
        "rhythm for the whole group); voices carry independent rhythms.",
      note:
        "Pick one per passage. A common correction is turning a <c e g> " +
        "that should have independent rhythm into << { c4 } { e2 } >>.",
    },
  ],
};