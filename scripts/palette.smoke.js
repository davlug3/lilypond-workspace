// Smoke test for public/palette.js logic (no browser available here).
// Loads the real script in a vm with stub DOM, then asserts braceDepth and
// placementRule behavior, plus that render produces the expected structure.
// Run: node scripts/palette.smoke.js

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function makeEl() {
  const el = {
    children: [],
    dataset: {},
    hidden: false,
    textContent: "",
    innerHTML: "",
    title: "",
    value: "",
    type: "",
    className: "",
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    setAttribute() {},
    querySelectorAll() { return []; },
  };
  return el;
}

const ids = {};
["palCats", "editor", "palFilter", "palScope", "palMsg", "palCounts",
 "palette", "palToggle", "palClose"].forEach((id) => { ids[id] = makeEl(); });

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => ids[id] || null,
    createElement: () => makeEl(),
    body: makeEl(),
  },
  navigator: {},
  localStorage: { getItem: () => null, setItem: () => {} },
  setTimeout: (fn) => 0,
  confirm: () => false,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// Fixture is built from the live generated payload, so the smoke test always
// tracks the current build. It picks entries exercising every render path:
// insert / copy / template / reference / xfail badge / unverified badge.
function buildFixture() {
  const src = fs.readFileSync(path.join(ROOT, "public", "lilypond-syntax.js"), "utf8");
  const sb = { window: {} };
  vm.createContext(sb);
  vm.runInContext(src, sb);
  const d = sb.window.LILYPOND_SYNTAX;
  const pick = (cid, id) => d.categories.find((c) => c.id === cid).entries.find((e) => e.id === id);
  const unprobed = (() => {
    for (const c of d.categories) {
      const u = c.entries.find((e) => !e.verified);
      if (u) return { cat: c, entry: u };
    }
    return null;
  })();
  const t = d.categories.find((c) => c.id === "templates");
  const cats = [
    { id: "file", title: "File", blurb: "", stats: { total: 3, verified: 2, unprobed: 1 }, entries: [
      pick("file", "header"), pick("file", "skeleton"), pick("file", "score-no-layout")] },
    { id: "cli", title: "CLI", blurb: "", stats: { total: 2, verified: 1, unprobed: 0 }, entries: [
      pick("cli", "default-output"),
      Object.assign({}, pick("cli", "exit-codes"), { verification: "expected-failure", verified: true }) ] },
    { id: "templates", title: "Whole scores", blurb: "", stats: { total: 1, verified: 1, unprobed: 0 }, entries: [t.entries[0]] },
  ];
  if (unprobed) {
    cats.push({ id: unprobed.cat.id, title: unprobed.cat.title, blurb: "", stats: { total: 1, verified: 0, unprobed: 1 }, entries: [unprobed.entry] });
  }
  return {
    generated: d.generated, lilypond: d.lilypond, version: d.version,
    counts: { categories: cats.length, entries: 7, verified: 4, unprobed: 1 },
    categories: cats,
  };
}

const data = buildFixture();
sandbox.window.LILYPOND_SYNTAX = data;

vm.runInContext(fs.readFileSync(path.join(ROOT, "public", "palette.js"), "utf8"), sandbox, { filename: "palette.js" });

const T = sandbox.window.__paletteTest;
let failed = 0, ran = 0;
function check(label, got, want) {
  ran++;
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
}

// braceDepth: braces, comments, strings, block comments
check("top level", T.braceDepth('\\version "2.26.0"\n', 18), 0);
const src = '\\score {\n  \\new Staff { c4 d }\n} % trailing { brace in comment\n';
check("inside score", T.braceDepth(src, src.indexOf("c4")), 2);
check("after close + comment brace ignored", T.braceDepth(src, src.length), 0);
const str = 'title = "a { b" \n\\score {\n';
check("brace in string ignored", T.braceDepth(str, str.length), 1);
const blk = '%{ a { b %} \\score {';
check("brace in block comment ignored", T.braceDepth(blk, blk.length), 1);
check("unbalanced close clamps at 0", T.braceDepth('} } {', 5), 1);

// placementRule
check("top@depth1 blocked", T.placementRule("top", 1), "top");
check("paper@depth2 blocked", T.placementRule("paper", 2), "top");
check("top@depth0 allowed", T.placementRule("top", 0), null);
check("music@depth0 blocked", T.placementRule("music", 0), "music");
check("score@depth0 blocked", T.placementRule("score", 0), "music");
check("drum@depth0 blocked", T.placementRule("drum", 0), "music");
check("lyricmode@depth0 blocked", T.placementRule("lyricmode", 0), "music");
check("music@depth1 allowed", T.placementRule("music", 1), null);
check("markup anywhere", T.placementRule("markup", 0), null);
check("layout anywhere", T.placementRule("layout", 1), null);
check("note anywhere", T.placementRule("note", 0), null);

// render structure: cats rendered, scope options filled
function findClass(node, substr, out) {
  out = out || [];
  if (node.className && node.className.indexOf(substr) !== -1) out.push(node);
  (node.children || []).forEach((c) => findClass(c, substr, out));
  return out;
}
check("categories rendered", ids.palCats.children.length, data.categories.length);
check("verified badge rendered", findClass(ids.palCats, "pal-ok").length >= 1, true);
check("xfail badge rendered", findClass(ids.palCats, "pal-xfail").length >= 1, true);
check("unverified badge rendered", findClass(ids.palCats, "pal-unver").length >= 1, true);
check("scope select filled", ids.palScope.children.length >= 1, true);
check("scope select has top", ids.palScope.children.some((o) => o.value === "top"), true);
check("counts line mentions verified", ids.palCounts.textContent.includes("verified"), true);

console.log(`\n${ran - failed}/${ran} passed`);
process.exit(failed ? 1 : 0);
