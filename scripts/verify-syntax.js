#!/usr/bin/env node
// verify-syntax.js — compile-probe every entry in data/categories/*.js.
//
// The lilypond skill's never-invent rule applied to our own corpus: an entry
// may only be surfaced in the palette as verified if it actually compiles
// clean under the pinned LilyPond (2.26.0), warnings included.
//
//   node scripts/verify-syntax.js            # verify all
//   node scripts/verify-syntax.js <cat> ...  # verify only these categories
//   node scripts/verify-syntax.js --only-failures
//
// Exit codes: 0 = every probed entry clean, 1 = at least one failure.
// Writes data/verify-report.json for scripts/build-syntax.js to consume.
//
// An entry is verified when it carries one of:
//   probe      staff-level music body, wrapped automatically
//   probeFull  a complete .ly file (top-level constructs)
//   shellProbe argv array for command-line entries (+ expectExit/expectOut/expectFiles)
// Entries documenting a failure add expectFail + expectText, and pass when
// the log contains exactly that diagnostic. Everything else is "unprobed",
// which the palette labels as unverified rather than presenting as fact.

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CAT_DIR = path.join(ROOT, "data", "categories");
const REPORT = path.join(ROOT, "data", "verify-report.json");
const WORK = process.env.SYNTAX_PROBE_DIR || "/data/data/com.termux/files/usr/tmp/opencode/syntax-probe";

const LILYPOND = process.env.LILYPOND || "lilypond";

// Same wrapper the skill's check_ly.sh uses, so a "clean" verdict here means
// the same thing it means there.
const PREAMBLE = '\\version "2.26.0"\n';

// The wrapper injects NO \\key and NO \\time on purpose. LilyPond already
// defaults to 4/4 and C major with no warning (verified), so state injected
// here would collide with any probe that sets its own key or meter --
// e.g. "conflict with event: `key-change-event'". Probes that need a
// different key or time write it themselves.
const WRAP = (body) =>
  PREAMBLE +
  "\\score {\n" +
  "  \\new Staff \\with { instrumentName = \"Probe\" } {\n" +
  "    \\relative c' { " + body + " }\n" +
  "  }\n" +
  "  \\layout { }\n" +
  "  \\midi { }\n" +
  "}\n";

function loadCategories() {
  const files = fs
    .readdirSync(CAT_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort();
  return files.map((f) => {
    const mod = require(path.join(CAT_DIR, f));
    if (!mod || !mod.id || !Array.isArray(mod.entries)) {
      throw new Error(`${f}: must export { id, title, entries[] }`);
    }
    return { file: f, ...mod };
  });
}

// A file is only "clean" when it produced neither error/warning lines nor a
// nonzero exit.
//
// The severity word is matched WITHOUT requiring a "file:line:col:"
// prefix. LilyPond 2.26 emits at least two warning shapes that carry no
// column, and both are real failures the palette must not hide:
//
//   song.ly:1: warning: no \version statement found, please add
//   warning: identifier name is a keyword: `lyrics'
//
// Matching on the severity word alone was checked against all 23 known-good
// skill files (templates + examples): zero false positives.
const DIAG = /(?:^|[^A-Za-z])(warning|error|fatal)(?:[\s:])/;

function classify(out, status) {
  // LilyPond repeats some diagnostics across stdout and stderr, so dedupe
  // before reporting -- otherwise one warning looks like two.
  const lines = [...new Set(out.split("\n").filter((l) => DIAG.test(l)))];
  const errors = lines.filter((l) => /(^|[^A-Za-z])(error|fatal)(?:[\s:])/.test(l));
  const warnings = lines.filter((l) => /(^|[^A-Za-z])warning(?:[\s:])/.test(l));
  let verdict = "ok";
  if (errors.length || status !== 0) verdict = "error";
  else if (warnings.length) verdict = "warning";
  return { verdict, errors, warnings };
}

function compileSource(source, label) {
  fs.mkdirSync(WORK, { recursive: true });
  const stem = "p" + Math.abs(hash(label)).toString(36);
  const base = path.join(WORK, stem);
  const file = base + ".ly";
  fs.writeFileSync(file, source, "utf8");
  // spawnSync, not execFileSync: LilyPond writes warnings to stderr while
  // still exiting 0, and execFileSync only hands back stdout on success --
  // which would silently classify every bar-check warning as "ok".
  const run = spawnSync(LILYPOND, ["-dno-point-and-click", "-o", base, file], {
    encoding: "utf8",
    timeout: 60000,
  });
  if (run.error) {
    const result = classify(String(run.error.message || run.error), 2);
    for (const ext of [".ly", ".pdf", ".midi", ".log", ".ps"]) {
      try { fs.unlinkSync(base + ext); } catch (_) {}
    }
    return result;
  }
  const out = (run.stdout || "") + (run.stderr || "");
  const result = classify(out, run.status);
  // Keep the workspace clean; the .pdf/.midi are throwaway.
  for (const ext of [".ly", ".pdf", ".midi", ".log", ".ps"]) {
    try { fs.unlinkSync(base + ext); } catch (_) {}
  }
  return result;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// A few entries are not LilyPond source at all -- they are command lines
// (output formats, convert-ly, lilypond-book). Compiling them would be
// meaningless, but "unprobed" would understate what we actually know, so
// they carry `shellProbe`: an argv array plus `expectExit` (default 0) and
// optional `expectOut`, a substring the combined output must contain. The
// harness actually RUNS these, so the CLI category is verified the same way
// the rest of the corpus is.
//
// Note: LilyPond exits 0 even when it emitted warnings, so a bare
// exit-code check is not sufficient for a compile probe -- that is exactly
// why classify() also scans the log text.
function runShellProbe(entry, label) {
  const dir = path.join(WORK, "shell-" + Math.abs(hash(label)).toString(36));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (entry.shellSetup) {
    for (const [name, body] of Object.entries(entry.shellSetup)) {
      const p = path.join(dir, name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, body, "utf8");
    }
  }
  const run = spawnSync(entry.shellProbe[0], entry.shellProbe.slice(1), {
    encoding: "utf8",
    cwd: dir,
    timeout: 60000,
  });
  // NOTE: the scratch dir is only removed at the very end -- expectFiles
  // inspects it.
  if (run.error) {
    fs.rmSync(dir, { recursive: true, force: true });
    return { verdict: "error", errors: [String(run.error.message)], warnings: [] };
  }
  const out = (run.stdout || "") + (run.stderr || "");
  const wantExit = entry.expectExit === undefined ? 0 : entry.expectExit;
  const errors = [];
  const warnings = [];
  if (run.status !== wantExit) {
    errors.push(`expected exit ${wantExit}, got ${run.status}: ${out.split("\n")[0] || "(no output)"}`);
  }
  if (entry.expectOut && !out.includes(entry.expectOut)) {
    errors.push(`output did not contain: ${entry.expectOut}`);
  }
  // The mirror image: for flags whose claim is what they SUPPRESS (log
  // levels), the test is that the suppressed text stays absent. A probe that
  // only checked the exit status would pass for a bogus flag too.
  for (const absent of entry.shellExpectAbsent || []) {
    if (out.includes(absent)) {
      errors.push(`output should not contain: ${absent}`);
    }
  }
  // For output-format entries the real claim is "this file appeared", which
  // the log text does not reliably state. Check the filesystem too.
  for (const f of entry.expectFiles || []) {
    if (!fs.existsSync(path.join(dir, f))) {
      errors.push(`expected output file was not produced: ${f}`);
    }
  }
  // Same rule as the compile path: any warning anywhere is not clean.
  for (const line of [...new Set(out.split("\n").filter((l) => DIAG.test(l)))]) {
    if (/(^|[^A-Za-z])(warning|fatal|error)(?:[\s:])/.test(line)) errors.push(line);
    else warnings.push(line);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return { verdict: errors.length ? "error" : warnings.length ? "warning" : "ok", errors, warnings };
}

// An entry is probed when it carries `probe` (staff-level body) or
// `probeFull` (a complete .ly file, used for top-level constructs), or
// `shellProbe` (an argv array, for command-line entries).
function probeSource(entry) {
  if (entry.probeFull) return entry.probeFull;
  if (entry.probe) return WRAP(entry.probe);
  return null;
}

// Some entries exist precisely to DOCUMENT a failure (the wrong-spelling
// warnings in the do-not-emit table). Those carry `expectFail` plus
// `expectText`, a substring the log must actually contain. Verifying them
// the same way as working syntax would be circular: the point is to prove
// that the bad thing still misbehaves on this version.
function verdictFor(entry, result) {
  if (!entry.expectFail) return result.verdict;
  const log = [...result.errors, ...result.warnings].join("\n");
  if (result.verdict === "ok") return "still-passes";
  if (!log.includes(entry.expectText)) return "wrong-diagnostic";
  return "ok";
}

function main() {
  const argv = process.argv.slice(2);
  const onlyFailures = argv.includes("--only-failures");
  const wanted = argv.filter((a) => !a.startsWith("--"));
  const categories = loadCategories().filter(
    (c) => wanted.length === 0 || wanted.includes(c.id)
  );

  const lilyVersion = (() => {
    try {
      return execFileSync(LILYPOND, ["--version"], { encoding: "utf8" })
        .split("\n")[0]
        .trim();
    } catch (e) {
      return "unknown";
    }
  })();

  const report = { lilypond: lilyVersion, generated: new Date().toISOString(), entries: {} };
  const failures = [];
  let probed = 0;

  for (const cat of categories) {
    for (const entry of cat.entries) {
      const key = cat.id + "/" + entry.id;
      const source = probeSource(entry);
      const isShell = !source && Array.isArray(entry.shellProbe);
      if (!source && !isShell) {
        report.entries[key] = { verdict: "unprobed", reason: entry.unprobed || "no probe supplied" };
        continue;
      }
      probed++;
      const res = isShell ? runShellProbe(entry, key) : compileSource(source, key);
      const verdict = verdictFor(entry, res);
      report.entries[key] = verdict === "ok"
        ? { verdict: "ok", expectedFailure: !!entry.expectFail }
        : { verdict, errors: res.errors, warnings: res.warnings };
      if (verdict !== "ok") failures.push({ key, verdict, errors: res.errors, warnings: res.warnings });
      if (!onlyFailures || verdict !== "ok") {
        const tag = verdict === "ok"
          ? (entry.expectFail ? "  xfail " : "  ok    ")
          : "  " + verdict.padEnd(6) + " ";
        process.stdout.write(tag + key + "\n");
      }
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n", "utf8");
  process.stdout.write(
    `\n${lilyVersion}\nprobed ${probed} entries, ${failures.length} not clean -> ${path.relative(ROOT, REPORT)}\n`
  );
  if (failures.length) {
    for (const f of failures) {
      process.stdout.write(`\n--- ${f.key} (${f.verdict})\n`);
      for (const l of [...f.errors, ...f.warnings].slice(0, 4)) process.stdout.write("    " + l + "\n");
    }
    process.exit(1);
  }
}

// Exported for scripts/verify-syntax.selftest.js, which tests these functions
// directly rather than re-implementing them -- a copied classify() would keep
// testing the old behaviour after a fix and report a false PASS.
module.exports = { classify, verdictFor, runShellProbe, probeSource, loadCategories, WRAP };

// Only run when invoked directly, so requiring this file has no side effects.
if (require.main === module) main();