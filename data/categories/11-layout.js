// Page setup, spacing, line breaking, indents, sizing.
// Source: references/layout-paper-spacing.md, examples/16-layout.

module.exports = {
  id: "layout",
  title: "Layout & spacing",
  blurb:
    "Three layers, and which one you need depends on the question. " +
    "\\paper is the sheet, \\layout is the engraving, \\set is for a span.",
  entries: [
    {
      id: "which-block",
      name: "Paper vs layout vs set",
      syntax: "\\paper { }  \\layout { }  \\set Staff.X = v",
      kind: "note",
      scope: "note",
      desc: "The single most useful routing rule in LilyPond.",
      note:
        "\\paper  = the physical sheet: size, margins, fonts, headers.\n" +
        "\\layout = how music is engraved: staff size, spacing, line breaking.\n" +
        "\\set    = a change that applies from here until it is undone.\n" +
        "\\override = a change to one grob's appearance, with an optional span.",
      gotchas: [
        "\\paper NEVER goes inside \\score. \\layout goes inside \\score (or at top level to affect every score).",
      ],
    },
    {
      id: "set-paper-size",
      name: "#(set-paper-size ...)",
      syntax: '#(set-paper-size "a4")',
      kind: "command",
      scope: "paper",
      desc: "Sheet size by name or by dimensions.",
      insert: '#(set-paper-size "a4")\n',
      note: "Names: a3 a4 a5 a6 b4 b5 letter legal tabloid ledger. Or use explicit dimensions like \"9 x 7 in\".",
      probeFull:
        '\\version "2.26.0"\n\\paper {\n  #(set-paper-size "a4")\n}\n\\score { \\new Staff { \\time 4/4 c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "set-paper-size-dims",
      name: "Paper size by dimension",
      syntax: "paper-width = 9\\in   paper-height = 7\\in",
      kind: "snippet",
      scope: "paper",
      desc: "Explicit sheet size as two properties.",
      insert: "paper-width = 9\\in\npaper-height = 7\\in\n",
      note:
        "Set the two \\paper properties directly. Neither of the " +
        "set-paper-size spellings for custom sizes works in 2.26: " +
        '#(set-paper-size "9 x 7 in") and #(set-paper-size "9in x 7in") ' +
        "both give warning: Unknown paper size, and " +
        "#(set-paper-size 9 \\in 7 \\in) errors in Guile.",
      probeFull:
        '\\version "2.26.0"\n\\paper {\n  paper-width = 9\\in\n  paper-height = 7\\in\n}\n\\score { \\new Staff { \\time 4/4 c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "margins",
      name: "Margins",
      syntax: "top-margin = 10\\mm   left-margin = 15\\mm",
      kind: "property",
      scope: "paper",
      desc: "Distance from the paper edge. Units: \\mm \\cm \\in \\pt.",
      insert: "left-margin = 15\\mm\ntop-margin = 10\\mm\n",
      note:
        "The system-indent is measured from the left MARGIN, so a large " +
        "indent plus a large margin can push music off the page.",
      probeFull:
        '\\version "2.26.0"\n\\paper {\n  top-margin = 10\\mm\n  left-margin = 15\\mm\n}\n\\score { \\new Staff { \\time 4/4 c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "staff-size",
      name: "#(layout-set-staff-size ...)",
      syntax: "#(layout-set-staff-size 18)",
      kind: "command",
      scope: "layout",
      desc: "Enlarge or shrink everything. The number is the interline distance in points.",
      insert: "#(layout-set-staff-size 18)\n",
      note: "16 is the default. This scales all other spacing proportionally, so fix it FIRST.",
      gotchas: [
        "Set staff size before anything else; every other spacing value you then choose will be relative to it.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { #(layout-set-staff-size 18) }\n}\n',
    },
    {
      id: "system-indent",
      name: "indent (first-system indent)",
      syntax: "indent = 2\\cm",
      kind: "property",
      scope: "layout",
      desc: "Left margin of the FIRST system only. Later systems start at zero.",
      insert: "indent = 2\\cm\n",
      note: "Measured from the left paper margin. In a multi-staff score each StaffGroup in the first system indents.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new StaffGroup <<\n    \\new Staff { \\relative c\'\' { \\time 4/4 c4 d e f | g2 r2 | } }\n    \\new Staff { \\clef bass c2 e | g e | }\n  >>\n  \\layout { indent = 2\\cm }\n}\n',
    },
    {
      id: "short-indent",
      name: "short-indent (consequent systems)",
      syntax: "short-indent = 1\\cm",
      insert: "short-indent = 1\\cm\n",
      kind: "property",
      scope: "layout",
      desc: "Left margin of every system after the first.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { short-indent = 1\\cm }\n}\n',
    },
    {
      id: "ragged-last",
      name: "ragged-last (justify all but the last line)",
      syntax: "ragged-last = ##t",
      kind: "property",
      scope: "layout",
      desc: "Do not stretch the final system of a section to full width.",
      insert: "ragged-last = ##t\n",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { ragged-last = ##t }\n}\n',
    },
    {
      id: "ragged-right",
      name: "ragged-right",
      syntax: "ragged-right = ##t",
      insert: "ragged-right = ##t\n",
      kind: "property",
      scope: "layout",
      desc: "Never justify. Systems end wherever the music ends.",
      note: "Can make a single-staff score look badly ragged; prefer ragged-last.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { ragged-right = ##t }\n}\n',
    },
    {
      id: "line-width",
      name: "#(make-paper ..) or system-width",
      kind: "note",
      scope: "layout",
      desc: "You rarely set line width directly; control it with indent and the \\paper width.",
      note:
        "Line breaking is automatic from the paper width minus margins " +
        "minus indent. Forcing it with explicit \\break is a last resort.",
    },
    {
      id: "spacing-sections",
      name: "\\newSpacingSection",
      syntax: "\\newSpacingSection",
      kind: "command",
      scope: "score",
      desc: "Start a visually separate block of music inside one score, between staves.",
      insert: "\\newSpacingSection\n",
      note:
        "Placed inside the << >> that holds the staves. \\newSpacingSection " +
        "is the only *Section command in 2.26's own ly/ and scm/ files.",
      gotchas: [
        "\\newSectionSystem does NOT exist in 2.26: error: unknown command: `\\newSectionSystem' (and a cascade of 'string outside of text script'). \\section and \\textSection also fail outside markup.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  <<\n    \\new Staff { \\relative c\'\' { \\time 4/4 c4 d e f | g2 r2 | } }\n    \\newSpacingSection\n    \\new Staff { \\relative c\'\' { c4 e g c\'\' | c2 r2 | } }\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "text-marker",
      name: "\\textMark",
      syntax: '\\textMark \\markup { "A" }',
      insert: "\\textMark \\markup { \"A\" } ",
      kind: "command",
      scope: "music",
      desc: "A rehearsal letter printed at a system boundary rather than over the music.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  <<\n    \\new Staff {\n      \\relative c\' {\n        \\time 4/4\n        c4 d e f | \\textMark \\markup { "A" }\n        g2 r2 |\n      }\n    }\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "page-properties",
      name: "Common \\paper properties",
      syntax: "print-page-number = ##t   oddHeaderMarkup = ...",
      insert: "print-page-number = ##t\n",
      kind: "property",
      scope: "paper",
      desc: "Page numbers and running headers use markup properties.",
      note: "print-first-page-number, print-all-pages, oddHeaderMarkup, evenHeaderMarkup, oddFooterMarkup.",
      probeFull:
        '\\version "2.26.0"\n\\paper {\n  print-page-number = ##t\n  print-first-page-number = ##t\n}\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { }\n}\n',
    },
    {
      id: "spacing-lists",
      name: "Spacing vector properties",
      syntax: "StaffGrouper.stretchability = #2",
      insert: "\\context {\n  \\Score\n  \\override SpacingSpanner.uniform-stretching = ##t\n}\n",
      kind: "property",
      scope: "layout",
      desc: "Each spacing property takes a numeric vector: the first value applies when tight, the second when loose.",
      note:
        "The number before a spacing property means 'stretch this many " +
        "times more when loose than when tight'. Do not set these first; " +
        "fix staff size and indents, then adjust one spacing value at a " +
        "time and look at the PNG.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout { \\context { \\Score \\override SpacingSpanner.uniform-stretching = ##t } }\n}\n',
    },
  ],
};