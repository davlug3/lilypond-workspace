#!/usr/bin/env node
// build-syntax.js — turn data/categories/*.js + data/verify-report.json into
// public/lilypond-syntax.js, which sets window.LILYPOND_SYNTAX.
//
// The generated file is what the browser palette reads. It exists as a plain
// script (no bundler, no new dependency) to match the existing public/*.js
// pattern in this workspace.
//
// The point of the indirection: the palette shows a "verified" badge, and that
// badge must come from the compile log rather than from an author's
// confidence. This script refuses to mark anything verified unless
// scripts/verify-syntax.js said so, and it records WHY when it cannot.
//
//   node scripts/build-syntax.js           # build
//   node scripts/build-syntax.js --check   # fail if the generated file is stale
//
// Exit codes: 0 = written (or up to date), 1 = --check found it stale,
// 1 = a category failed validation.

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CAT_DIR = path.join(ROOT, "data", "categories");
const REPORT = path.join(ROOT, "data", "verify-report.json");
const OUT = path.join(ROOT, "public", "lilypond-syntax.js");

// The scope vocabulary. The palette uses this to refuse insertions in places
// they cannot go -- \paper inside \score is a syntax error, and finding that
// out by compiling is slower than knowing up front.
//
//   top        only valid at file scope, outside \score
//   score      inside the \score { } braces
//   music      inside a music expression: a Staff, a Voice, a variable
//   drum       inside a \drummode block in a DrumVoice
//   context    inside \new X \with { } or a \layout \context block
//   chordmode  inside \chordmode
//   lyricmode  inside \lyricmode
//   markup     inside \markup { }
//   layout     inside \layout { }
//   paper      inside \paper { }
//   note       explanatory only, not insertable
const SCOPES = new Set([
  "top", "score", "music", "drum", "context", "chordmode", "lyricmode",
  "markup", "layout", "paper", "note",
]);

const KINDS = new Set([
  "command", "property", "notation", "snippet", "template", "note", "warning",
]);

function loadReport() {
  if (!fs.existsSync(REPORT)) {
    throw new Error(
      `${path.relative(ROOT, REPORT)} is missing.\n` +
        "Run: node scripts/verify-syntax.js"
    );
  }
  return JSON.parse(fs.readFileSync(REPORT, "utf8"));
}

function validate(cat) {
  const problems = [];
  if (!cat.id) problems.push("missing id");
  if (!cat.title) problems.push("missing title");
  if (!Array.isArray(cat.entries)) problems.push("entries is not an array");
  const seen = new Set();
  for (const e of cat.entries || []) {
    const where = `${cat.id}/${e.id || "?"}`;
    if (!e.id) problems.push(`${where}: missing id`);
    if (seen.has(e.id)) problems.push(`${where}: duplicate id within category`);
    seen.add(e.id);
    if (!e.name) problems.push(`${where}: missing name`);
    if (!SCOPES.has(e.scope)) problems.push(`${where}: bad scope ${JSON.stringify(e.scope)}`);
    if (!KINDS.has(e.kind)) problems.push(`${where}: bad kind ${JSON.stringify(e.kind)}`);
    if (!e.desc) problems.push(`${where}: missing desc`);
    // An entry must be usable: either `insert` (goes into the editor at the
    // cursor) or `copy` (goes to the clipboard -- right for shell commands,
    // which must never be pasted into a .ly file).
    // "note" and "warning" entries are explanations and need neither.
    if (e.kind !== "note" && e.kind !== "warning" && !e.insert && !e.copy) {
      problems.push(`${where}: kind=${e.kind} but neither insert nor copy text`);
    }
  }
  return problems;
}

function build() {
  const report = loadReport();

  const files = fs.readdirSync(CAT_DIR).filter((f) => f.endsWith(".js")).sort();
  const cats = [];
  const problems = [];
  let entryCount = 0;

  for (const f of files) {
    const cat = require(path.join(CAT_DIR, f));
    problems.push(...validate(cat));

    const entries = cat.entries.map((e) => {
      const key = cat.id + "/" + e.id;
      const v = report.entries[key];
      let verified = false;
      let verifiedKind = "unprobed";
      let reason = null;

      if (v) {
        // An entry that documents a failure is verified when the failure
        // reproduces exactly -- but "verified" must not read as "compiles".
        // The report marks those rows expectedFailure; surface it so the UI
        // can badge them "fails as documented" instead of "compiles clean".
        verified = v.verdict === "ok";
        verifiedKind = verified && v.expectedFailure ? "expected-failure" : v.verdict;
        reason = v.reason || null;
      } else {
        // No report row at all: either the file predates the entry, or the
        // category was never verified. Either way, not verified.
        reason = "no verification record -- run node scripts/verify-syntax.js";
      }

      const out = {
        id: e.id,
        name: e.name,
        syntax: e.syntax || "",
        kind: e.kind,
        scope: e.scope,
        desc: e.desc,
        verified,
        // "ok" / "expected-failure" / "unprobed" / any failure verdict
        verification: verifiedKind,
      };
      if (e.insert) out.insert = e.insert;
      if (e.copy) out.copy = e.copy;
      if (e.note) out.note = e.note;
      if (e.gotchas) out.gotchas = e.gotchas;
      if (e.unprobed) out.unprobed = e.unprobed;
      if (reason && !verified) out.why = reason;
      // Surface the recorded diagnostics for entries that document a failure,
      // so the palette can show the real message rather than prose about it.
      if (!verified && v && (v.errors || v.warnings)) {
        out.diagnostics = [...(v.errors || []), ...(v.warnings || [])].slice(0, 4);
      }
      return out;
    });

    entryCount += entries.length;
    const stats = {
      total: entries.length,
      verified: entries.filter((e) => e.verified).length,
      unprobed: entries.filter((e) => e.verification === "unprobed").length,
    };
    cats.push({ id: cat.id, title: cat.title, blurb: cat.blurb || "", stats, entries });
  }

  if (problems.length) {
    throw new Error("category validation failed:\n  " + problems.join("\n  "));
  }

  const payload = {
    generated: report.generated,
    lilypond: report.lilypond,
    version: report.lilypond,
    counts: {
      categories: cats.length,
      entries: entryCount,
      verified: cats.reduce((n, c) => n + c.stats.verified, 0),
      unprobed: cats.reduce((n, c) => n + c.stats.unprobed, 0),
    },
    categories: cats,
  };

  return { text: render(payload), payload };
}

// A fixed-shape header so the generated file explains itself in place, and the
// provenance is impossible to miss when someone opens public/.
function render(payload) {
  const banner =
    "// GENERATED FILE -- do not edit.\n" +
    "//\n" +
    "// Produced by scripts/build-syntax.js from:\n" +
    "//   data/categories/*.js      the hand-written corpus\n" +
    "//   data/verify-report.json   written by scripts/verify-syntax.js\n" +
    "//\n" +
    "// Every entry's `verified` flag comes from that report, never from an\n" +
    "// author's confidence. If you change a category, re-run:\n" +
    "//\n" +
    "//   node scripts/verify-syntax.js && node scripts/build-syntax.js\n" +
    "//\n" +
    `// LilyPond: ${payload.lilypond}\n` +
    `// Entries: ${payload.counts.entries} total, ${payload.counts.verified} verified, ${payload.counts.unprobed} unprobed\n`;

  return (
    banner +
    "window.LILYPOND_SYNTAX = " +
    JSON.stringify(payload, null, 2) +
    ";\n"
  );
}

function main() {
  const check = process.argv.includes("--check");
  let text;
  let payload;
  try {
    // Returned separately rather than re-parsed out of the rendered text: the
    // banner and the entry text both contain braces, so slicing to the first
    // "{" and calling JSON.parse on the rest is not a round trip.
    ({ text, payload } = build());
  } catch (e) {
    process.stderr.write("build-syntax: " + e.message + "\n");
    process.exit(1);
  }

  if (check) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (current !== text) {
      process.stderr.write(
        "build-syntax: public/lilypond-syntax.js is stale.\n" +
          "  Run: node scripts/build-syntax.js\n"
      );
      process.exit(1);
    }
    process.stdout.write("build-syntax: up to date\n");
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text, "utf8");
  process.stdout.write(
    `build-syntax: ${payload.counts.categories} categories, ` +
      `${payload.counts.entries} entries ` +
      `(${payload.counts.verified} verified, ${payload.counts.unprobed} unprobed) ` +
      `-> ${path.relative(ROOT, OUT)}\n`
  );
}

main();