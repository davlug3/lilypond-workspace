// Repeats and endings, unfolded repeats, segno/fine, percent and tremolo
// repeats, beaming control, bar types, cadenzas.
// Source: references/repeats-beaming-timing.md, examples/14, 15.

module.exports = {
  id: "timing",
  title: "Repeats, beams & bars",
  blurb:
    "Repeat structures, manual beam control, and the difference between " +
    "\\bar (draws a line) and | (checks the bar is full).",
  entries: [
    {
      id: "repeat-volta",
      name: "\\repeat volta",
      syntax: "\\repeat volta 2 { c4 d e f } \\alternative { { g2 a } { c,1 } }",
      kind: "snippet",
      scope: "music",
      desc: "Bracket a repeated body, with \\alternative holding one block per ending.",
      insert:
        "\\repeat volta 2 {\n  c4 d e f\n}\n\\alternative {\n  { g2 a }\n  { c,1 }\n}",
      gotchas: [
        "The number of \\alternative blocks must match the number of endings. An extra ending prints but never plays in MIDI.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff {\n    \\relative c\' {\n      \\time 4/4\n      \\repeat volta 2 { c4 d e f | }\n      \\alternative {\n        { g2 a | }\n        { c,1 | }\n      }\n      \\bar "|."\n    }\n  }\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "repeat-unfold",
      name: "\\repeat unfold",
      syntax: "\\repeat unfold 4 { c4 d e f | }",
      insert: "\\repeat unfold 4 {\n  c4 d e f |\n}\n",
      kind: "command",
      scope: "music",
      desc: "Write every iteration out instead of bracketing.",
      note:
        "Use for MIDI practice tracks and for lyrics that differ per verse - " +
        "each copy gets its own \\lyricsto line.",
      probe: "\\repeat unfold 2 { c4 d e f | }",
    },
    {
      id: "repeat-percent",
      name: "\\repeat percent",
      syntax: "\\repeat percent 4 { c8 d e f | }",
      insert: "\\repeat percent 4 {\n  c8 d e f |\n}\n",
      kind: "command",
      scope: "music",
      desc: "Compress identical bars into percent signs.",
      gotchas: ["The repeated music must fill whole bars - a partial bar is an error."],
      probe: "\\repeat percent 4 { c4 d e f | }",
    },
    {
      id: "repeat-tremolo",
      name: "\\repeat tremolo",
      syntax: "\\repeat tremolo 8 { c32 d }      c4:32",
      insert: "\\repeat tremolo 8 { c32 d } ",
      kind: "command",
      scope: "music",
      desc: "Measured tremolo, or the single-note shorthand c4:32.",
      note: "Subdivides one written note into rapid repeats.",
      probe: "\\repeat tremolo 8 { c16 d } | c4:32 c4:32 c4:32 c4:32 |",
    },
    {
      id: "alternative",
      name: "\\alternative",
      syntax: "\\alternative { { ending1 } { ending2 } }",
      insert: "\\alternative {\n  { c4 d e f | }\n  { g1 | }\n}\n",
      kind: "command",
      scope: "music",
      desc: "Holds one block per repeat ending, always paired with \\repeat volta.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff {\n    \\relative c\' {\n      \\time 4/4\n      \\repeat volta 2 { c4 d e f | }\n      \\alternative {\n        { g2 a | }\n        { c,1 | }\n      }\n      \\bar "|."\n    }\n  }\n  \\layout { }\n}\n',
    },
    {
      id: "bar-commands",
      name: "\\bar (draws a barline)",
      syntax: '\\bar ".|:"   \\bar ":|."   \\bar "||"   \\bar "|."',
      kind: "command",
      scope: "music",
      desc: "Draws an actual barline. Common types: \".|:\" repeat start, \":|.\" repeat end, \":|.:\" both, \"||\" double, \"|.\" final.",
      insert: '\\bar "|." ',
      note: "\\bar DRAWS; | CHECKS. Use both: ... g2 | \\bar \"|.\".",
      probe: "c4 d e f | \\bar \"|.\" g2 r2 |",
    },
    {
      id: "bar-check-vs-bar",
      name: "| vs \\bar",
      syntax: "... g2 | \\bar \"|.\"",
      kind: "note",
      scope: "music",
      desc: "| warns if the bar is not full and prints nothing. \\bar prints a line and checks nothing.",
      note:
        "warning: bar check failed at: 1/4 means the bar holds a quarter. " +
        "Never delete the | to silence it - recount the bar.",
      probe: "c4 d e f | g2 r2 | \\bar \"|.\" ",
    },
    {
      id: "beam-manual",
      name: "Manual beams [ ]",
      syntax: "c8[ c] d[ d] e[ e]",
      kind: "notation",
      scope: "music",
      desc: "Force a beam between two notes.",
      insert: "c8[ ",
      note: "Beaming is automatic by default; reach for [ ] only when the automatic result is wrong.",
      gotchas: ["Beams may not cross a barline. Beam within the bar."],
      probe: "c8[ c] d[ d] e[ e] f[ f] |",
    },
    {
      id: "auto-beam",
      name: "\\autoBeamOff / \\autoBeamOn",
      syntax: "c4 \\autoBeamOff c8. e16 \\autoBeamOn g4",
      insert: "c4 \\autoBeamOff c8. e16 \\autoBeamOn g4 ",
      kind: "command",
      scope: "music",
      desc: "Suspend the time-signature beaming rules for a passage.",
      note: "In 6/8 the automatic result is two groups of three eighths. Check the PNG.",
      probe: "c4 \\autoBeamOff c8. e16 s8 s8 s8 s8 | \\autoBeamOn a4 b4 c4 d4 |",
    },
    {
      id: "cadenza",
      name: "\\cadenzaOn / \\cadenzaOff",
      syntax: "\\cadenzaOn c4 d e f \\cadenzaOff \\bar \"|\"",
      insert: "\\cadenzaOn c4 d e f \\cadenzaOff ",
      kind: "command",
      scope: "music",
      desc: "Unmetered music: no barlines drawn or checked inside the span.",
      gotchas: [
        "Forgetting \\cadenzaOff makes every following bar check fail.",
      ],
      probe: "\\cadenzaOn c4 d e f \\cadenzaOff \\bar \"|\" c4 d e f |",
    },
    {
      id: "polymeter",
      name: "Polymeter / per-staff timing",
      syntax: "different \\time on each staff",
      kind: "note",
      scope: "score",
      desc: "Staves may carry separate time signatures. LilyPond aligns by absolute time, not by barlines.",
      note:
        "Bar checks in a polymeter staff refer to that staff's own meter, " +
        "so a 3/4 staff's bars must total 3 beats while a 4/4 staff's total 4. " +
        "Observed on 2.26.0: mismatched per-staff meters inside one << >> " +
        "produced bar check failures, while a 4/4 staff above a 2/4 staff " +
        "compiled clean. Keep a calculator handy and verify in the PNG.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  <<\n    \\new Staff { \\time 4/4 \\relative c\'\' { c4 d e f | g2 r2 | } }\n    \\new Staff { \\time 2/4 \\relative c { c4 d | e f | g a | b c | } }\n  >>\n  \\layout { }\n  \\midi { }\n}\n',
    },
    {
      id: "break-commands",
      name: "\\break / \\pageBreak / \\noBreak",
      syntax: "c4 d e f | \\break  g4 a b c' | \\pageBreak",
      insert: "c4 d e f | \\break g4 a b c' | \\pageBreak\n",
      kind: "command",
      scope: "music",
      desc: "Force a line break, a page break, or forbid one.",
      note: "Break control belongs in the music; spacing AMOUNTS belong in \\paper / \\layout.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff {\n    \\relative c\' {\n      \\time 4/4\n      c4 d e f | \\break\n      g4 a b c\' | \\pageBreak\n      c\'\'4 d\'\' e\'\' f\'\' | \\noBreak\n      g\'\'1\n    }\n  }\n  \\layout { }\n}\n',
    },
    {
      id: "fine",
      name: "\\fine",
      syntax: "\\fine",
      insert: "\\fine\n",
      kind: "command",
      scope: "music",
      desc: "\"Play through to here\", used with repeats.",
      note:
        "Behaviour changed in 2.23.12: \\fine no longer stops \\repeat " +
        "iteration, so endings after \\fine still unfold in MIDI.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff {\n    \\relative c\' {\n      \\time 4/4\n      \\repeat volta 2 {\n        c4 d e f |\n        \\fine\n      }\n      \\bar "|."\n    }\n  }\n  \\layout { }\n  \\midi { }\n}\n',
    },
  ],
};