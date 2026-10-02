// Whole-score starting points, folded in from the skill's own template files.
//
// These entries deliberately do NOT copy the template text. They read the
// files from skills/lilypond/templates/ at load time and use the contents both
// as the thing the palette inserts and as the .ly the harness compiles. That
// way there is exactly one copy of each template: editing the .ly in the skill
// updates the palette automatically, and the verification result always
// refers to the file that is actually shipped.

const fs = require("fs");
const path = require("path");

const TEMPLATE_DIR = path.resolve(__dirname, "..", "..", "skills", "lilypond", "templates");

// What each template is for, and the one thing that is easy to get wrong when
// you write this shape by hand. These notes are the reason to reach for the
// template rather than to retype it.
const NOTES = {
  "string-quartet.ly": {
    name: "String quartet",
    desc: "Four independent staves in a StaffGroup, viola on alto clef, cello on bass clef.",
    note:
      "The baseline for any multi-part score. Each part is a named music " +
      "variable; \\new Staff = \"name\" is what lets \\change Staff and " +
      "\\lyricsto find things later.",
  },
  "piano-grand-staff.ly": {
    name: "Piano, grand staff",
    desc: "Right hand over left hand on a PianoStaff, with dynamics, pedal and MIDI.",
    note:
      "Both hands are entered \\relative c, not c', because the two staves " +
      "have different base octaves. Each hand gets its own named Staff.",
    gotchas: [
      "Pedal markings come from the SustainPedal grob and need \\sustainOn / \\sustainOff, not \\pianoPedal.",
    ],
  },
  "satb-lyrics.ly": {
    name: "SATB hymn with lyrics",
    desc: "S and A share a staff, T and B share another, each voice with its own lyric line.",
    note:
      "\\voiceOne .. \\voiceFour assign stem direction and collision behaviour " +
      "per voice, and each Lyrics context is bound with \\lyricsto to one " +
      "named Voice.",
    gotchas: [
      "A Lyrics context must name its Voice, or \\lyricsto cannot attach and you get a silently unattached verse.",
    ],
  },
  "lead-sheet.ly": {
    name: "Lead sheet",
    desc: "Melody plus chord symbols plus lyrics, in one system.",
    note:
      "Needs three contexts stacked in one << >>: a named Voice for the " +
      "melody, \\new ChordNames for the symbols, and \\new Lyrics bound to " +
      "the melody's name.",
    gotchas: [
      "Reuse the same melody variable for the layout and the MIDI block, or the two will drift apart.",
      "Chord symbols need an explicit duration or the bar check fails -- write c1:maj7, not c:maj7.",
    ],
  },
  "guitar-tab.ly": {
    name: "Guitar with tablature",
    desc: "Standard notation above a TabStaff carrying the same line, with a bend and a slide.",
    note:
      "Two contexts in one << >>: a TabStaff for the frets and a Staff for " +
      "the notation. The tab voices the standard notation automatically.",
    gotchas: [
      "Tablature is written pitch + TWO numbers after the duration: \\string then \\fret. e'\\2\\3 is fret 3 on string 2.",
      "One number alone compiles but warns about recalculating the string.",
    ],
  },
  "drum-part.ly": {
    name: "Drum part",
    desc: "A groove on a DrumStaff using \\drummode.",
    note: "Note names are instruments, not pitches. Only DrumStaff is a creatable drum context.",
    gotchas: [
      "Verify every drum name by compiling it -- an unknown name is an error, and the plausible guesses (ride, crash, cyc) are all rejected in 2.26.",
    ],
  },
  "multi-movement-book.ly": {
    name: "Multi-movement book",
    desc: "Several \\bookpart blocks inside one \\book, each with its own subtitle.",
    note:
      "One \\book means one shared \\paper setup for every movement. Each " +
      "\\score still needs both \\layout and \\midi.",
    gotchas: [
      "With more than one \\bookpart, page numbers need (add-book-part-markup) or the numbering restarts confusingly.",
    ],
  },
};

const files = fs
  .readdirSync(TEMPLATE_DIR)
  .filter((f) => f.endsWith(".ly"))
  .sort();

if (!files.length) {
  throw new Error(`no templates found in ${TEMPLATE_DIR}`);
}

const entries = files.map((file) => {
  const body = fs.readFileSync(path.join(TEMPLATE_DIR, file), "utf8");
  const meta = NOTES[file] || { name: file.replace(/\.ly$/, ""), desc: "" };
  return {
    id: file.replace(/\.ly$/, ""),
    name: meta.name,
    syntax: meta.name + "  (whole file)",
    kind: "template",
    scope: "top",
    desc: meta.desc,
    // Inserting a template REPLACES the editor contents, not the selection --
    // the palette decides that based on kind === "template".
    insert: body,
    note: meta.note,
    gotchas: meta.gotchas,
    // The template file itself is the probe, so the verified stamp always
    // describes the file that ships.
    probeFull: body,
  };
});

module.exports = {
  id: "templates",
  title: "Whole scores",
  blurb:
    "Complete starting points, not fragments. Inserting one replaces the " +
    "editor contents. All seven compile clean on 2.26.0.",
  entries,
};