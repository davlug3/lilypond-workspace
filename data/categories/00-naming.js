// Naming rules and syntax traps that bite when writing LilyPond by hand.
// Every rule here was confirmed by compiling against 2.26.0; several are
// NOT documented in the skill's references, which is why they are listed.

module.exports = {
  id: "naming",
  title: "Naming & syntax traps",
  blurb:
    "Rules that decide whether a file parses at all. All of these were " +
    "confirmed by compiling against 2.26.0.",
  entries: [
    {
      id: "no-digits-in-names",
      name: "No digits in variable names",
      syntax: "partOne  (valid)   p1, mel1, p_1  (parse error)",
      kind: "note",
      scope: "top",
      desc: "A LilyPond identifier cannot contain a digit anywhere, not even as a suffix.",
      note:
        "Observed on 2.26.0: `p1 = \\relative c' { c4 }` gives " +
        "error: syntax error, unexpected UNSIGNED, expecting '.' or '='. " +
        "The same applies to context names - \\new Voice = \"mel1\" is fine " +
        "(it is a string) but \\mel1 is not a valid command.",
      gotchas: [
        "Rename p1 to partOne, bass1 to bassLine, gtr2 to guitarTwo.",
        "This also means \\new Staff = \"1\" works, because that is a quoted string, not an identifier.",
      ],
    },
    {
      id: "lyrics-reserved",
      name: "`lyrics` is reserved",
      syntax: "wordsOne  (use this)   lyrics  (reserved)",
      kind: "note",
      scope: "top",
      desc: "Never name a variable `lyrics`.",
      note:
        "Observed on 2.26.0: warning: identifier name is a keyword: `lyrics'. " +
        "The skill lists this as a hard error (syntax error, unexpected \\lyrics); " +
        "in practice 2.26 emits a warning. Treat it as a failure either way.",
      gotchas: ["wordsOne, verseOne, sopranoWords are all safe."],
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { la la }\n\\score { \\new Staff { c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "whitespace",
      name: "Whitespace between tokens",
      syntax: "c4 d4  (good)   c4d4  (bad)",
      kind: "note",
      scope: "music",
      desc: "LilyPond needs whitespace between most tokens.",
      note: "}<< and similar collisions produce confusing syntax errors.",
    },
    {
      id: "define-before-use",
      name: "Define before use",
      syntax: "melody = ...   then later   \\melody",
      kind: "note",
      scope: "top",
      desc: "Order the file top down: \\version, \\header, variables, \\score. Referring to a variable defined later is an error.",
      note: "This is why \\include goes above the \\score that uses the variables.",
    },
    {
      id: "version-diagnostics",
      name: "Two warning shapes without a line:column",
      syntax: 'song.ly:1: warning: ...   /   warning: identifier name is a keyword: ...',
      kind: "note",
      scope: "top",
      desc:
        "LilyPond does not always emit file:line:column for a warning. A log " +
        "filter that only matches that pattern will silently miss these.",
      note:
        "Both are real failures:\n" +
        "  no \\version statement found, please add\n" +
        "  identifier name is a keyword: `lyrics'\n" +
        "Match on the severity word instead. Verified against all 23 " +
        "known-good skill files: zero false positives.",
    },
    {
      id: "set-vs-override",
      name: "\\set or \\override?",
      syntax: "\\set Staff.instrumentName = ...   /   \\override NoteHead.color = ...",
      kind: "note",
      scope: "music",
      desc: "Timing, naming, counting and MIDI go through \\set. Color, size, padding and shape go through \\override.",
      note:
        "\\set aimed at a grob gives: warning: cannot find or create context: " +
        "NoteHead plus warning: the property 'color' does not exist (observed " +
        "on 2.26.0). \\override with a misspelled grob gives: error: bad grob " +
        "property path.",
      gotchas: [
        "A wrong-but-plausible property name is ignored with NO message at all. Look it up; do not guess twice.",
      ],
    },
  ],
};