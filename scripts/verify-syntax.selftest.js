// Self-test for scripts/verify-syntax.js.
//
// These cases test the REAL functions exported by the harness rather than a
// copy of them. An earlier version of this file duplicated classify(), which
// meant a fix to the harness could leave the self-test still testing the old
// behaviour and still reporting PASS.
//
// Three groups:
//   1. classify()  -- must the log be called clean?
//   2. verdictFor() -- for entries that exist to document a failure
//   3. runShellProbe() -- for command-line entries
//
// Run: node scripts/verify-syntax.selftest.js

"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { classify, verdictFor, runShellProbe } = require("./verify-syntax.js");

const ROOT = path.resolve(__dirname, "..");
const WORK = "/data/data/com.termux/files/usr/tmp/opencode/syntax-selftest";
const LILYPOND = process.env.LILYPOND || "lilypond";

const STAFF = (body) =>
  '\\version "2.26.0"\n\\score { \\new Staff { \\relative c\' { \\time 4/4 ' +
  body +
  " | g2 r2 | } } \\layout { } }\n";

fs.mkdirSync(WORK, { recursive: true });
let failed = 0;
let ran = 0;

function compileVerdict(src) {
  const base = path.join(WORK, "st-" + Math.abs(hash(src)).toString(36));
  fs.writeFileSync(base + ".ly", src, "utf8");
  const run = spawnSync(LILYPOND, ["-dno-point-and-click", "-o", base, base + ".ly"], {
    encoding: "utf8",
    timeout: 60000,
  });
  const res = classify((run.stdout || "") + (run.stderr || ""), run.status);
  for (const ext of [".ly", ".pdf", ".midi"]) { try { fs.unlinkSync(base + ext); } catch (_) {} }
  return res;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function report(label, got, want, detail) {
  ran++;
  const pass = got === want;
  if (!pass) failed++;
  process.stdout.write(
    `${pass ? "PASS" : "FAIL"}  ${label}\n        got=${got} want=${want}${detail ? " | " + detail : ""}\n`
  );
}

// ---------------------------------------------------------------- group 1
// classify() decides whether a compile counts as clean. Expected values were
// read off real 2.26.0 output, not assumed.
const COMPILE_CASES = [
  ["clean staff", "ok", STAFF("c4 d e f")],
  // The headline trap: a real warning, but LilyPond still exits 0. Anything
  // that trusted the exit code would call this clean.
  ["bar check failed (warning, exit 0)", "warning", STAFF("c4 d e f | g2")],
  ["over-full bar (warning)", "warning", '\\version "2.26.0"\n\\score { \\new Staff { \\relative c\' { \\time 4/4 c2 d2 e2 | } } \\layout { } }\n'],
  // The <c-\tweak> form the skill's docs show. Confirmed a hard error on 2.26.
  ["deprecated tweak form (error)", "error", STAFF("c4 <c-\\tweak color #red e>2")],
  // These two carry NO "file:line:col:" prefix in 2.26 output, which is
  // exactly why a stricter regex missed them.
  ["reserved word as variable (warning, no col)", "warning",
    '\\version "2.26.0"\nlyrics = \\lyricmode { la }\n\\score { \\new Staff { c4 } \\layout { } }\n'],
  ["missing version (warning, no col)", "warning",
    '\\score { \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } } \\layout { } }\n'],
  ["bad grob path (error)", "error", STAFF("\\override NoteHed.color = #red c4 d e f")],
  // 2.26 reports a \\set aimed at a grob as warnings, not an error. The skill's
  // error-catalog.md calls it a "style failure" that stops the run; observed
  // output disagrees -- warning, and the music still prints.
  ["set on grob-only property (warning, not error)", "warning",
    STAFF("\\set NoteHead.color = #red c4 d e f")],
  // A removed context name: warning, not error.
  ["removed context (warning, not error)", "warning",
    '\\version "2.26.0"\n\\score { \\new ChordNameVoice { c4 } \\layout { } }\n'],
  // A removed engraver in \\remove is accepted in SILENCE. This is the case
  // that makes "no diagnostic" not the same as "did what you asked".
  ["stale \\remove (silent no-op)", "ok",
    '\\version "2.26.0"\n\\score { \\new Staff \\with { \\remove Note_swallow_translator } { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } } \\layout { } }\n'],
];

process.stdout.write("-- classify(): does the log count as clean?\n");
for (const [name, want, src] of COMPILE_CASES) {
  const res = compileVerdict(src);
  const first = [...res.errors, ...res.warnings][0];
  report(name, res.verdict, want, first ? first.slice(0, 80) : "");
}

// ---------------------------------------------------------------- group 2
// verdictFor() -- entries that exist to document a failure must PASS when the
// log contains the documented diagnostic, and FAIL if the diagnostic changes
// (which is what would happen on a future LilyPond that renames it again).
process.stdout.write("\n-- verdictFor(): entries that document a failure\n");
{
  const good = {
    errors: ["song.ly:1:1: error: unknown command: `\\whiteout'"],
    warnings: [],
  };
  report("expectFail + matching text -> ok",
    verdictFor({ expectFail: true, expectText: "unknown command: `\\whiteout'" }, good), "ok");

  report("expectFail + different text -> wrong-diagnostic",
    verdictFor({ expectFail: true, expectText: "bad grob property path" }, good), "wrong-diagnostic");

  // If 2.26 ever starts ACCEPTING the thing we document as broken, the entry
  // is stale and must not silently keep passing.
  report("expectFail but now compiles -> still-passes",
    verdictFor({ expectFail: true, expectText: "unknown command: `\\whiteout'" },
      { verdict: "ok", errors: [], warnings: [] }), "still-passes");

  // A normal entry is unaffected by the flag.
  report("no expectFail -> pass through",
    verdictFor({}, { verdict: "warning", errors: [], warnings: ["x"] }), "warning");
}

// ---------------------------------------------------------------- group 3
// runShellProbe() -- command-line entries are verified by running them.
process.stdout.write("\n-- runShellProbe(): command-line entries\n");
{
  const SONG = '\\version "2.26.0"\n\\score { \\new Staff { \\time 4/4 c4 d e f | g1 | } \\layout { } }\n';
  const SHORT = '\\version "2.26.0"\n\\score { \\new Staff { \\time 4/4 c4 d | g1 | } \\layout { } }\n';
  const setup = { "song.ly": SONG, "short.ly": SHORT, "bad.ly": '\\version "2.26.0"\n\\boguscommand\n' };

  report("png output really produced",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "--png", "-dno-point-and-click", "-o", "p", "song.ly"],
      expectFiles: ["p.png"] }, "t1").verdict, "ok");

  report("missing output file is detected",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "--png", "-dno-point-and-click", "-o", "p", "song.ly"],
      expectFiles: ["p.svg"] }, "t2").verdict, "error");

  // THE exit-code trap, asserted: expectExit 0 AND a warning in the log.
  // verify: a bare exit-code check would report this clean.
  report("exit 0 with warning -> error (the trap)",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "-dno-point-and-click", "-o", "s", "short.ly"],
      expectExit: 0 }, "t3").verdict, "error");

  // A command that legitimately exits 1 still has "error" lines in its log, so
  // runShellProbe alone calls it error. The harness always follows up with
  // verdictFor(), and THAT is the combination that has to pass -- so this case
  // tests the pair, exactly as main() applies it.
  const BADCMD = ["lilypond", "-dno-point-and-click", "-o", "b", "bad.ly"];
  const errEntry = { shellSetup: setup, shellProbe: BADCMD, expectExit: 1, expectFail: true, expectText: "fatal error" };
  report("real error + expectExit 1 + expectFail -> ok",
    verdictFor(errEntry, runShellProbe(errEntry, "t4")), "ok");

  // Same command, but the entry does not declare the failure: it must not pass.
  const plainEntry = { shellSetup: setup, shellProbe: BADCMD, expectExit: 1 };
  report("real error, no expectFail -> error",
    verdictFor(plainEntry, runShellProbe(plainEntry, "t4b")), "error");

  report("wrong expectExit is caught",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "-dno-point-and-click", "-o", "b", "bad.ly"],
      expectExit: 0 }, "t5").verdict, "error");

  report("missing expectOut substring is caught",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "-dno-point-and-click", "-o", "p", "song.ly"],
      expectOut: "NOT-IN-THE-OUTPUT" }, "t6").verdict, "error");

  report("convert-ly produces a renamed line",
    runShellProbe({ shellSetup: setup, shellProbe: ["convert-ly", "--from=2.18.2", "--to=2.26.0", "song.ly"],
      expectOut: '\\version "2.26.0"' }, "t7").verdict, "ok");

  // shellExpectAbsent: the claim is about what is SUPPRESSED, so absence must
  // be asserted. -l WARN hides the INFO-level "Processing"/"Parsing" lines.
  report("suppressed text stays absent -> ok",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "-dno-point-and-click", "-l", "WARN", "-o", "q", "song.ly"],
      expectFiles: ["q.pdf"], shellExpectAbsent: ["Processing", "Parsing"] }, "t8").verdict, "ok");

  report("present text violates shellExpectAbsent -> error",
    runShellProbe({ shellSetup: setup, shellProbe: ["lilypond", "-dno-point-and-click", "-o", "q", "song.ly"],
      expectFiles: ["q.pdf"], shellExpectAbsent: ["Processing"] }, "t9").verdict, "error");
}

process.stdout.write(`\n${ran - failed}/${ran} passed\n`);
process.exit(failed ? 1 : 0);