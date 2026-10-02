// The do-not-emit table: syntax that older manuals, older skills, or 2.x-era
// forum snippets tell you to write, and what actually works on 2.26.0.
//
// IMPORTANT: this category is NOT a copy of the skill's
// references/version-differences.md table. Every row below was compiled on
// 2.26.0, and several rows of that table turned out to be WRONG -- the table
// is derived from 2.26's own python/convertrules.py, but it lists individual
// rename RULES without applying them IN ORDER, so renames that were later
// reverted are shown in their reverted state. The corrections are flagged
// inline and collected in the 'wrong-in-the-table' entry at the bottom.

module.exports = {
  id: "never",
  title: "Never emit",
  blurb:
    "Not for inserting. These are constructs to avoid, each paired with " +
    "the form that actually compiles on 2.26.0. Nothing in this category " +
    "is insertable.",
  entries: [
    {
      id: "how-to-read",
      name: "How to read this",
      kind: "note",
      scope: "note",
      desc: "Each entry lists the BAD form and the GOOD form side by side, with the exact 2.26 diagnostic for the bad one.",
      note:
        "Every 'bad' entry here was compiled to get that diagnostic, so the " +
        "message is real rather than remembered. A warning rather than an " +
        "error means LilyPond still produced output and you will not " +
        "notice from the PDF alone.",
      gotchas: [
        "Some of these do NOT fail at all -- they are accepted silently and quietly do nothing (see the removed-engravers entry).",
      ],
    },
    {
      id: "keysignature",
      name: "keySignature -> keyAlterations",
      syntax: "\\set Score.keyAlterations = #`((6 . ,FLAT))",
      kind: "note",
      scope: "music",
      desc: "The current key signature.",
      note:
        "BAD: \\override Score.keySignature -> error: bad grob property path.\n" +
        "GOOD: \\set Score.keyAlterations = #`((6 . ,FLAT)) -> compiles clean.",
      gotchas: [
        "It is a CONTEXT property, so it needs \\set, not \\override. The rename alone is not enough -- copy-pasting the new name into an \\override still fails.",
        "The value is an alist keyed by step number: #`((6 . ,FLAT)) is one flat, ((2 . ,SHARP)) is one sharp.",
      ],
      expectFail: true,
      expectText: "bad grob property path",
      probe: "\\override Score.keySignature = #`((6 . ,FLAT)) c4 d e f | g2 r2 |",
    },
    {
      id: "whiteout",
      name: "whiteout: BOTH names are dead",
      syntax: "there is no working form",
      kind: "warning",
      scope: "note",
      desc: "The skill's table says write \\whiteout-box instead of \\whiteout. Neither exists in 2.26.0.",
      note:
        "VERIFIED both on 2.26.0:\n" +
        "  c4\\whiteout      -> error: unknown command: `\\whiteout'\n" +
        "  c4\\whiteout-box  -> error: unknown command: `\\whiteout-box'\n" +
        "CORRECTION to version-differences.md.",
      gotchas: [
        "Why the table is wrong: convertrules.py rule (2,19,22) renames whiteout -> whiteout-box, and rule (2,19,32) renames it BACK. Applied in version order they cancel, which is why convert-ly --from=2.19.21 --to=2.26.0 leaves `\\whiteout' in place -- producing a file that still does not compile.",
        "Also: grepping 2.26's ly/*.ly for `whiteout' matches only stencil-whiteout-if-style-set, a Scheme helper. There is no music-level command.",
        "If you need a whiteout effect, do it in Scheme on a stencil, not with a note post-event.",
      ],
      expectFail: true,
      expectText: "unknown command: `\\whiteout'",
      probe: "c4\\whiteout d4\\whiteout e4\\whiteout f4\\whiteout | g2 r2 |",
    },
    {
      id: "chordnamevoice",
      name: "ChordNameVoice -> ChordNames",
      syntax: "\\new ChordNames << \\new Voice { ... } >>",
      kind: "note",
      scope: "score",
      desc: "The context that carries chord names above the staff.",
      note:
        "BAD: \\new ChordNameVoice -> warning: cannot create context: ChordNameVoice.\n" +
        "GOOD: \\new ChordNames -> compiles clean.",
      gotchas: [
        "Note it is a WARNING, not an error, so the run completes and you get chord names missing rather than a build failure.",
      ],
      expectFail: true,
      expectText: "cannot create context: ChordNameVoice",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new ChordNameVoice << \\new Voice { \\relative c\' { \\time 4/4 c4 d e f } } >>\n  \\layout { }\n}\n',
    },
    {
      id: "autochange",
      name: "autochange -> autoChange",
      syntax: "c4\\autoChange { d e f }",
      kind: "note",
      scope: "music",
      desc: "Auto-octave-change notation for guitar/harp.",
      note: "BAD: error: unknown command: `\\autochange'. GOOD: compiles clean.",
      expectFail: true,
      expectText: "unknown command: `\\autochange'",
      probe: "c4\\autochange { d e f } | g2 r2 |",
    },
    {
      id: "partcombine",
      name: "partcombine -> partCombine",
      syntax: "\\partCombine { c4 d }",
      kind: "note",
      scope: "music",
      desc: "Merges two parts onto one staff by pitch.",
      note: "BAD: error: unknown command: `\\partcombine'. GOOD: compiles clean.",
      expectFail: true,
      expectText: "unknown command: `\\partcombine'",
      probe: "\\partcombine { c4 d e f } | g2 r2 |",
    },
    {
      id: "fermata-markup",
      name: "fermataMarkup -> fermata",
      syntax: "c4\\fermata",
      kind: "note",
      scope: "music",
      desc: "The fermata sign.",
      note: "BAD: error: unknown command: `\\fermataMarkup'. GOOD: compiles clean.",
      expectFail: true,
      expectText: "unknown command: `\\fermataMarkup'",
      probe: "c4\\fermataMarkup d4 e4 f4 | g2 r2 |",
    },
    {
      id: "compress-bars",
      name: "compressFullBarRests -> compressEmptyMeasures",
      syntax: "\\compressEmptyMeasures",
      kind: "note",
      scope: "music",
      desc: "Collapses consecutive empty measures into one.",
      note: "BAD: error: unknown command: `\\compressFullBarRests'. GOOD: compiles clean.",
      expectFail: true,
      expectText: "unknown command: `\\compressFullBarRests'",
      probe: "\\compressFullBarRests c4 d e f | g2 r2 |",
    },
    {
      id: "rest-duration",
      name: '\\rest "4." -> \\rest {4.}',
      syntax: "\\rest {4.}",
      kind: "note",
      scope: "music",
      desc: "A multi-character rest duration needs braces.",
      note:
        "BAD: c4\\rest \"4.\" -> error: string outside of text script or \\lyricmode.\n" +
        "GOOD: c4\\rest {4.} -> compiles clean (and is a dotted HALF = 6 sixteenths, not 3).",
      gotchas: [
        "Braces, not quotes, and note the value: \\rest {4.} fills half a 4/4 bar, so it does not pair with a surrounding c4 in the same bar.",
      ],
      expectFail: true,
      expectText: "string outside of text script",
      probe: 'c4\\rest "4." d4 e4 | g2 r2 |',
    },
    {
      id: "defaultbartype",
      name: "defaultBarType -> measureBarType",
      syntax: '\\set Score.measureBarType = ""',
      kind: "note",
      scope: "music",
      desc: "Suppresses the barline at a measure boundary.",
      note:
        "BAD: \\set Score.defaultBarType = \"\" -> warning: the property 'defaultBarType' does not exist.\n" +
        "GOOD: \\set Score.measureBarType = \"\" -> compiles clean.",
      expectFail: true,
      expectText: "the property 'defaultBarType' does not exist",
      probe: '\\set Score.defaultBarType = "" c4 d e f | g2 r2 |',
    },
    {
      id: "markformatter",
      name: "markFormatter -> rehearsalMarkFormatter",
      syntax: "\\set Score.rehearsalMarkFormatter = #ly:text-interface::print",
      kind: "note",
      scope: "music",
      desc: "How \\textMark rehearsal letters are rendered.",
      note:
        "BAD: \\set Score.markFormatter = ... -> warning: the property 'markFormatter' does not exist.\n" +
        "GOOD: \\set Score.rehearsalMarkFormatter = ... -> compiles clean.",
      expectFail: true,
      expectText: "the property 'markFormatter' does not exist",
      probe:
        "\\set Score.markFormatter = #ly:text-interface::print \\textMark \\markup { \"A\" } c4 d e f | g2 r2 |",
    },
    {
      id: "glyph-name-alist",
      name: "glyph-name-alist -> alteration-glyph-name-alist",
      syntax: "\\override Accidental.alteration-glyph-name-alist = #'((32 . \"...\"))",
      kind: "note",
      scope: "music",
      desc: "Maps alterations to glyph names.",
      note:
        "BAD: \\override Accidental.glyph-name-alist -> warning: the property 'glyph-name-alist' does not exist.\n" +
        "GOOD: \\override Accidental.alteration-glyph-name-alist -> compiles clean.",
      expectFail: true,
      expectText: "the property 'glyph-name-alist' does not exist",
      probe:
        "\\override Accidental.glyph-name-alist = #'((32 . \"accidentals.doublesharp.slashslash.stem\")) c4 d e f | g2 r2 |",
    },
    {
      id: "featherdurations",
      name: "\\featherDurations takes a fraction now",
      syntax: "\\featherDurations 1/2",
      kind: "note",
      scope: "music",
      desc: "Lengthens notes slightly to force better spacing.",
      note:
        "The old \\featherDurations #(ly:make-moment 1/2) STILL COMPILES CLEAN on 2.26.0 -- this is a stylistic deprecation, not a removal. Prefer the plain fraction.",
      gotchas: [
        "Verified: both the Scheme and the fraction form compile clean, so nothing warns you to change it.",
      ],
    },
    {
      id: "bar-dash",
      name: '\\bar "-" is NOT deprecated',
      syntax: '\\bar ""',
      kind: "note",
      scope: "music",
      desc: "The table says \\bar \"-\" became \\bar \"\". Both compile clean on 2.26.0.",
      note:
        "VERIFIED: \\bar \"-\" -> clean, \\bar \"\" -> clean. Nothing warns. Use \\bar \"\" as the table advises because it is clearer, but this row is not a correctness issue.",
      gotchas: [
        "This is one of three rows where the table overstates the change. See the summary entry at the bottom.",
      ],
    },
    {
      id: "roman-markup",
      name: "\\roman -> \\serif (markup)",
      syntax: "\\markup \\serif { Allegro }",
      kind: "note",
      scope: "markup",
      desc: "The roman/serif font selector in markup.",
      note:
        "BAD: \\markup \\roman { ... } -> error: unknown command: `\\roman'.\n" +
        "GOOD: \\markup \\serif { ... } -> compiles clean.\n" +
        "The markup must be reached through a markup context: a text script (c4-\\markup \\serif { Allegro }) or \\header.",
      expectFail: true,
      expectText: "unknown command: `\\roman'",
      probe: "c4-\\markup \\roman { Allegro } d4 e4 f4 | g2 r2 |",
    },
    {
      id: "font-family-roman",
      name: "font-family = #'roman is accepted SILENTLY",
      syntax: "\\override LyricText.font-family = #'serif",
      kind: "warning",
      scope: "music",
      desc: "Unlike the markup \\roman, this deprecated value still compiles with no warning at all.",
      note:
        "VERIFIED: font-family = #'roman and font-family = #'serif BOTH compile clean on 2.26.0.\n" +
        "2.26's own property doc (define-grob-properties.scm:361) lists only serif, sans and typewriter.",
      gotchas: [
        "font-family is declared (font-family ,symbol? ...) with no value validation, so ANY symbol is accepted -- including a dead one. It will not warn and will not error; it just selects a font family that does not exist and the text falls back.",
        "That makes it MORE dangerous than the forms that error, because nothing tells you. Use #'serif.",
      ],
    },
    {
      id: "single-digit",
      name: "single-digit -> TimeSignature.style",
      syntax: "\\override TimeSignature.style = #'single-number",
      kind: "note",
      scope: "music",
      desc: "The meter was renamed, but it is a grob STYLE value, not a boolean.",
      note:
        "BAD: \\set Score.single-digit = ##t -> warning: the property 'single-digit' does not exist.\n" +
        "GOOD: \\override TimeSignature.style = #'single-number -> compiles clean.\n" +
        "CORRECTION: the table's \\set Score.single-number = ##t is ALSO wrong -- single-number is not a property either. In 2.26 it is one of the time-signature STYLE symbols (time-signature-settings.scm:972), alongside 'numbered and mensural.",
      expectFail: true,
      expectText: "the property 'single-digit' does not exist",
      probe: "\\set Score.single-digit = ##t c4 d e f | g2 r2 |",
    },
    {
      id: "compoundmeter",
      name: "compoundMeter -> timeAbbrev",
      syntax: "\\timeAbbrev #'((3 4))",
      kind: "note",
      scope: "music",
      desc: "Abbreviated (additive) meters.",
      note:
        "BAD: \\time 4/4 \\compoundMeter -> error: unknown command: `\\compoundMeter'.\n" +
        "GOOD: \\timeAbbrev #'((4 4)) -> compiles clean.\n" +
        "timeAbbrev is a music function taking a PAIR or a list of triples: #'((3 1 8) (2 4)) means (3+1)/8 + 2/4, and 3,2,8 abbreviates (3+2)/8.",
      expectFail: true,
      expectText: "unknown command: `\\compoundMeter'",
      probe: "\\time 4/4 \\compoundMeter c4 d e f | g2 r2 |",
    },
    {
      id: "percent-shorthand",
      name: "percent shorthand -> \\repeat percent",
      syntax: "c4\\repeat percent 3 { d e }",
      kind: "note",
      scope: "music",
      desc: "The c4\\% { ... } shorthand was removed in 2.25.35.",
      note:
        "BAD: c4\\% { d e } f -> error: wrong type for argument 1. Expecting number, found (make-music ...). \\% is now a valid but DIFFERENT command, so it fails at type-check rather than with 'unknown command' -- which is a confusing message for a rename.\n" +
        "GOOD: c4\\repeat percent 3 { d e } -> compiles clean. Note the required COUNT argument.",
      expectFail: true,
      expectText: "wrong type for argument",
      probe: "c4\\% { d e } f | g2 r2 |",
    },
    {
      id: "star-shorthand",
      name: "star shorthand -> \\repeat unfold",
      syntax: "c4\\repeat unfold 2 { d e }",
      kind: "note",
      scope: "music",
      desc: "The c4\\* { ... } shorthand was removed in 2.25.35.",
      note:
        "BAD: c4\\* { d e } f -> error: wrong type for argument 1. Expecting number.\n" +
        "GOOD: c4\\repeat unfold 2 { d e } -> compiles clean. Note the required COUNT argument.",
      expectFail: true,
      expectText: "wrong type for argument",
      probe: "c4\\* { d e } f | g2 r2 |",
    },
    {
      id: "german-chords",
      name: "\\norwegianChords is GONE; \\semiGermanChords is correct",
      syntax: "\\semiGermanChords",
      kind: "note",
      scope: "chordmode",
      desc: "The table lists both directions of this swap, which is confusing; 2.26.0 keeps only one.",
      note:
        "VERIFIED on 2.26.0:\n" +
        "  \\semiGermanChords  -> compiles clean\n" +
        "  \\norwegianChords   -> error: unknown command: `\\norwegianChords'\n" +
        "The swap was applied (2,25,35 semiGerman->norwegian) then UNDONE (2,25,80 norwegian->semiGerman), so the end state is \\semiGermanChords.",
      gotchas: [
        "Run convert-ly --from=2.25.79 --to=2.26.0 on a file using \\norwegianChords and it correctly emits \\semiGermanChords, which compiles. Trust convert-ly here over the table.",
      ],
      expectFail: true,
      expectText: "unknown command: `\\norwegianChords'",
      probe: "\\norwegianChords c4 d e f | g2 r2 |",
    },
    {
      id: "enablepolymeter",
      name: "enablePolymeter -> enablePerStaffTiming",
      syntax: "\\layout { \\enablePerStaffTiming }",
      kind: "note",
      scope: "layout",
      desc: "Polymeter with unaligned measures.",
      note:
        "BAD: \\override Score.enablePolymeter = ##t -> error: bad grob property path.\n" +
        "GOOD: \\layout { \\enablePerStaffTiming } -> compiles clean.\n" +
        "CORRECTION: the table's \\override Score.enablePerStaffTiming = ##t is wrong. enablePerStaffTiming is a void FUNCTION (context-mods-init.ly:90), not a property, so you \\set nothing -- you call it. In music it fails with error: Not in an output definition.",
      gotchas: [
        "It goes inside \\layout, not in the music and not as an \\override.",
      ],
      expectFail: true,
      expectText: "bad grob property path",
      probe: "\\override Score.enablePolymeter = ##t c4 d e f | g2 r2 |",
    },
    {
      id: "ellipsis-direction",
      name: "ellipsis-direction -> passage-direction",
      syntax: "\\override OptionalMaterialBracket.passage-direction = #LEFT",
      kind: "note",
      scope: "music",
      desc: "Which side of a bracket a passage delimiter sits on.",
      note:
        "BAD: \\override Score.ellipsis-direction -> error: bad grob property path.\n" +
        "GOOD: \\override OptionalMaterialBracket.passage-direction -> compiles clean.\n" +
        "CORRECTION: the table's \\override Score.passage-direction is also wrong. passage-direction is a property of the passage-delimiter GROBS (define-grob-properties.scm:1637), not of the Score context -- \\set Score.passage-direction warns that the property does not exist.",
      expectFail: true,
      expectText: "bad grob property path",
      probe: "\\override Score.ellipsis-direction = #LEFT c4 d e f | g2 r2 |",
    },
    {
      id: "bottom-space",
      name: "bottom-space -> bottom-padding",
      syntax: "\\override PaperColumn.line-break-system-details.bottom-padding = #2",
      kind: "note",
      scope: "layout",
      desc: "Distance from the page bottom to the lowest staff.",
      note:
        "BAD: \\override Score.BarNumber.bottom-space = #2 -> warning: the property 'bottom-space' does not exist.\n" +
        "GOOD: \\override PaperColumn.line-break-system-details.bottom-padding = #2 -> compiles clean.\n" +
        "CORRECTION: bottom-padding is a SUBPROPERTY of PaperColumn's line-break-system-details (define-grob-properties.scm:703), not a BarNumber property. Both the table's owner and its spelling are wrong.",
      expectFail: true,
      expectText: "the property 'bottom-space' does not exist",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 \\override Score.BarNumber.bottom-space = #2 c4 d e f | g2 r2 | } }\n  \\layout { }\n}\n',
    },
    {
      id: "instrument-name",
      name: "instrument -> instrumentName",
      syntax: '\\set Staff.instrumentName = "Vln."',
      kind: "note",
      scope: "music",
      desc: "The full instrument name printed before the staff.",
      note:
        "BAD: \\set Staff.instrument = \"Vln.\" -> compiles but sets nothing useful; in 2.26 'instrument' is not a Score/Staff property and is silently ignored.\n" +
        "GOOD: \\set Staff.instrumentName -> compiles and prints.\n" +
        "The short form is \\set Staff.shortInstrumentName.",
      gotchas: [
        "Unlike most rows in this category this one fails SILENTLY -- no warning at all, the name just does not appear.",
      ],
    },
    {
      id: "removed-engravers",
      name: "Removed engravers are ignored, NOT rejected",
      syntax: "\\remove Note_swallow_translator",
      kind: "warning",
      scope: "context",
      desc: "The skill says \\remove lines naming these error out. On 2.26.0 they compile clean.",
      note:
        "VERIFIED -- all four compile clean with no diagnostic:\n" +
        "  \\remove Note_swallow_translator\n" +
        "  \\remove Rest_swallow_translator\n" +
        "  \\remove Default_bar_line_engraver\n" +
        "  \\remove Mark_tracking_translator\n" +
        "CORRECTION to version-differences.md section 4, which says such lines 'error out'.",
      gotchas: [
        "This is the dangerous case in the whole category: a stale \\remove is not an error, so a converted old file looks fine and quietly behaves differently. Delete these lines rather than relying on the compiler to tell you.",
        "Consequence for \\consists too: a stale \\consists of a removed engraver is likewise ignored.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff \\with { \\remove Note_swallow_translator } { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } }\n  \\layout { }\n}\n',
    },
    {
      id: "wrong-in-the-table",
      name: "Summary: rows the skill's table gets wrong",
      kind: "note",
      scope: "note",
      desc: "If you only remember one entry from this category, make it this one.",
      note:
        "Seven of version-differences.md's rows do not survive contact with 2.26.0.\n" +
        "1. whiteout -> whiteout-box: BOTH are dead. The rename was reverted by convertrules rule (2,19,32).\n" +
        "2. single-digit -> \\set Score.single-number = ##t: both wrong. It is \\override TimeSignature.style = #'single-number.\n" +
        "3. compoundMeter -> timeAbbrev: right name, but the table gives no argument; timeAbbrev takes #'((4 4)) or 4,4.\n" +
        "4. enablePolymeter -> \\override Score.enablePerStaffTiming = ##t: wrong. It is \\layout { \\enablePerStaffTiming }, a void function.\n" +
        "5. ellipsis-direction -> \\override Score.passage-direction: wrong owner. It is OptionalMaterialBracket.passage-direction.\n" +
        "6. bottom-space -> \\override ... .bottom-padding: wrong owner. It is PaperColumn.line-break-system-details.bottom-padding.\n" +
        "7. Section 4 (removed engravers 'error out'): they are ignored silently.\n" +
        "Plus two rows that overstate the change: \\bar \"-\" and \\featherDurations #(ly:make-moment x/y) both still compile clean.\n" +
        "Root cause: the table lists rename RULES individually. Several were later reverted, so applying the rules IN VERSION ORDER gives a different answer than reading them as a flat table.",
      gotchas: [
        "When the table and the compiler disagree, the compiler wins. Use convert-ly --from=<old> --to=2.26.0 as the oracle, then compile the result -- that is exactly what this category was built by.",
        "This is also the strongest argument for the never-invert rule: five of these seven errors are invisible at the source level and would have shipped as silently wrong files.",
      ],
    },
  ],
};