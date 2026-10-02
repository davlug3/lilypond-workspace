// Articulations, dynamics, hairpins, slurs and ornaments, text scripts and
// markup, and fonts.
// Source: references/articulation-dynamics-markup.md, examples/11, 12.

module.exports = {
  id: "expressive",
  title: "Expression & markup",
  blurb:
    "Three separate mechanisms that are easy to confuse: articulations " +
    "attach to one note, dynamics control loudness, slurs and ornaments " +
    "span notes.",
  entries: [
    {
      id: "articulation-shorthand",
      name: "Articulation shorthands",
      syntax: "c4-.  c4-^  c4-_  c4-!  c4--  c4-+",
      kind: "notation",
      scope: "music",
      desc: "Attached after the note. - auto, ^ force up, _ force down.",
      insert: "c4-.",
      note: "Flip colliding scripts with ^ or _ rather than recompiling and hoping.",
      probe: "c4-. c4-^ c4-_ d4 | c4-! c4-- c4-+ c4 |",
    },
    {
      id: "articulation-commands",
      name: "\\staccato and friends",
      syntax: "c4\\staccato  c4\\tenuto  c4\\accent",
      kind: "command",
      scope: "music",
      desc: "Spelled-out articulations: \\staccato \\tenuto \\marcato \\accent \\espressivo \\portato \\fermata.",
      insert: "c4\\staccato ",
      probe: "c4\\staccato c4\\tenuto c4\\marcato c4\\accent | c4\\espressivo c4\\portato c2\\fermata |",
    },
    {
      id: "string-articulations",
      name: "\\upbow / \\downbow / \\harmonic",
      syntax: "c4\\upbow  c4\\downbow  c4\\harmonic",
      kind: "command",
      scope: "music",
      desc: "String-family marks, plus \\open \\stopped for wind and brass.",
      insert: "c4\\upbow ",
      probe: "c4\\upbow d\\downbow e\\harmonic f\\open | g4\\stopped a4 b4 c4 |",
    },
    {
      id: "dynamics",
      name: "Dynamics",
      syntax: "c4\\p  d\\mp  e\\mf  f\\f",
      kind: "command",
      scope: "music",
      desc: "piano to forte. Full set: \\ppp \\pp \\p \\mp \\mf \\f \\ff \\fff \\sf \\sfz \\fp \\rfz",
      insert: "c4\\mf ",
      probe: "c4\\p d\\mp e\\mf f\\f | g4\\pp a4\\fff b4\\sfz c4\\rfz |",
    },
    {
      id: "hairpins",
      name: "Hairpins \\< \\> \\!",
      syntax: "g4\\< a b c\\!",
      kind: "notation",
      scope: "music",
      desc: "\\< crescendo, \\> diminuendo, \\! terminate.",
      insert: "g4\\< ",
      note:
        "EVERY hairpin must be terminated with \\! or a closing dynamic. An " +
        "unterminated hairpin spans to the end of the movement, sometimes " +
        "with a warning and sometimes silently.",
      probe: "g4\\< a b c\\! | d\\mf e\\> f g\\! |",
    },
    {
      id: "slur-family",
      name: "Slurs",
      syntax: "c( d e f)      g\\( a b c\\)",
      kind: "notation",
      scope: "music",
      desc: "Playing slur ( ) and phrasing slur \\( \\). \\slurUp \\slurDown \\slurNeutral control placement.",
      insert: "c( ",
      probe: "c4( d e f) | g4\\( a b c\\) |",
    },
    {
      id: "breathe",
      name: "\\breathe",
      syntax: "c2 r2 \\breathe",
      kind: "command",
      scope: "music",
      desc: "Breath mark. Goes after the bar's music, not attached to a note.",
      insert: " \\breathe ",
      probe: "c4 d e f | g2 r2 \\breathe |",
    },
    {
      id: "ornaments",
      name: "Ornaments",
      syntax: "c4\\prall d\\mordent e\\trill f\\turn",
      insert: "c4\\prall d4\\mordent e4\\trill f4\\turn ",
      kind: "command",
      scope: "music",
      desc: "\\prall \\mordent \\trill \\turn, after the note.",
      note:
        "Grace ornaments (\\grace \\acciaccatura \\appoggiatura) go BEFORE " +
        "the note; \\trill and \\mordent go AFTER.",
      probe: "c4\\prall d\\mordent e\\trill f\\turn | g1 |",
    },
    {
      id: "glissando-arpeggio",
      name: "\\glissando and \\arpeggio",
      syntax: "c4\\glissando d     <e g c>1\\arpeggio",
      kind: "command",
      scope: "music",
      desc: "Glissando draws a line between two pitches - both notes must exist. Arpeggio spreads a chord.",
      insert: "c4\\glissando d ",
      probe: "c4\\glissando d e f | g1 | <e g c>1\\arpeggio |",
    },
    {
      id: "trill-span",
      name: "\\startTrillSpan / \\stopTrillSpan",
      syntax: "\\pitchedTrill c4\\startTrillSpan d \\stopTrillSpan c4",
      kind: "command",
      scope: "music",
      desc: "Trill line across a passage.",
      insert: "\\pitchedTrill c4\\startTrillSpan d \\stopTrillSpan c4",
      probe: "\\pitchedTrill c4\\startTrillSpan d \\stopTrillSpan c4 c4 c4 |",
    },
    {
      id: "script-directions",
      name: "Script direction ^ _ -",
      syntax: "c4^\\markup { ... }   c4_\\markup { ... }",
      kind: "notation",
      scope: "music",
      desc: "^ above, _ below, - automatic.",
      note: "A bare \\markup at top level makes a standalone text block instead of attaching.",
      insert: "c4^\\markup { \"text\" }",
      probe: "c4^\\markup { \\bold \"forte\" } c4 d e | f4^\\markup \\center-column { \"two lines\" \\small \"of text\" } g4 a b |",
    },
    {
      id: "markup-commands",
      name: "Markup commands",
      syntax: "\\bold \\italic \\small \\column \\pad-around #2",
      kind: "command",
      scope: "markup",
      desc:
        "Fonts: \\bold \\italic \\underline \\small \\large \\huge \\fontsize #2 \\sans \\serif \\typewriter. " +
        "Layout: \\column \\center-column \\left-column \\right-column \\line \\fill-line \\box \\circle.",
      note:
        "Music glyphs: \\musicglyph #\"scripts.segno\", \\note #\"4\" #1, " +
        "\\rest #\"4\", \\clef, \\key, \\time, \\beam, \\slur, \\tuplet, \\dynamic.",
      insert: "\\markup { \\bold \"text\" }\n",
      probe: "c4^\\markup { \\bold \\italic \"forte\" } c4 d e | f4^\\markup { \\pad-around #2 \\box \\small \"x\" } g4 a b |",
    },
    {
      id: "musicglyph",
      name: "\\musicglyph",
      syntax: '\\musicglyph #"scripts.segno"',
      kind: "command",
      scope: "markup",
      desc: "A glyph by name. Used for segno, coda, and other symbols.",
      insert: '\\musicglyph #"scripts.segno"',
      probe: "c4 d e f | g2 r2 | \\mark \\markup { \\musicglyph #\"scripts.segno\" } a2 r2 |",
    },
    {
      id: "markup-structure",
      name: "\\mark structure",
      syntax: "\\mark \\markup { ... }",
      kind: "command",
      scope: "music",
      desc: "\\mark numbers rehearsal marks automatically.",
      insert: "\\mark \\markup { \"A\" }\n",
      probe: "c4 d e f | g2 r2 | \\mark \\markup { \"A\" } a2 r2 |",
    },
    {
      id: "fonts-property",
      name: "Fonts as a property",
      syntax: '\\override Score.SectionLabel.fonts.roman = "DejaVu Serif"',
      insert: "\\override Score.SectionLabel.fonts.roman = \"DejaVu Serif\"\n",
      kind: "property",
      scope: "layout",
      desc: "fonts is an ordinary property, so it can be overridden per grob in \\layout.",
      note:
        "make-pango-font-tree was REMOVED in 2.26 (Unbound variable on " +
        "compile; confirmed in 2.26.0's own convertrules.py). The skill's " +
        "articulation-dynamics-markup.md §7 still shows it - do not emit it. " +
        "Use set-global-staff-size or layout-set-staff-size for sizing.",
      gotchas: [
        "The font must exist in the search path or you get: fatal error: cannot find font '...'",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g2 r2 | }\n  \\layout {\n    \\override Score.SectionLabel.fonts.roman = "DejaVu Serif"\n  }\n}\n',
    },
    {
      id: "make-pango-font-tree-removed",
      name: "NEVER emit make-pango-font-tree",
      syntax: 'fonts = #(make-pango-font-tree "Serif" "Sans" "Mono" 1)   -- removed in 2.26',
      kind: "warning",
      scope: "paper",
      desc: "Obsolete font-selection syntax. Fails with: fatal error: Guile signaled an error ... Unbound variable: make-pango-font-tree",
      note:
        "Confirmed on 2.26.0 by compiling it, and confirmed against " +
        "2.26.0's own convertrules.py, which states the function has been " +
        "removed and that sizing must now be done with set-global-staff-size.",
    },
    {
      id: "mechanism-trio",
      name: "Articulation vs dynamics vs ornament",
      syntax: "c4-. c4\\mf c4\\trill",
      kind: "note",
      scope: "music",
      desc: "Three different mechanisms. Articulation = how a note starts/ends. Dynamics = how loud. Ornament = a figure spanning notes.",
      note: "Do not mix them up when choosing which one you need.",
    },
  ],
};