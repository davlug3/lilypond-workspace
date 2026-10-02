#!/usr/bin/env node
// Differential test: scripts/barcalc.py vs LilyPond 2.26 bar checks.
// For each bar body we ask LilyPond whether it warns, and ask barcalc whether
// it totals 16/16. The two must agree on every case, otherwise barcalc is
// lying and probe authors will trust it wrongly.
// Run: node scripts/barcalc.selftest.js

"use strict";
const { execFileSync, spawnSync } = require("child_process");
const path = require("path");

const WORK = "/data/data/com.termux/files/usr/tmp/opencode/barcalc-selftest";
const BAR = path.resolve(__dirname, "barcalc.py");

const CASES = [
  "c4 d e f",
  "c1",
  "c2 c2",
  "c4 c c c",
  "c8 c8 c8 c8 c8 c8 c8 c8",
  "c4 r d",            // carry-over makes r and d half notes -> short
  "g2 r2 d4",
  "c4 r4 d4 c4",
  "\\tuplet 3/2 { c8 d e } c4 c4 c4",
  "\\tuplet 3/2 { c8 d e } c4 c4",   // one quarter short
  "c4. c8 c8 c8 c8 c8",
  "c4.. c4 c4 c16",
  "c2. d4",
  "c4\\staccato d\\accent e\\tenuto f",
  "cis4 des8 fis g s8 s8 s8",
];

function lilypondWarns(body) {
  const src =
    '\\version "2.26.0"\n\\score { \\new Staff { \\relative c\' { \\time 4/4 ' +
    body + " | } } \\layout { } }\n";
  const file = path.join(WORK, "t.ly");
  require("fs").mkdirSync(WORK, { recursive: true });
  require("fs").writeFileSync(file, src, "utf8");
  const run = spawnSync(process.env.LILYPOND || "lilypond", ["-dno-point-and-click", "-o", path.join(WORK, "t"), file], {
    encoding: "utf8",
    timeout: 60000,
  });
  const out = (run.stdout || "") + (run.stderr || "");
  return /bar check failed/.test(out);
}

function barcalcFills(body) {
  const out = execFileSync("python3", [BAR, body], { encoding: "utf8" });
  return /OK - fills the bar/.test(out);
}

let failed = 0;
for (const body of CASES) {
  const warns = lilypondWarns(body);
  const fills = barcalcFills(body);
  const agree = warns === !fills;
  if (!agree) failed++;
  process.stdout.write(
    `${agree ? "PASS" : "FAIL"}  ${body}\n        lilypond_warns=${warns} barcalc_fills=${fills}\n`
  );
}
process.stdout.write(`\n${CASES.length - failed}/${CASES.length} agree\n`);
process.exit(failed ? 1 : 0);