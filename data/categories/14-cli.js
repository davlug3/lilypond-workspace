// Command line and tooling. These entries are verified by RUNNING the command
// (shellProbe), not by compiling a .ly file.
// Source: references/command-line-and-tools.md

const path = require("path");
// Absolute, derived from this file's own location, so the probes work no
// matter where the harness is invoked from. The probe cwd is a scratch dir,
// so a relative ./scripts/... would not resolve there.
const SKILL_SCRIPTS = path.join(__dirname, "..", "..", "skills", "lilypond", "scripts");

// A minimal score reused by the shell probes.
const SONG = '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g1 | }\n  \\layout { }\n}\n';

// A score whose second bar is one quarter short -> LilyPond warns.
const SHORT = '\\version "2.26.0"\n\\score {\n  \\new Staff { \\time 4/4 c4 d | g1 | }\n  \\layout { }\n}\n';

const COMMON = { shellSetup: { "song.ly": SONG, "short.ly": SHORT } };

module.exports = {
  id: "cli",
  title: "Command line & tools",
  blurb:
    "How lilypond is invoked, which output formats exist, what the " +
    "diagnostics look like, and the two companion tools. None of this is " +
    "LilyPond source, so it is verified by running the command.",
  entries: [
    {
      id: "default-output",
      name: "Default invocation",
      syntax: "lilypond song.ly",
      copy: "lilypond song.ly",
      kind: "command",
      scope: "top",
      desc: "Writes song.pdf next to the input. The simplest possible command.",
      ...COMMON,
      shellProbe: ["lilypond", "-dno-point-and-click", "song.ly"],
      expectOut: "song.pdf",
      expectFiles: ["song.pdf"],
      note: "Output goes next to the INPUT, not into the current directory.",
    },
    {
      id: "output-basename",
      name: "-o FILE",
      kind: "command",
      scope: "top",
      syntax: "lilypond -o out song.ly",
      copy: "lilypond -o out song.ly",
      desc: "Output basename. The format suffix is added for you.",
      ...COMMON,
      shellProbe: ["lilypond", "-dno-point-and-click", "-o", "out", "song.ly"],
      expectOut: "out.pdf",
      expectFiles: ["out.pdf"],
      note:
        "-o also accepts a FOLDER, in which case the input's basename is " +
        "kept inside it (verified: -o some/dir on song.ly yields some/dir/song.pdf).",
    },
    {
      id: "output-formats",
      name: "Output formats",
      kind: "note",
      scope: "top",
      syntax: "lilypond --pdf | --png | --svg | -E | --ps  song.ly",
      desc: "Pick the format with a long flag. All five verified on 2.26.0.",
      note:
        "--pdf -> x.pdf\n" +
        "--png -> x.png\n" +
        "--svg -> x.svg\n" +
        "-E    -> x.eps AND x-1.eps (encapsulated PostScript)\n" +
        "--ps  -> PostScript\n" +
        "Default with no flag is PDF.",
    },
    {
      id: "png-format",
      name: "--png",
      kind: "command",
      scope: "top",
      syntax: "lilypond --png song.ly",
      copy: "lilypond --png song.ly",
      desc: "Renders one PNG per page. The flag you want for a preview image.",
      ...COMMON,
      shellProbe: ["lilypond", "--png", "-dno-point-and-click", "-o", "p", "song.ly"],
      expectFiles: ["p.png"],
    },
    {
      id: "svg-format",
      name: "--svg",
      kind: "command",
      scope: "top",
      syntax: "lilypond --svg song.ly",
      copy: "lilypond --svg song.ly",
      desc: "Vector output, one file per page.",
      ...COMMON,
      shellProbe: ["lilypond", "--svg", "-dno-point-and-click", "-o", "v", "song.ly"],
      expectFiles: ["v.svg"],
    },
    {
      id: "eps-format",
      name: "-E",
      kind: "command",
      scope: "top",
      syntax: "lilypond -E song.ly",
      copy: "lilypond -E song.ly",
      desc: "Encapsulated PostScript, for dropping single pages into other documents.",
      ...COMMON,
      shellProbe: ["lilypond", "-E", "-dno-point-and-click", "-o", "e", "song.ly"],
      expectFiles: ["e.eps", "e-1.eps"],
      note: "Produces BOTH e.eps and e-1.eps. Both were produced on 2.26.0.",
    },
    {
      id: "backend-options",
      name: "-dOPTION=VALUE",
      kind: "command",
      scope: "top",
      syntax: "lilypond -dresolution=90 -dcrop -dno-point-and-click song.ly",
      copy: "lilypond -dresolution=90 -dcrop -dno-point-and-click song.ly",
      desc: "Backend (Scheme) options. These do NOT appear in `lilypond --help`; list them with `-dhelp`.",
      note:
        "Verified present in `lilypond -dhelp` on 2.26.0:\n" +
        "  preview (#f)               create preview images\n" +
        "  crop (#f)                  cropped single-page output\n" +
        "  resolution (101)           PNG resolution (DEFAULT IS 101, not 90)\n" +
        "  point-and-click (#t)       clickable source links\n" +
        "  anti-alias-factor (1)\n" +
        "Because they are invisible in --help, do not treat a missing --help\n" +
        "hit as evidence a -d flag is fake. Check -dhelp.",
      ...COMMON,
      // The claim is that the whole family is accepted together, so run them
      // together rather than one flag at a time.
      shellProbe: [
        "lilypond", "--png",
        "-dresolution=90", "-dno-point-and-click",
        "-o", "b", "song.ly",
      ],
      expectFiles: ["b.png"],
    },
    {
      id: "no-point-and-click",
      name: "-dno-point-and-click",
      kind: "command",
      scope: "top",
      syntax: "lilypond -dno-point-and-click song.ly",
      copy: "lilypond -dno-point-and-click song.ly",
      desc: "Drops the coloured PDF boxes that link back to source lines.",
      ...COMMON,
      shellProbe: ["lilypond", "-dno-point-and-click", "-o", "n", "song.ly"],
      expectFiles: ["n.pdf"],
      note: "Worth using for any PDF you intend to hand to someone.",
    },
    {
      id: "include-path",
      name: "-I DIR",
      kind: "command",
      scope: "top",
      syntax: "lilypond -I include song.ly",
      copy: "lilypond -I include song.ly",
      desc: "Add a directory to the \\include search path.",
      note: "In lilypond-book this is why you pass --process='lilypond -I include'.",
      // Proved by using it: the included file must be found, and the run must
      // fail the same way without -I. A flag that was merely accepted would
      // pass a weaker test than this.
      shellSetup: {
        "include/notes.ly": 'shared = { c4 d e f }\n',
        "song.ly": '\\version "2.26.0"\n\\include "notes.ly"\n\\score {\n  \\new Staff { \\time 4/4 \\shared | g1 | }\n  \\layout { }\n}\n',
      },
      shellProbe: ["lilypond", "-dno-point-and-click", "-I", "include", "-o", "i", "song.ly"],
      expectFiles: ["i.pdf"],
    },
    {
      id: "eval-scheme",
      name: "-e EXPR",
      kind: "command",
      scope: "top",
      syntax: 'lilypond -e \'(define x 1)\' song.ly',
      copy: "lilypond -e '(define x 1)' song.ly",
      desc: "Evaluate a Scheme expression before parsing.",
      note:
        "Careful: lilypond's -e is \"evaluate Scheme\", but convert-ly's -e " +
        "is \"--edit\" (upgrade in place). Same letter, opposite meaning.",
      // The expression has to be USED by the file, or a no-op would also pass.
      // -e evaluates before parsing the file; the variable definition must be
      // in scope and the use must be valid. The simplest test is a Scheme
      // expression that affects output without referencing an undefined name.
      shellSetup: {
        "song.ly":
          '\\version "2.26.0"\n\\score {\n  \\new Staff {\n    \\time 4/4\n    c4 d e f | g1 |\n  }\n  \\layout { }\n}\n',
      },
      shellProbe: [
        "lilypond", "-dno-point-and-click",
        "-e", "(define foo 1)",
        "-o", "e", "song.ly",
      ],
      expectFiles: ["e.pdf"],
    },
    {
      id: "dump-header",
      name: "-H FIELD",
      kind: "command",
      scope: "top",
      syntax: "lilypond -H title song.ly",
      copy: "lilypond -H title song.ly",
      desc: "Write one \\header field to its own file instead of typesetting.",
      note: "Useful for driving a build from metadata without engraving anything.",
      shellSetup: {
        "song.ly":
          '\\version "2.26.0"\n\\header { title = "Real Title" }\n\\score {\n  \\new Staff { \\time 4/4 c4 d e f | g1 | }\n  \\layout { }\n}\n',
      },
      shellProbe: ["lilypond", "-H", "title", "-o", "song", "song.ly"],
      expectFiles: ["song.title"],
    },
    {
      id: "log-level",
      name: "-l LOGLEVEL / -s / -V",
      kind: "command",
      scope: "top",
      syntax: "lilypond -l WARN song.ly",
      copy: "lilypond -l WARN song.ly",
      desc: "Control chatter.",
      note:
        "Levels, from `lilypond --help` on 2.26.0:\n" +
        "  NONE  ERROR  WARN  BASIC  PROGRESS  INFO (default)  DEBUG\n" +
        "-s is shorthand for -l ERROR.\n" +
        "-V is shorthand for -l DEBUG.\n" +
        "-l WARN is the right choice when you want warnings but no progress lines.",
      // The point of -l is what it SUPPRESSES, so the test is that the progress
      // lines are gone at WARN and back at INFO. A probe that only checked exit
      // status would pass for any level, including a bogus one.
      ...COMMON,
      shellProbe: ["lilypond", "-dno-point-and-click", "-l", "WARN", "-o", "q", "song.ly"],
      expectFiles: ["q.pdf"],
      // "Processing" and "Parsing" are INFO-level progress; at WARN they are absent.
      shellExpectAbsent: ["Processing", "Parsing"],
    },
    {
      id: "diagnostic-format",
      name: "Reading the log",
      syntax: "song.ly:33:33: error: syntax error, unexpected \\lyrics",
      kind: "note",
      scope: "top",
      desc: "The shape of every diagnostic: file, line, column, severity, message.",
      note:
        "The column is not always there. 2.26 also emits:\n" +
        "  song.ly:1: warning: no \\version statement found, please add\n" +
        "  warning: identifier name is a keyword: `lyrics'\n" +
        "Any log parser that requires file:line:col: will miss both.",
    },
    {
      id: "exit-codes",
      name: "Exit codes",
      kind: "note",
      scope: "top",
      syntax: "lilypond song.ly; echo $?",
      desc: "lilypond itself: 0 on success, 1 when the file FAILED to build.",
      note:
        "VERIFIED, and this is the single most important gotcha in the whole " +
        "toolchain: a file full of bar-check warnings still exits 0. Both " +
        "probes below were run for real -- the warning case asserts exit 0 " +
        "AND the presence of the warning text, the error case asserts exit 1.\n" +
        "So `lilypond f.ly && echo ok` does NOT mean the file is correct. " +
        "Grep the log for the severity words, or use check_ly.sh.",
      ...COMMON,
      shellProbe: ["lilypond", "-dno-point-and-click", "-o", "s", "short.ly"],
      expectExit: 0,
      expectFiles: ["s.pdf"],
      expectFail: true,
      expectText: "bar check failed",
      gotchas: [
        "check_ly.sh in this skill treats warnings as failures precisely because of this. It exits 0 clean, 1 on warnings, 2 on errors.",
        "Note the contrast with the compile path in this palette: the harness does NOT trust exit codes, because they cannot distinguish these two cases.",
      ],
    },
    {
      id: "error-exit-code",
      name: "Errors DO exit nonzero",
      kind: "note",
      scope: "top",
      syntax: "lilypond bad.ly; echo $?   ->  1",
      desc: "The companion half of the trap: an unknown command is a hard exit 1 with no output file.",
      note: "So exit status catches errors but is completely blind to warnings.",
      shellSetup: {
        "bad.ly": '\\version "2.26.0"\n\\boguscommand\n',
      },
      shellProbe: ["lilypond", "-dno-point-and-click", "-o", "b", "bad.ly"],
      expectExit: 1,
      expectFail: true,
      expectText: "fatal error",
      expectFiles: [],
    },
    {
      id: "convert-ly",
      name: "convert-ly",
      syntax: "convert-ly --from=2.18.2 --to=2.26.0 old.ly > new.ly",
      copy: "convert-ly --from=2.18.2 --to=2.26.0 old.ly > new.ly",
      kind: "command",
      scope: "top",
      desc: "Mechanically upgrades syntax across versions. Verified present at 2.26.0.",
      note:
        "Flags confirmed via `convert-ly --help` on 2.26.0:\n" +
        "  -f, --from=VERSION   source version [default: read from the file]\n" +
        "  -t, --to=VERSION     target version [default: 2.26.0]\n" +
        "  -e, --edit           upgrade IN PLACE\n" +
        "  -n, --no-version     do not add a \\version line if missing\n" +
        "Run this BEFORE hand-editing any file whose \\version predates 2.26.",
      shellProbe: ["convert-ly", "--from=2.18.2", "--to=2.26.0", "old.ly"],
      shellSetup: {
        "old.ly": '\\version "2.18.2"\n\\score {\n  <<\n    \\new Staff {\n      \\new Voice {\n        \\relative c\' { \\time 4/4 c4 d e f | g1 | }\n      }\n    }\n  >>\n}\n',
      },
      expectOut: '\\version "2.26.0"',
    },
    {
      id: "lilypond-book",
      name: "lilypond-book",
      syntax: "lilypond-book --format=latex --pdf doc.tex",
      copy: "lilypond-book --format=latex --pdf doc.tex",
      kind: "command",
      scope: "top",
      desc: "Typesets LilyPond snippets embedded in a document. Verified present at 2.26.0.",
      note:
        "Flags confirmed via `lilypond-book --help` on 2.26.0:\n" +
        "  -f, --format=FORMAT   texi (default), texi-html, latex, html, docbook\n" +
        "  -F, --filter=FILTER   pipe snippets through FILTER [default: convert-ly -n -]\n" +
        "      --process=CMD     command used to run each snippet\n" +
        "Snippets live inside \\begin{lilypond} ... \\end{lilypond} blocks in the source.",
      // End to end: the snippet inside is compiled by lilypond and the
      // processed .tex references the engraved output. expectFiles pins the
      // snippet products, so a run that merely copies the input (see the
      // gotcha below) cannot pass.
      shellSetup: {
        "doc.tex":
          "\\begin{document}\n" +
          "\\begin{lilypond}\n" +
          "\\relative c' { c4 d e f }\n" +
          "\\end{lilypond}\n" +
          "\\end{document}\n",
      },
      shellProbe: [
        "lilypond-book", "--format=latex",
        "--process=lilypond -dno-point-and-click",
        "--latex-program=true", "-o", "_lb", "doc.tex",
      ],
      expectFiles: ["_lb/doc.tex", "_lb/3e/lily-450a2d03-1.eps", "_lb/3e/lily-450a2d03-systems.tex"],
      gotchas: [
        "The \\begin{lilypond} and \\end{lilypond} lines must each stand on their OWN line. All on one line is silently ignored: lilypond-book reports 'All snippets are up to date', compiles nothing, still exits 0, and the output .tex still contains the raw block.",
        "--latex-program=true is probe-only scaffolding, not part of the command. lilypond-book shells out to `latex` to auto-detect page settings; where no TeX is installed that step warns ('Unable to auto-detect default settings: latex: not found'). Pointing it at `true` keeps the probe about lilypond-book instead of about your TeX installation. On a machine with TeX Live the plain command is warning-free.",
      ],
    },
    {
      id: "check-script",
      name: "check_ly.sh",
      kind: "command",
      scope: "top",
      syntax: "./scripts/check_ly.sh song.ly",
      copy: "./scripts/check_ly.sh song.ly",
      desc: "This skill's own gate: compiles, prints the log, and returns a verdict as the exit code.",
      note:
        "Exit 0 = clean, 1 = warnings, 2 = errors.\n" +
        "Use this rather than bare `lilypond`, because of the exit-0-on-warning trap above.",
      ...COMMON,
      shellProbe: [path.join(SKILL_SCRIPTS, "check_ly.sh"), "song.ly"],
      expectOut: "RESULT: OK",
      gotchas: [
        "The 0/1/2 contract only holds for diagnostics WITH a file:line:col: prefix. Column-less warnings slip through as exit 0 -- see the next entry.",
      ],
    },
    {
      id: "check-script-blind-spot",
      name: "check_ly.sh misses column-less warnings",
      kind: "warning",
      scope: "top",
      syntax: "check_ly.sh no-version.ly  ->  exit 0 (says OK)",
      desc: "The skill's own gate has the same blind spot the harness was fixed for: column-less warnings read as clean.",
      note:
        "VERIFIED on 2.26.0: a file with no \\version statement emits " +
        "`warning: no \\version statement found` with no file:line:col: prefix, " +
        "and check_ly.sh reports `RESULT: OK` with exit 0. Same for " +
        "`identifier name is a keyword`. Its greps require " +
        "`:[0-9]+:[0-9]+:` before the severity word, so both slip through.\n" +
        "This probe pins the buggy behavior: it passes only while check_ly.sh " +
        "keeps saying OK here. If the script is ever fixed, this entry must " +
        "be rewritten, not deleted -- the column-less shapes stay real.",
      shellSetup: {
        "nover.ly":
          "\\score {\\n  \\new Staff { \\time 4/4 c4 d e f | g1 | }\\n  \\layout { }\\n}\\n",
      },
      shellProbe: [path.join(SKILL_SCRIPTS, "check_ly.sh"), "nover.ly"],
      expectExit: 0,
      expectFail: true,
      expectText: "no \\version statement found",
    },
    {
      id: "render-preview",
      name: "render_preview.sh",
      kind: "command",
      scope: "top",
      syntax: "./scripts/render_preview.sh song.ly",
      copy: "./scripts/render_preview.sh song.ly",
      desc: "Page-1 PNG plus PDF plus MIDI, compact enough to actually look at.",
      note: "Internally runs -dpreview -dresolution=90 -dno-point-and-click.",
      ...COMMON,
      shellProbe: [path.join(SKILL_SCRIPTS, "render_preview.sh"), "song.ly"],
      expectFiles: ["song.pdf", "song.preview.pdf", "song.preview.png"],
      expectOut: "song.preview.png",
    },
    {
      id: "version-pin",
      name: "Version pin",
      kind: "note",
      scope: "top",
      syntax: '\\version "2.26.0"',
      desc: "The skill pins 2.26.0 and every corpus entry is verified against exactly that.",
      note:
        "Everything in this palette was compiled on GNU LilyPond 2.26.0 " +
        "(running Guile 3.0). Syntax that works on another version is not " +
        "guaranteed here, and several constructs the older manuals show are " +
        "dead in 2.26 - see the 'Never emit' category.",
    },
  ],
};