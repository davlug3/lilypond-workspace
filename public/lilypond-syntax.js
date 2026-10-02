// GENERATED FILE -- do not edit.
//
// Produced by scripts/build-syntax.js from:
//   data/categories/*.js      the hand-written corpus
//   data/verify-report.json   written by scripts/verify-syntax.js
//
// Every entry's `verified` flag comes from that report, never from an
// author's confidence. If you change a category, re-run:
//
//   node scripts/verify-syntax.js && node scripts/build-syntax.js
//
// LilyPond: GNU LilyPond 2.26.0 (running Guile 3.0)
// Entries: 238 total, 211 verified, 27 unprobed
window.LILYPOND_SYNTAX = {
  "generated": "2026-10-02T00:30:37.077Z",
  "lilypond": "GNU LilyPond 2.26.0 (running Guile 3.0)",
  "version": "GNU LilyPond 2.26.0 (running Guile 3.0)",
  "counts": {
    "categories": 17,
    "entries": 238,
    "verified": 211,
    "unprobed": 27
  },
  "categories": [
    {
      "id": "naming",
      "title": "Naming & syntax traps",
      "blurb": "Rules that decide whether a file parses at all. All of these were confirmed by compiling against 2.26.0.",
      "stats": {
        "total": 6,
        "verified": 1,
        "unprobed": 5
      },
      "entries": [
        {
          "id": "no-digits-in-names",
          "name": "No digits in variable names",
          "syntax": "partOne  (valid)   p1, mel1, p_1  (parse error)",
          "kind": "note",
          "scope": "top",
          "desc": "A LilyPond identifier cannot contain a digit anywhere, not even as a suffix.",
          "verified": false,
          "verification": "unprobed",
          "note": "Observed on 2.26.0: `p1 = \\relative c' { c4 }` gives error: syntax error, unexpected UNSIGNED, expecting '.' or '='. The same applies to context names - \\new Voice = \"mel1\" is fine (it is a string) but \\mel1 is not a valid command.",
          "gotchas": [
            "Rename p1 to partOne, bass1 to bassLine, gtr2 to guitarTwo.",
            "This also means \\new Staff = \"1\" works, because that is a quoted string, not an identifier."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "lyrics-reserved",
          "name": "`lyrics` is reserved",
          "syntax": "wordsOne  (use this)   lyrics  (reserved)",
          "kind": "note",
          "scope": "top",
          "desc": "Never name a variable `lyrics`.",
          "verified": true,
          "verification": "ok",
          "note": "Observed on 2.26.0: warning: identifier name is a keyword: `lyrics'. The skill lists this as a hard error (syntax error, unexpected \\lyrics); in practice 2.26 emits a warning. Treat it as a failure either way.",
          "gotchas": [
            "wordsOne, verseOne, sopranoWords are all safe."
          ]
        },
        {
          "id": "whitespace",
          "name": "Whitespace between tokens",
          "syntax": "c4 d4  (good)   c4d4  (bad)",
          "kind": "note",
          "scope": "music",
          "desc": "LilyPond needs whitespace between most tokens.",
          "verified": false,
          "verification": "unprobed",
          "note": "}<< and similar collisions produce confusing syntax errors.",
          "why": "no probe supplied"
        },
        {
          "id": "define-before-use",
          "name": "Define before use",
          "syntax": "melody = ...   then later   \\melody",
          "kind": "note",
          "scope": "top",
          "desc": "Order the file top down: \\version, \\header, variables, \\score. Referring to a variable defined later is an error.",
          "verified": false,
          "verification": "unprobed",
          "note": "This is why \\include goes above the \\score that uses the variables.",
          "why": "no probe supplied"
        },
        {
          "id": "version-diagnostics",
          "name": "Two warning shapes without a line:column",
          "syntax": "song.ly:1: warning: ...   /   warning: identifier name is a keyword: ...",
          "kind": "note",
          "scope": "top",
          "desc": "LilyPond does not always emit file:line:column for a warning. A log filter that only matches that pattern will silently miss these.",
          "verified": false,
          "verification": "unprobed",
          "note": "Both are real failures:\n  no \\version statement found, please add\n  identifier name is a keyword: `lyrics'\nMatch on the severity word instead. Verified against all 23 known-good skill files: zero false positives.",
          "why": "no probe supplied"
        },
        {
          "id": "set-vs-override",
          "name": "\\set or \\override?",
          "syntax": "\\set Staff.instrumentName = ...   /   \\override NoteHead.color = ...",
          "kind": "note",
          "scope": "music",
          "desc": "Timing, naming, counting and MIDI go through \\set. Color, size, padding and shape go through \\override.",
          "verified": false,
          "verification": "unprobed",
          "note": "\\set aimed at a grob gives: warning: cannot find or create context: NoteHead plus warning: the property 'color' does not exist (observed on 2.26.0). \\override with a misspelled grob gives: error: bad grob property path.",
          "gotchas": [
            "A wrong-but-plausible property name is ignored with NO message at all. Look it up; do not guess twice."
          ],
          "why": "no probe supplied"
        }
      ]
    },
    {
      "id": "file",
      "title": "File structure",
      "blurb": "The shape of every .ly file: version first, then header, then named variables, then the score that assembles them. Define before use, top to bottom.",
      "stats": {
        "total": 15,
        "verified": 15,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "version",
          "name": "\\version",
          "syntax": "\\version \"2.26.0\"",
          "kind": "command",
          "scope": "top",
          "desc": "Line 1 of every file. Pins the syntax rules and tells convert-ly which rules to apply.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n",
          "note": "Omitting it produces: warning: no \\version statement found, please add",
          "gotchas": [
            "Must be the very first line. A \\header above it is not allowed.",
            "Bump to 2.26.0 after running convert-ly; a stale version string compiles but misbehaves."
          ]
        },
        {
          "id": "header",
          "name": "\\header",
          "syntax": "\\header { title = \"...\" composer = \"...\" }",
          "kind": "command",
          "scope": "top",
          "desc": "Title block metadata.",
          "verified": true,
          "verification": "ok",
          "insert": "\\header {\n  title = \"Untitled\"\n  composer = \"Anon.\"\n}\n",
          "note": "Fields: title subtitle subsubtitle composer arranger poet opus piece meter instrument dedication copyright tagline.",
          "gotchas": [
            "`lyrics` is reserved; never use it as a variable name."
          ]
        },
        {
          "id": "header-no-tagline",
          "name": "\\header with tagline = ##f",
          "syntax": "\\header { tagline = ##f }",
          "kind": "snippet",
          "scope": "top",
          "desc": "Suppress the tagline on every page, not just page 1.",
          "verified": true,
          "verification": "ok",
          "insert": "\\header { tagline = ##f }\n"
        },
        {
          "id": "music-variable",
          "name": "Music variable",
          "syntax": "melody = \\relative c' { c4 d e f }",
          "kind": "snippet",
          "scope": "top",
          "desc": "A named music expression, reusable in \\score, \\include files, and other variables.",
          "verified": true,
          "verification": "ok",
          "insert": "melody = \\relative c' {\n  c4 d e f | g2 r2 |\n}\n",
          "note": "Write music in small named variables so each part compiles and debugs on its own. Use a variable by naming it: \\melody"
        },
        {
          "id": "global",
          "name": "global settings variable",
          "syntax": "global = { \\key c \\major \\time 4/4 }",
          "kind": "snippet",
          "scope": "top",
          "desc": "Shared key and meter, included into each voice so every part agrees.",
          "verified": true,
          "verification": "ok",
          "insert": "global = {\n  \\key c \\major\n  \\time 4/4\n}\n"
        },
        {
          "id": "score",
          "name": "\\score",
          "syntax": "\\score { \\new Staff \\melody \\layout { } \\midi { } }",
          "kind": "command",
          "scope": "top",
          "desc": "One printed system sequence. Several \\score blocks in one file print in order.",
          "verified": true,
          "verification": "ok",
          "insert": "\\score {\n  \\new Staff \\melody\n  \\layout { }\n  \\midi { }\n}\n",
          "gotchas": [
            "Bare music with no \\score still prints in 2.26 (implicit score), but you get no layout control and no MIDI file."
          ]
        },
        {
          "id": "score-no-layout",
          "name": "\\score with \\midi only",
          "syntax": "\\score { \\new Staff \\melody \\midi { } }",
          "kind": "snippet",
          "scope": "top",
          "desc": "Valid: you get a MIDI file and no PDF pages.",
          "verified": true,
          "verification": "ok",
          "insert": "\\score {\n  \\new Staff { \\melody }\n  \\layout { }\n  \\midi { }\n}\n",
          "note": "Useful when you only want to hear the result."
        },
        {
          "id": "book",
          "name": "\\book / \\bookpart",
          "syntax": "\\book { \\bookpart { \\score { ... } } }",
          "kind": "snippet",
          "scope": "top",
          "desc": "Wrap movements in \\bookpart inside \\book. Each movement gets its own \\score and \\header.",
          "verified": true,
          "verification": "ok",
          "insert": "\\book {\n  \\bookpart {\n    \\header { subtitle = \"I. Fast\" }\n    \\score { \\new Staff \\movementOne \\layout { } }\n  }\n}"
        },
        {
          "id": "paper",
          "name": "\\paper",
          "syntax": "\\paper { #(set-paper-size \"a4\") }",
          "kind": "command",
          "scope": "top",
          "desc": "Page setup for the whole file. Lengths take \\mm \\cm \\in \\pt.",
          "verified": true,
          "verification": "ok",
          "insert": "\\paper {\n  #(set-paper-size \"a4\")\n}\n",
          "gotchas": [
            "\\paper NEVER goes inside \\score. Top level only."
          ]
        },
        {
          "id": "layout-block",
          "name": "\\layout",
          "syntax": "\\layout { #(layout-set-staff-size 16) }",
          "kind": "command",
          "scope": "score",
          "desc": "Engraving settings for this score. Inside \\score = this score only; at top level = every score.",
          "verified": true,
          "verification": "ok",
          "insert": "\\layout { }\n"
        },
        {
          "id": "midi-block",
          "name": "\\midi",
          "syntax": "\\midi { \\tempo 4 = 100 }",
          "kind": "command",
          "scope": "score",
          "desc": "Playback block. No \\midi block means no MIDI file is written at all.",
          "verified": true,
          "verification": "ok",
          "insert": "\\midi { }\n"
        },
        {
          "id": "include",
          "name": "\\include",
          "syntax": "\\include \"parts/violin.ily\"",
          "kind": "command",
          "scope": "top",
          "desc": "Paste another file at this point, relative to the current .ly file.",
          "verified": true,
          "verification": "ok",
          "insert": "\\include \"parts/shared.ily\"\n",
          "note": "Use it for variable definitions, placed BEFORE the \\score that uses them."
        },
        {
          "id": "midi-instrument",
          "name": "midiInstrument",
          "syntax": "\\new Staff \\with { midiInstrument = \"violin\" }",
          "kind": "property",
          "scope": "context",
          "desc": "General MIDI instrument for a staff (lowercase names). Drums use channel 10 automatically.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Staff \\with { midiInstrument = \"acoustic grand\" } ",
          "note": "Common names: acoustic grand, electric piano, violin, viola, cello, contrabass, harp, flute, clarinet, oboe, trumpet, trombone, tuba, alto sax, tenor sax, church organ, harpsichord."
        },
        {
          "id": "set-midi-instrument",
          "name": "\\set Staff.midiInstrument",
          "syntax": "\\set Staff.midiInstrument = \"acoustic grand\"",
          "kind": "command",
          "scope": "music",
          "desc": "Change the MIDI instrument mid-piece.",
          "verified": true,
          "verification": "ok",
          "insert": "\\set Staff.midiInstrument = \"acoustic grand\""
        },
        {
          "id": "skeleton",
          "name": "Minimal whole file",
          "syntax": "version + header + melody + score",
          "kind": "template",
          "scope": "top",
          "desc": "The shape of every file. Start from this rather than a blank buffer.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n\n\\header {\n  title = \"Piece\"\n  composer = \"Anon.\"\n}\n\nmelody = \\relative c' {\n  \\key c \\major\n  \\time 4/4\n  c4 d e f | g2 r2 |\n}\n\n\\score {\n  \\new Staff \\melody\n  \\layout { }\n  \\midi { }\n}\n"
        }
      ]
    },
    {
      "id": "pitch",
      "title": "Pitch & state",
      "blurb": "How a note names a pitch: the letter, an accidental suffix, an octave, and a duration. \\relative is what makes this bearable.",
      "stats": {
        "total": 15,
        "verified": 15,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "pitch-names",
          "name": "Pitch letters",
          "syntax": "a b c d e f g",
          "kind": "notation",
          "scope": "music",
          "desc": "Seven letter names. Case is the octave (see below); spelling is by suffix, never by case.",
          "verified": true,
          "verification": "ok",
          "insert": "c"
        },
        {
          "id": "octave-marks",
          "name": "Octave marks ' and ,",
          "syntax": "c'  c''  c,  c,,",
          "kind": "notation",
          "scope": "music",
          "desc": "In absolute mode c' is middle C (MIDI 60). ' raises an octave, , lowers one.",
          "verified": true,
          "verification": "ok",
          "insert": "c'",
          "note": "Bare c-g sit in the octave below middle C: c = C3, c'' = C5.",
          "gotchas": [
            "Uppercase is NOT low octave. LilyPond pitch case is the octave, so write c- (lower octave) or use \\relative. Use c,, to go down."
          ]
        },
        {
          "id": "relative",
          "name": "\\relative",
          "syntax": "\\relative c' { c d e f g a b c' }",
          "kind": "command",
          "scope": "music",
          "desc": "Each note lands as close as possible to the previous one (within a fourth). ' and , add an octave on top of that.",
          "verified": true,
          "verification": "ok",
          "insert": "\\relative c' {\n  c d e f | g a b c' |\n}\n",
          "note": "The first note is relative to the given start pitch, written in absolute mode.",
          "gotchas": [
            "Prefer \\relative c' or \\relative c'' as the anchor. Never start from the first note's own name (\\relative gis''') - it hides drift.",
            "Keep blocks short, one phrase per variable. Deleting or inserting one note re-anchors everything after it.",
            "Re-anchor leaps of a fifth or more with explicit ' or ,."
          ]
        },
        {
          "id": "relative-octave-up",
          "name": "\\relative c'' (higher)",
          "syntax": "\\relative c'' { c d e f }",
          "kind": "snippet",
          "scope": "music",
          "desc": "Start an octave higher - the usual anchor for the right hand and vocal parts.",
          "verified": true,
          "verification": "ok",
          "insert": "\\relative c'' {\n  c d e f | g2 r2 |\n}\n"
        },
        {
          "id": "relative-octave-down",
          "name": "\\relative c (lower)",
          "syntax": "\\relative c { c d e f }",
          "kind": "snippet",
          "scope": "music",
          "desc": "Anchor at c = C3. The usual anchor for bass-clef parts.",
          "verified": true,
          "verification": "ok",
          "insert": "\\relative c {\n  \\clef bass\n  c'2 e | g e | c a, | c r |\n}\n"
        },
        {
          "id": "accidentals",
          "name": "Accidentals",
          "syntax": "cis  des  fis  ges  bes  as  es",
          "kind": "notation",
          "scope": "music",
          "desc": "English/Dutch default: sharps add is, flats add es. Write ges, never gess; bes, never bflat.",
          "verified": true,
          "verification": "ok",
          "insert": "bes",
          "note": "Full set: cis des fis ges as es. Doubles double the suffix: cisis, deses, fisis, geses, asas, eses.",
          "gotchas": [
            "Quarter tones depend on \\language. English uses qs/qf/tqs/tqf families - look them up, never guess."
          ]
        },
        {
          "id": "forced-accidental",
          "name": "Forced accidental ! and reminder ?",
          "syntax": "cis!  c?",
          "kind": "notation",
          "scope": "music",
          "desc": "Print an accidental that the key signature would otherwise suppress; ? prints it in parentheses as a reminder.",
          "verified": true,
          "verification": "ok",
          "insert": "cis!"
        },
        {
          "id": "language",
          "name": "\\language",
          "syntax": "\\language \"deutsch\"",
          "kind": "command",
          "scope": "music",
          "desc": "Switches the pitch-name spelling rules. deutsch makes h = B natural and b = B flat.",
          "verified": true,
          "verification": "ok",
          "insert": "\\language \"deutsch\"\n",
          "note": "Other languages: nederlands, español, français, italiano, arabic (for makam / mirror accidentals)."
        },
        {
          "id": "key",
          "name": "\\key",
          "syntax": "\\key g \\major",
          "kind": "command",
          "scope": "music",
          "desc": "Sets the key signature and the spelling defaults from that point on.",
          "verified": true,
          "verification": "ok",
          "insert": "\\key c \\major\n",
          "note": "Major/minor share a signature. Modes work too: \\key d \\dorian. Accidentals still print per bar as needed."
        },
        {
          "id": "clef",
          "name": "\\clef",
          "syntax": "\\clef bass",
          "kind": "command",
          "scope": "music",
          "desc": "Chooses the clef. treble, bass, alto, tenor, soprano, percussion.",
          "verified": true,
          "verification": "ok",
          "insert": "\\clef bass\n"
        },
        {
          "id": "clef-octave",
          "name": "Octave clefs \"G_8\" / \"treble_8\"",
          "syntax": "\\clef \"treble_8\"",
          "kind": "snippet",
          "scope": "music",
          "desc": "Treble clef sounding an octave lower than written - tenor voice in SATB, and guitar.",
          "verified": true,
          "verification": "ok",
          "insert": "\\clef \"treble_8\"\n",
          "gotchas": [
            "\\clef \"G_8\" and \\clef \"treble_8\" are the same pitch but different conventions: guitar vs vocal tenor. Pick per part type."
          ]
        },
        {
          "id": "time",
          "name": "\\time",
          "syntax": "\\time 4/4",
          "kind": "command",
          "scope": "music",
          "desc": "Time signature. Set it like key: the command, then the music continues.",
          "verified": true,
          "verification": "ok",
          "insert": "\\time 4/4\n",
          "note": "Simple (divides in 2): 2/4 3/4 4/4 2/2. Compound (divides in 3): 6/8 9/8 12/8."
        },
        {
          "id": "tempo",
          "name": "\\tempo",
          "syntax": "\\tempo \"Allegro\" 4 = 120",
          "kind": "command",
          "scope": "music",
          "desc": "Metronome mark with optional text.",
          "verified": true,
          "verification": "ok",
          "insert": "\\tempo \"Allegro\" 4 = 120\n",
          "note": "Dotted-half form: \\tempo 2. = 60"
        },
        {
          "id": "transpose",
          "name": "\\transpose (FROM TO)",
          "syntax": "\\transpose c d' { c e g }",
          "kind": "command",
          "scope": "music",
          "desc": "Transposes the following music. FROM is the written pitch, TO is the target.",
          "verified": true,
          "verification": "ok",
          "insert": "\\transpose c d' { c e g }",
          "note": "Derive a B-flat clarinet part from concert pitch: \\transpose c bes, \\concertMusic",
          "gotchas": [
            "Swapping FROM and TO transposes the wrong direction. Compile and read the first pitch.",
            "Spelling is handled automatically - transposing is diatonic."
          ]
        },
        {
          "id": "midi-transpose",
          "name": "MIDI-only transpose",
          "syntax": "\\transpose c d' \\melody",
          "kind": "snippet",
          "scope": "score",
          "desc": "Keep the written pitch but change what the MIDI block plays - for parts you do not want to re-engrave.",
          "verified": true,
          "verification": "ok",
          "insert": "\\transpose c d' { \\melody }\n"
        }
      ]
    },
    {
      "id": "rhythm",
      "title": "Rhythm & duration",
      "blurb": "Durations persist until changed, so you must restate them after every rest and every voice change. Bar checks (|) are the self-test for exactly this.",
      "stats": {
        "total": 18,
        "verified": 18,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "durations",
          "name": "Durations",
          "syntax": "1 2 4 8 16 32 64",
          "kind": "notation",
          "scope": "music",
          "desc": "Whole, half, quarter, eighth, sixteenth, thirty-second, sixty-fourth.",
          "verified": true,
          "verification": "ok",
          "insert": "c4"
        },
        {
          "id": "dots",
          "name": "Dotted durations",
          "syntax": "4.  8..",
          "kind": "notation",
          "scope": "music",
          "desc": "One dot adds half the duration; a second dot adds a quarter of it.",
          "verified": true,
          "verification": "ok",
          "insert": "c4.",
          "note": "c4. = 3 eighths. c8.. = 7 sixteenths."
        },
        {
          "id": "carry-over",
          "name": "Duration carry-over",
          "syntax": "c4 d e f   ->  all four are quarters",
          "kind": "note",
          "scope": "music",
          "desc": "A duration persists until you change it. Writing c4 d e f gives four quarter notes.",
          "verified": true,
          "verification": "ok",
          "note": "The trap: after a rest you MUST restate the duration. In `g2 r d` the bare r and bare d both inherit the HALF duration, so the bar holds 6 beats instead of 4. Observed on 2.26.0: warning: bar check failed at: 1/2. Restate the durations: g4 r4 d4 c4."
        },
        {
          "id": "restate-after-rest",
          "name": "Restate duration after a rest",
          "syntax": "c4 r4 d   (NOT c4 r d)",
          "kind": "snippet",
          "scope": "music",
          "desc": "Durations carry through rests. Write the duration again on the note after the rest.",
          "verified": true,
          "verification": "ok",
          "insert": "c4 r4 d"
        },
        {
          "id": "rest-pitched",
          "name": "r (pitched rest)",
          "syntax": "r4",
          "kind": "notation",
          "scope": "music",
          "desc": "A rest that sits at a staff position.",
          "verified": true,
          "verification": "ok",
          "insert": "r4"
        },
        {
          "id": "rest-full-measure",
          "name": "R1 (full-measure rest)",
          "syntax": "R1",
          "kind": "notation",
          "scope": "music",
          "desc": "A rest that fills exactly one measure whatever the meter is.",
          "verified": true,
          "verification": "ok",
          "insert": "R1",
          "note": "R1 is not the same as r1 - the capital R means whole measure."
        },
        {
          "id": "spacer-r",
          "name": "s (spacer rest)",
          "syntax": "s4",
          "kind": "notation",
          "scope": "music",
          "desc": "Holds time without printing anything. Standard in the lower of two voices.",
          "verified": true,
          "verification": "ok",
          "insert": "s4"
        },
        {
          "id": "tuplet",
          "name": "\\tuplet",
          "syntax": "\\tuplet 3/2 { c8 d e }",
          "kind": "command",
          "scope": "music",
          "desc": "Fits N notes into the time normally taken by M. Ratio is N/M, not M/N.",
          "verified": true,
          "verification": "ok",
          "insert": "\\tuplet 3/2 { c8 d e }\n",
          "note": "\\tuplet 3/2 { c4 d e } - triplet of quarters. \\times 2/3 is the older spelling; prefer \\tuplet."
        },
        {
          "id": "tie",
          "name": "~ (tie)",
          "syntax": "g2~ g2",
          "kind": "notation",
          "scope": "music",
          "desc": "Joins two notes of the SAME pitch into one sounding note across the barline.",
          "verified": true,
          "verification": "ok",
          "insert": "g2~",
          "note": "Tie goes inside the first note, slur goes around the notes. Never mix them up."
        },
        {
          "id": "slur",
          "name": "( ) (slur)",
          "syntax": "c( d e f)",
          "kind": "notation",
          "scope": "music",
          "desc": "Curved line over or under several adjacent notes.",
          "verified": true,
          "verification": "ok",
          "insert": "c( d e f)"
        },
        {
          "id": "phrasing-slur",
          "name": "\\( \\) (phrasing slur)",
          "syntax": "c\\( d e f\\)",
          "kind": "notation",
          "scope": "music",
          "desc": "The longer, structural phrasing slur. Different from a playing slur.",
          "verified": true,
          "verification": "ok",
          "insert": "c\\("
        },
        {
          "id": "partial",
          "name": "\\partial (pickup)",
          "syntax": "\\partial 4 { c8 d }",
          "kind": "command",
          "scope": "music",
          "desc": "Anacrusis. The pickup length plus bar 1 must add up to one full measure.",
          "verified": true,
          "verification": "ok",
          "insert": "\\partial 4 { c8 d } ",
          "note": "End the partial block without a bar check, then carry on normally."
        },
        {
          "id": "bar-check",
          "name": "| (bar check)",
          "syntax": "c4 d e f |",
          "kind": "notation",
          "scope": "music",
          "desc": "Verifies the bar holds exactly one measure. Prints nothing, warns if wrong.",
          "verified": true,
          "verification": "ok",
          "insert": " |",
          "note": "warning: bar check failed at: 1/4 means the bar holds a quarter. Never delete the | to silence it - recount the bar.",
          "gotchas": [
            "End every bar with | in the files you write. It is the cheapest possible self-test."
          ]
        },
        {
          "id": "grace",
          "name": "\\grace",
          "syntax": "\\grace g g'1",
          "kind": "command",
          "scope": "music",
          "desc": "Unmeasured lead-in note before the main note.",
          "verified": true,
          "verification": "ok",
          "insert": "\\grace g ",
          "note": "Grace notes go BEFORE the note. Ornaments like \\trill go AFTER."
        },
        {
          "id": "acciaccatura",
          "name": "\\acciaccatura",
          "syntax": "\\acciaccatura g g'1",
          "kind": "command",
          "scope": "music",
          "desc": "Crushed grace note with a crossed stem. Takes no time from the main note.",
          "verified": true,
          "verification": "ok",
          "insert": "\\acciaccatura g "
        },
        {
          "id": "appoggiatura",
          "name": "\\appoggiatura",
          "syntax": "\\appoggiatura g g'1",
          "kind": "command",
          "scope": "music",
          "desc": "Grace note that takes real time from the main note.",
          "verified": true,
          "verification": "ok",
          "insert": "\\appoggiatura g "
        },
        {
          "id": "bar-length-note",
          "name": "Ending every bar correctly",
          "syntax": "c4 d e f | g2 r2 |",
          "kind": "snippet",
          "scope": "music",
          "desc": "The canonical 4/4 bar pattern. Copy this shape rather than counting durations by hand.",
          "verified": true,
          "verification": "ok",
          "insert": "c4 d e f | g2 r2 |",
          "note": "Total per bar must be 4 quarters in 4/4, 3 in 3/4, 6 eighths in 6/8."
        },
        {
          "id": "compound-meter",
          "name": "6/8 in two groups of three",
          "syntax": "\\time 6/8 c8 d e f g a",
          "kind": "snippet",
          "scope": "music",
          "desc": "In compound meters the beat divides in three: 6/8 is two beats of three eighths, not three of two.",
          "verified": true,
          "verification": "ok",
          "insert": "\\time 6/8\nc8 d e f g a\n"
        }
      ]
    },
    {
      "id": "polyphony",
      "title": "Polyphony",
      "blurb": "Playing several things at once. The one decision that matters: a chord is one voice with several pitches, several voices are several rhythms. Never mix the two notations.",
      "stats": {
        "total": 12,
        "verified": 11,
        "unprobed": 1
      },
      "entries": [
        {
          "id": "sequential",
          "name": "Sequential { }",
          "syntax": "{ c4 d e f }",
          "kind": "notation",
          "scope": "music",
          "desc": "One voice, notes in order. The default container for music.",
          "verified": true,
          "verification": "ok",
          "insert": "{ c4 d e f }",
          "note": "Braces must balance. An unclosed { is the single most common generated-file error and the cascade of errors that follows it."
        },
        {
          "id": "simultaneous",
          "name": "Simultaneous << >>",
          "syntax": "<< { c4 d e f } { c,2 c,} >>",
          "kind": "notation",
          "scope": "music",
          "desc": "Two or more music expressions stacked to sound at the same time.",
          "verified": true,
          "verification": "ok",
          "insert": "<< { c4 d e f } { c,2 c,} >>",
          "note": "Every << needs a >>. Count both bracket pairs before compiling; LilyPond's first error is rarely the real one.",
          "gotchas": [
            "<< >> at the top of a score is also how you group contexts (\\new Staff ...), not just voices."
          ]
        },
        {
          "id": "chord",
          "name": "Chord < >",
          "syntax": "<c e g>2",
          "kind": "notation",
          "scope": "music",
          "desc": "One voice sounding several pitches together.",
          "verified": true,
          "verification": "ok",
          "insert": "<c e g>2",
          "note": "The duration goes AFTER the closing >. Inside a chord you write pitches, never voice commands or << >>.",
          "gotchas": [
            "Duration carries over between chords, so <c e g>4 <d f a>4 restates it.",
            "<c e g> is homorhythm. Independent rhythms need real voices."
          ]
        },
        {
          "id": "two-voices-staff",
          "name": "Two voices on one staff",
          "syntax": "\\new Staff <<\n  \\new Voice = \"one\" { \\voiceOne \\relative c' { c4 d e f | g2 r4 g | } }\n  \\new Voice = \"two\" { \\voiceTwo \\relative c { c4 g' b, g' | c,2 s4 c | } }\n>>",
          "kind": "snippet",
          "scope": "score",
          "desc": "Two independent rhythms engraved on a single staff, stems up and stems down.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Staff <<\n  \\new Voice = \"one\" { \\voiceOne \\relative c' { c4 d e f | g2 r4 g | } }\n  \\new Voice = \"two\" { \\voiceTwo \\relative c { c4 g' b, g' | c,2 s4 c | } }\n>>",
          "note": "Without \\voiceOne / \\voiceTwo the stems collide and rests print twice. The fix is the voice command, never manual offsets."
        },
        {
          "id": "voice-one",
          "name": "\\voiceOne",
          "syntax": "\\voiceOne",
          "kind": "command",
          "scope": "music",
          "desc": "Stems up for this voice. Mandatory whenever a staff holds more than one voice.",
          "verified": true,
          "verification": "ok",
          "insert": "\\voiceOne"
        },
        {
          "id": "voice-two",
          "name": "\\voiceTwo",
          "syntax": "\\voiceTwo",
          "kind": "command",
          "scope": "music",
          "desc": "Stems down for this voice. The second voice on a staff always takes it.",
          "verified": true,
          "verification": "ok",
          "insert": "\\voiceTwo"
        },
        {
          "id": "voice-three-four",
          "name": "\\voiceThree / \\voiceFour",
          "syntax": "\\voiceThree   \\voiceFour",
          "kind": "command",
          "scope": "music",
          "desc": "Directions for a third and fourth voice on one staff.",
          "verified": true,
          "verification": "ok",
          "insert": "\\voiceThree ",
          "note": "The palette only supports two voice directions on a single staff. Three or four voices on one staff is legal but needs manual editing.",
          "unprobed": "two simultaneous voices cannot be verified in one staff-level probe"
        },
        {
          "id": "one-voice",
          "name": "\\oneVoice",
          "syntax": "\\oneVoice",
          "kind": "command",
          "scope": "music",
          "desc": "Cancel the voice direction and go back to a single unstemmed voice.",
          "verified": true,
          "verification": "ok",
          "insert": "\\oneVoice"
        },
        {
          "id": "spacer",
          "name": "s (spacer rest)",
          "syntax": "s4",
          "kind": "notation",
          "scope": "music",
          "desc": "Invisible rest that holds time. Use in the lower voice where a printed rest would clutter.",
          "verified": true,
          "verification": "ok",
          "insert": "s4",
          "note": "Holds the beat without printing anything."
        },
        {
          "id": "parallel-music",
          "name": "\\parallelMusic",
          "syntax": "\\parallelMusic voiceA,voiceB { ... }",
          "kind": "snippet",
          "scope": "music",
          "desc": "Author two parts bar by bar: each bar's line 1 is voiceA, line 2 is voiceB.",
          "verified": true,
          "verification": "ok",
          "insert": "\\parallelMusic voiceA,voiceB {\n  %% Bar 1\n  c'4 d' e' f'   |\n  c4 d e f       |\n}",
          "note": "Bar checks are mandatory here, and every part of one bar system must have the same total length or you get a bar-check warning.",
          "gotchas": [
            "The number of voice names must match the number of lines per bar."
          ]
        },
        {
          "id": "backslash-separator",
          "name": "\\\\ (voice separator)",
          "syntax": "\\new Staff << \\voiceA \\\\ \\voiceB >>",
          "kind": "notation",
          "scope": "music",
          "desc": "Separates two voices inside one << >> on a staff.",
          "verified": true,
          "verification": "ok",
          "insert": "\\\\ ",
          "note": "\\\\ is staff-local. \\new Voice blocks need no \\\\ between them, and it is not a general sequence separator."
        },
        {
          "id": "chord-vs-voices",
          "name": "Chord or voices?",
          "syntax": "<c e g>  vs  << { c4 e } { g,2 } >>",
          "kind": "note",
          "scope": "music",
          "desc": "Same pitches, different meaning. Chords are homorhythmic (one rhythm for the whole group); voices carry independent rhythms.",
          "verified": false,
          "verification": "unprobed",
          "note": "Pick one per passage. A common correction is turning a <c e g> that should have independent rhythm into << { c4 } { e2 } >>.",
          "why": "no probe supplied"
        }
      ]
    },
    {
      "id": "staves",
      "title": "Staves & contexts",
      "blurb": "Score → StaffGroup/ChoirStaff/PianoStaff → Staff → Voice. Settings inherit downward. Give every voice a name if anything needs to find it.",
      "stats": {
        "total": 14,
        "verified": 13,
        "unprobed": 1
      },
      "entries": [
        {
          "id": "context-tree",
          "name": "Context hierarchy",
          "syntax": "Score → StaffGroup|ChoirStaff|PianoStaff → Staff → Voice",
          "kind": "note",
          "scope": "context",
          "desc": "How contexts nest. Everything else follows from this.",
          "verified": false,
          "verification": "unprobed",
          "note": "Settings inherit downward. Put shared key and time in each voice (or a \\global variable), staff size in \\layout, page setup in \\paper.",
          "why": "no probe supplied"
        },
        {
          "id": "new-staff",
          "name": "\\new Staff",
          "syntax": "\\new Staff { c4 }",
          "kind": "command",
          "scope": "score",
          "desc": "Creates a staff context holding music.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Staff { c4 }\n",
          "gotchas": [
            "Bare music with no \\new Staff wrapper will not attach to a score."
          ]
        },
        {
          "id": "new-staff-named",
          "name": "\\new Staff = \"name\"",
          "syntax": "\\new Staff = \"down\" { \\clef bass \\lower }",
          "kind": "command",
          "scope": "score",
          "desc": "A named staff. Needed when another voice must \\change Staff into it.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Staff = \"down\" {\n  \\clef bass\n  c4 d e f | g2 r2 |\n}\n"
        },
        {
          "id": "piano-staff",
          "name": "\\new PianoStaff",
          "syntax": "\\new PianoStaff << \\new Staff = \"up\" { } \\new Staff = \"down\" { } >>",
          "kind": "snippet",
          "scope": "score",
          "desc": "Two staves joined by a brace with shared barlines. Right hand up, left hand down.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new PianoStaff <<\n  \\new Staff = \"up\" { \\clef treble \\upper }\n  \\new Staff = \"down\" { \\clef bass \\lower }\n>>",
          "note": "Related: piano pedal attaches to notes as \\sustainOn / \\sustainOff."
        },
        {
          "id": "staff-group",
          "name": "\\new StaffGroup",
          "syntax": "\\new StaffGroup << \\new Staff ... \\new Staff ... >>",
          "kind": "snippet",
          "scope": "score",
          "desc": "Several staves under a bracket, each keeping its own barlines. Quartet, band.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new StaffGroup <<\n  \\new Staff { \\partOne }\n  \\new Staff { \\partTwo }\n>>"
        },
        {
          "id": "choir-staff",
          "name": "\\new ChoirStaff",
          "syntax": "\\new ChoirStaff << \\new Staff { } \\new Staff { } >>",
          "kind": "snippet",
          "scope": "score",
          "desc": "Like StaffGroup but with shared barlines. The SATB choice.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new ChoirStaff <<\n  \\new Staff = \"sa\" { }\n  \\new Staff = \"tb\" { }\n>>"
        },
        {
          "id": "new-voice-named",
          "name": "\\new Voice = \"name\"",
          "syntax": "\\new Voice = \"mel\" { \\melody }",
          "kind": "command",
          "scope": "score",
          "desc": "Creates a named voice. The name is how \\lyricsto and \\change Staff find it.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Voice = \"mel\" {\n  \\melody\n}\n",
          "note": "Name a voice whenever lyrics, MIDI lanes, or tweaks must attach to it."
        },
        {
          "id": "instrument-name",
          "name": "instrumentName / shortInstrumentName",
          "syntax": "\\new Staff \\with { instrumentName = \"Violin I\" }",
          "kind": "property",
          "scope": "context",
          "desc": "Long name prints before the first system, short name before each later one.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Staff \\with {\n  instrumentName = \"Violoncello\"\n  shortInstrumentName = \"Vc.\"\n} ",
          "note": "\\with customizes the context at creation. Set both names or the score looks half-finished."
        },
        {
          "id": "change-staff",
          "name": "\\change Staff = \"down\"",
          "syntax": "\\change Staff = \"down\"",
          "kind": "command",
          "scope": "music",
          "desc": "Move a voice to a different staff mid-piece. Both staves must be named.",
          "verified": true,
          "verification": "ok",
          "insert": "\\change Staff = \"down\"",
          "note": "Verified 2.26.0 shape: the TARGET staff must itself contain a \\new Voice, and the switch is issued inside a voice. Compiles clean and the music moves to the named staff.",
          "gotchas": [
            "A target staff with no voice inside -- \\new Staff = \"down\" { \\clef bass } -- fails with: warning: cannot find context to change to: Staff = down (observed on 2.26.0, not stated in the skill's reference).",
            "Both staves must exist and be named."
          ]
        },
        {
          "id": "chordnames-context",
          "name": "\\new ChordNames",
          "syntax": "\\new ChordNames \\harmony",
          "kind": "command",
          "scope": "score",
          "desc": "Its own context above the staff that prints chord symbols from \\chordmode music.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new ChordNames \\harmony\n",
          "gotchas": [
            "\\chordmode music dropped straight into a Staff prints notes, not symbols. It needs \\new ChordNames."
          ]
        },
        {
          "id": "lyrics-context",
          "name": "\\new Lyrics",
          "syntax": "\\new Lyrics \\lyricsto \"mel\" \\wordsOne",
          "kind": "command",
          "scope": "score",
          "desc": "A lyrics context bound to a named voice.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Lyrics \\lyricsto \"mel\" \\wordsOne\n"
        },
        {
          "id": "two-staves-simplest",
          "name": "Two staves, minimal",
          "syntax": "\\new StaffGroup << \\new Staff { } \\new Staff { } >>",
          "kind": "snippet",
          "scope": "score",
          "desc": "The smallest multi-staff score. Copy this as the starting point for a band.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new StaffGroup <<\n  \\new Staff { \\partOne }\n  \\new Staff { \\partTwo }\n>>\n\\layout { }\n\\midi { }"
        },
        {
          "id": "quartet",
          "name": "String quartet skeleton",
          "syntax": "StaffGroup with instrument names",
          "kind": "snippet",
          "scope": "score",
          "desc": "Four independent staves, viola in alto clef, cello in bass clef.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new StaffGroup <<\n  \\new Staff \\with { instrumentName = \"Violin I\" } \\violinI\n  \\new Staff \\with { instrumentName = \"Violin II\" } \\violinII\n  \\new Staff \\with { instrumentName = \"Viola\" } { \\clef alto \\viola }\n  \\new Staff \\with { instrumentName = \"Cello\" } { \\clef bass \\cello }\n>>\n\\layout { indent = 2\\cm }\n\\midi { }"
        },
        {
          "id": "satb",
          "name": "SATB skeleton",
          "syntax": "ChoirStaff, two voices per staff, \\clef \"treble_8\" for tenor",
          "kind": "snippet",
          "scope": "score",
          "desc": "Soprano and alto share a staff, tenor and bass share another. Tenor staff uses treble_8.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new ChoirStaff <<\n  \\new Staff = \"sa\" <<\n    \\clef treble\n    \\new Voice = \"soprano\" { \\voiceOne \\global \\soprano }\n    \\new Voice = \"alto\"    { \\voiceTwo \\global \\alto }\n  >>\n  \\new Lyrics \\lyricsto \"soprano\" \\sopranoWords\n  \\new Lyrics \\lyricsto \"alto\" \\altoWords\n  \\new Staff = \"tb\" <<\n    \\clef \"treble_8\"\n    \\new Voice = \"tenor\" { \\voiceOne \\global \\tenor }\n    \\new Voice = \"bass\"  { \\voiceTwo \\global \\bass }\n  >>\n  \\new Lyrics \\lyricsto \"tenor\" \\tenorWords\n  \\new Lyrics \\lyricsto \"bass\" \\bassWords\n>>\n\\layout { }\n\\midi { }"
        }
      ]
    },
    {
      "id": "chords",
      "title": "Chords & chord names",
      "blurb": "\\chordmode is a separate input language from note mode. Symbols inside notes, or c:7 outside chordmode, is the classic mixup.",
      "stats": {
        "total": 9,
        "verified": 8,
        "unprobed": 1
      },
      "entries": [
        {
          "id": "chordmode",
          "name": "\\chordmode",
          "syntax": "\\chordmode { c1 | g:7 | a:m7 | f:maj7 | }",
          "kind": "command",
          "scope": "top",
          "desc": "Chord-symbol input mode. No angle brackets; durations work as in note mode.",
          "verified": true,
          "verification": "ok",
          "insert": "harmony = \\chordmode {\n  c1 | g:7 | f |\n}\n",
          "note": "A chord lasts until the next symbol. Restate durations after rests. ~ holds a chord across the barline.",
          "gotchas": [
            "Typing note-mode <c e g> inside \\chordmode is an error. The modes do not mix."
          ]
        },
        {
          "id": "chord-spellings",
          "name": "Chord spellings",
          "syntax": "c  c:m  c:7  c:maj7  c:m7  c:dim  c:aug  c:sus4  c:6  c:9",
          "kind": "notation",
          "scope": "chordmode",
          "desc": "Bare letter = major. Colon then the quality. Alterations append: c:7.9-, c:9+.5+",
          "verified": true,
          "verification": "ok",
          "insert": "c:maj7 ",
          "note": "When unsure of a spelling, compile it and read the printed symbol - ChordNames echoes exactly what it understood."
        },
        {
          "id": "inversion",
          "name": "Slash chords / inversions",
          "syntax": "\\chordmode { c/e  c/g }",
          "kind": "notation",
          "scope": "chordmode",
          "desc": "Put the third or fifth in the bass. The symbol prints as a slash chord.",
          "verified": true,
          "verification": "ok",
          "insert": "c/e"
        },
        {
          "id": "chordnames-context",
          "name": "\\new ChordNames",
          "syntax": "\\new ChordNames \\harmony",
          "kind": "command",
          "scope": "score",
          "desc": "Prints the symbols on their own context above the staff.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new ChordNames \\harmony\n",
          "note": "Group it with the staff in a << >> so it sits above."
        },
        {
          "id": "chordname-props",
          "name": "ChordNames properties",
          "syntax": "\\new ChordNames \\with { majorSevenSymbol = \"M7\" }",
          "kind": "property",
          "scope": "context",
          "desc": "Reshape the printed symbols. chordChanges hides repeats, chordNameSeparator, minorChordSymbol.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new ChordNames \\with {\n  majorSevenSymbol = \"M7\"\n} \\harmony"
        },
        {
          "id": "chord-grid",
          "name": "Chord grid (rhythm slash)",
          "syntax": "\\chordmode { <c e g>1 }",
          "kind": "notation",
          "scope": "chordmode",
          "desc": "Angle brackets INSIDE chordmode print a slash pattern instead of a symbol.",
          "verified": true,
          "verification": "ok",
          "insert": "\\chordmode {\n  <c e g>1\n}\n",
          "note": "One grid event per chord. Keep grids on their own staff."
        },
        {
          "id": "figured-bass",
          "name": "\\new FiguredBass",
          "syntax": "\\new FiguredBass { \\figuremode { <6 4>4 <7 3> <6> <_!> } }",
          "kind": "snippet",
          "scope": "score",
          "desc": "Numbers under a bass staff. _ holds a figure, ! adds an accidental, - and + alter.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new FiguredBass {\n  \\figuremode {\n    <6 4>4 <7 3> <6> <_!>\n  }\n}\n",
          "note": "Place the FiguredBass context below the bass staff."
        },
        {
          "id": "lead-sheet",
          "name": "Lead sheet skeleton",
          "syntax": "ChordNames + Voice + Lyrics",
          "kind": "template",
          "scope": "score",
          "desc": "Melody, chord symbols and lyrics in that order.",
          "verified": true,
          "verification": "ok",
          "insert": "\\score {\n  <<\n    \\new ChordNames \\harmony\n    \\new Voice = \"mel\" { \\melody }\n    \\new Lyrics \\lyricsto \"mel\" \\wordsOne\n  >>\n  \\layout { }\n  \\midi { }\n}",
          "note": "The Voice must be named \"mel\" so \\lyricsto can attach to it."
        },
        {
          "id": "mode-mixup",
          "name": "Note mode vs chordmode",
          "syntax": "notes: <c e g>2      chordmode: c:7",
          "kind": "note",
          "scope": "chordmode",
          "desc": "Two separate input languages. Never mix them in one block.",
          "verified": false,
          "verification": "unprobed",
          "note": "Typing c:7 in note mode prints nothing useful. Typing <c e g> inside chordmode is a syntax error.",
          "why": "no probe supplied"
        }
      ]
    },
    {
      "id": "lyrics",
      "title": "Lyrics & singing",
      "blurb": "Lyrics attach to a NAMED voice via \\lyricsto. Syllables take durations like notes, so the syllable count must match the note count exactly or everything downstream shifts.",
      "stats": {
        "total": 8,
        "verified": 8,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "lyricmode",
          "name": "\\lyricmode",
          "syntax": "wordsOne = \\lyricmode { Three4 blind mice2 }",
          "kind": "command",
          "scope": "top",
          "desc": "Lyric input mode. A number after a syllable sets how many notes it spans.",
          "verified": true,
          "verification": "ok",
          "insert": "wordsOne = \\lyricmode {\n  Three4 blind mice2\n}\n",
          "note": "Never name the variable `lyrics` - it is reserved."
        },
        {
          "id": "lyricsto",
          "name": "\\lyricsto (use this, not \\addlyrics)",
          "syntax": "\\new Lyrics \\lyricsto \"mel\" \\wordsOne",
          "kind": "command",
          "scope": "score",
          "desc": "Binds lyrics to a named voice's rhythm exactly.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Lyrics \\lyricsto \"mel\" \\wordsOne\n",
          "note": "\\addlyrics attaches to whatever precedes it and misaligns the moment the music changes. Prefer \\lyricsto in every file you write.",
          "gotchas": [
            "\\addlyrics after a << >> block attaches to the wrong voice."
          ]
        },
        {
          "id": "hyphens",
          "name": "-- hyphen and __ extender",
          "syntax": "mel -- o -- dy __",
          "kind": "notation",
          "scope": "lyricmode",
          "desc": "-- draws a hyphen between syllables, __ draws an extender line across a melisma.",
          "verified": true,
          "verification": "ok",
          "insert": "mel -- o -- dy __",
          "note": "One -- per syllable break, with spaces around it. __ goes after the word, not after the syllable."
        },
        {
          "id": "melisma",
          "name": "Melisma (one syllable, several notes)",
          "syntax": "dy2",
          "kind": "notation",
          "scope": "lyricmode",
          "desc": "A number after the syllable stretches it over that many notes.",
          "verified": true,
          "verification": "ok",
          "insert": "dy2 ",
          "note": "Works only inside a \\lyricmode block, not on a bare word."
        },
        {
          "id": "skip",
          "name": "_ (skip a note)",
          "syntax": "glo -- _ ri -- a",
          "kind": "notation",
          "scope": "lyricmode",
          "desc": "Consumes one note without printing a syllable. Use when the word has fewer syllables than the melody has notes.",
          "verified": true,
          "verification": "ok",
          "insert": "glo -- _ ri -- a ",
          "note": "Count syllables against notes exactly. A mismatch shifts every following word."
        },
        {
          "id": "stanzas",
          "name": "Several stanzas",
          "syntax": "\\new Lyrics \\lyricsto \"mel\" \\verseOne   \\new Lyrics \\lyricsto \"mel\" \\verseTwo",
          "kind": "snippet",
          "scope": "score",
          "desc": "One Lyrics context per stanza, all bound to the same voice.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Lyrics \\lyricsto \"mel\" \\verseOne\n\\new Lyrics \\lyricsto \"mel\" \\verseTwo",
          "note": "Stanza numbers live in the variable name or \\set Lyrics.stanza = \"1.\""
        },
        {
          "id": "quotes",
          "name": "Quoted punctuation",
          "syntax": "\"I\" am so lone -- \"ly,\"",
          "kind": "note",
          "scope": "lyricmode",
          "desc": "Quote punctuation that belongs to the word.",
          "verified": true,
          "verification": "ok",
          "note": "Unquoted glued punctuation (ly,) changes how the word hyphenates."
        },
        {
          "id": "lyric-counting",
          "name": "Syllable vs note counting",
          "syntax": "8 notes in the melody, 8 syllables in the words",
          "kind": "note",
          "scope": "lyricmode",
          "desc": "The rule behind every lyric misalignment: one syllable per note unless you say otherwise.",
          "verified": true,
          "verification": "ok",
          "note": "A mismatch produces NO error. The PNG shows the words under the wrong notes. Recompile after every verse edit and read the score."
        }
      ]
    },
    {
      "id": "expressive",
      "title": "Expression & markup",
      "blurb": "Three separate mechanisms that are easy to confuse: articulations attach to one note, dynamics control loudness, slurs and ornaments span notes.",
      "stats": {
        "total": 17,
        "verified": 15,
        "unprobed": 2
      },
      "entries": [
        {
          "id": "articulation-shorthand",
          "name": "Articulation shorthands",
          "syntax": "c4-.  c4-^  c4-_  c4-!  c4--  c4-+",
          "kind": "notation",
          "scope": "music",
          "desc": "Attached after the note. - auto, ^ force up, _ force down.",
          "verified": true,
          "verification": "ok",
          "insert": "c4-.",
          "note": "Flip colliding scripts with ^ or _ rather than recompiling and hoping."
        },
        {
          "id": "articulation-commands",
          "name": "\\staccato and friends",
          "syntax": "c4\\staccato  c4\\tenuto  c4\\accent",
          "kind": "command",
          "scope": "music",
          "desc": "Spelled-out articulations: \\staccato \\tenuto \\marcato \\accent \\espressivo \\portato \\fermata.",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\staccato "
        },
        {
          "id": "string-articulations",
          "name": "\\upbow / \\downbow / \\harmonic",
          "syntax": "c4\\upbow  c4\\downbow  c4\\harmonic",
          "kind": "command",
          "scope": "music",
          "desc": "String-family marks, plus \\open \\stopped for wind and brass.",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\upbow "
        },
        {
          "id": "dynamics",
          "name": "Dynamics",
          "syntax": "c4\\p  d\\mp  e\\mf  f\\f",
          "kind": "command",
          "scope": "music",
          "desc": "piano to forte. Full set: \\ppp \\pp \\p \\mp \\mf \\f \\ff \\fff \\sf \\sfz \\fp \\rfz",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\mf "
        },
        {
          "id": "hairpins",
          "name": "Hairpins \\< \\> \\!",
          "syntax": "g4\\< a b c\\!",
          "kind": "notation",
          "scope": "music",
          "desc": "\\< crescendo, \\> diminuendo, \\! terminate.",
          "verified": true,
          "verification": "ok",
          "insert": "g4\\< ",
          "note": "EVERY hairpin must be terminated with \\! or a closing dynamic. An unterminated hairpin spans to the end of the movement, sometimes with a warning and sometimes silently."
        },
        {
          "id": "slur-family",
          "name": "Slurs",
          "syntax": "c( d e f)      g\\( a b c\\)",
          "kind": "notation",
          "scope": "music",
          "desc": "Playing slur ( ) and phrasing slur \\( \\). \\slurUp \\slurDown \\slurNeutral control placement.",
          "verified": true,
          "verification": "ok",
          "insert": "c( "
        },
        {
          "id": "breathe",
          "name": "\\breathe",
          "syntax": "c2 r2 \\breathe",
          "kind": "command",
          "scope": "music",
          "desc": "Breath mark. Goes after the bar's music, not attached to a note.",
          "verified": true,
          "verification": "ok",
          "insert": " \\breathe "
        },
        {
          "id": "ornaments",
          "name": "Ornaments",
          "syntax": "c4\\prall d\\mordent e\\trill f\\turn",
          "kind": "command",
          "scope": "music",
          "desc": "\\prall \\mordent \\trill \\turn, after the note.",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\prall d4\\mordent e4\\trill f4\\turn ",
          "note": "Grace ornaments (\\grace \\acciaccatura \\appoggiatura) go BEFORE the note; \\trill and \\mordent go AFTER."
        },
        {
          "id": "glissando-arpeggio",
          "name": "\\glissando and \\arpeggio",
          "syntax": "c4\\glissando d     <e g c>1\\arpeggio",
          "kind": "command",
          "scope": "music",
          "desc": "Glissando draws a line between two pitches - both notes must exist. Arpeggio spreads a chord.",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\glissando d "
        },
        {
          "id": "trill-span",
          "name": "\\startTrillSpan / \\stopTrillSpan",
          "syntax": "\\pitchedTrill c4\\startTrillSpan d \\stopTrillSpan c4",
          "kind": "command",
          "scope": "music",
          "desc": "Trill line across a passage.",
          "verified": true,
          "verification": "ok",
          "insert": "\\pitchedTrill c4\\startTrillSpan d \\stopTrillSpan c4"
        },
        {
          "id": "script-directions",
          "name": "Script direction ^ _ -",
          "syntax": "c4^\\markup { ... }   c4_\\markup { ... }",
          "kind": "notation",
          "scope": "music",
          "desc": "^ above, _ below, - automatic.",
          "verified": true,
          "verification": "ok",
          "insert": "c4^\\markup { \"text\" }",
          "note": "A bare \\markup at top level makes a standalone text block instead of attaching."
        },
        {
          "id": "markup-commands",
          "name": "Markup commands",
          "syntax": "\\bold \\italic \\small \\column \\pad-around #2",
          "kind": "command",
          "scope": "markup",
          "desc": "Fonts: \\bold \\italic \\underline \\small \\large \\huge \\fontsize #2 \\sans \\serif \\typewriter. Layout: \\column \\center-column \\left-column \\right-column \\line \\fill-line \\box \\circle.",
          "verified": true,
          "verification": "ok",
          "insert": "\\markup { \\bold \"text\" }\n",
          "note": "Music glyphs: \\musicglyph #\"scripts.segno\", \\note #\"4\" #1, \\rest #\"4\", \\clef, \\key, \\time, \\beam, \\slur, \\tuplet, \\dynamic."
        },
        {
          "id": "musicglyph",
          "name": "\\musicglyph",
          "syntax": "\\musicglyph #\"scripts.segno\"",
          "kind": "command",
          "scope": "markup",
          "desc": "A glyph by name. Used for segno, coda, and other symbols.",
          "verified": true,
          "verification": "ok",
          "insert": "\\musicglyph #\"scripts.segno\""
        },
        {
          "id": "markup-structure",
          "name": "\\mark structure",
          "syntax": "\\mark \\markup { ... }",
          "kind": "command",
          "scope": "music",
          "desc": "\\mark numbers rehearsal marks automatically.",
          "verified": true,
          "verification": "ok",
          "insert": "\\mark \\markup { \"A\" }\n"
        },
        {
          "id": "fonts-property",
          "name": "Fonts as a property",
          "syntax": "\\override Score.SectionLabel.fonts.roman = \"DejaVu Serif\"",
          "kind": "property",
          "scope": "layout",
          "desc": "fonts is an ordinary property, so it can be overridden per grob in \\layout.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override Score.SectionLabel.fonts.roman = \"DejaVu Serif\"\n",
          "note": "make-pango-font-tree was REMOVED in 2.26 (Unbound variable on compile; confirmed in 2.26.0's own convertrules.py). The skill's articulation-dynamics-markup.md §7 still shows it - do not emit it. Use set-global-staff-size or layout-set-staff-size for sizing.",
          "gotchas": [
            "The font must exist in the search path or you get: fatal error: cannot find font '...'"
          ]
        },
        {
          "id": "make-pango-font-tree-removed",
          "name": "NEVER emit make-pango-font-tree",
          "syntax": "fonts = #(make-pango-font-tree \"Serif\" \"Sans\" \"Mono\" 1)   -- removed in 2.26",
          "kind": "warning",
          "scope": "paper",
          "desc": "Obsolete font-selection syntax. Fails with: fatal error: Guile signaled an error ... Unbound variable: make-pango-font-tree",
          "verified": false,
          "verification": "unprobed",
          "note": "Confirmed on 2.26.0 by compiling it, and confirmed against 2.26.0's own convertrules.py, which states the function has been removed and that sizing must now be done with set-global-staff-size.",
          "why": "no probe supplied"
        },
        {
          "id": "mechanism-trio",
          "name": "Articulation vs dynamics vs ornament",
          "syntax": "c4-. c4\\mf c4\\trill",
          "kind": "note",
          "scope": "music",
          "desc": "Three different mechanisms. Articulation = how a note starts/ends. Dynamics = how loud. Ornament = a figure spanning notes.",
          "verified": false,
          "verification": "unprobed",
          "note": "Do not mix them up when choosing which one you need.",
          "why": "no probe supplied"
        }
      ]
    },
    {
      "id": "timing",
      "title": "Repeats, beams & bars",
      "blurb": "Repeat structures, manual beam control, and the difference between \\bar (draws a line) and | (checks the bar is full).",
      "stats": {
        "total": 13,
        "verified": 13,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "repeat-volta",
          "name": "\\repeat volta",
          "syntax": "\\repeat volta 2 { c4 d e f } \\alternative { { g2 a } { c,1 } }",
          "kind": "snippet",
          "scope": "music",
          "desc": "Bracket a repeated body, with \\alternative holding one block per ending.",
          "verified": true,
          "verification": "ok",
          "insert": "\\repeat volta 2 {\n  c4 d e f\n}\n\\alternative {\n  { g2 a }\n  { c,1 }\n}",
          "gotchas": [
            "The number of \\alternative blocks must match the number of endings. An extra ending prints but never plays in MIDI."
          ]
        },
        {
          "id": "repeat-unfold",
          "name": "\\repeat unfold",
          "syntax": "\\repeat unfold 4 { c4 d e f | }",
          "kind": "command",
          "scope": "music",
          "desc": "Write every iteration out instead of bracketing.",
          "verified": true,
          "verification": "ok",
          "insert": "\\repeat unfold 4 {\n  c4 d e f |\n}\n",
          "note": "Use for MIDI practice tracks and for lyrics that differ per verse - each copy gets its own \\lyricsto line."
        },
        {
          "id": "repeat-percent",
          "name": "\\repeat percent",
          "syntax": "\\repeat percent 4 { c8 d e f | }",
          "kind": "command",
          "scope": "music",
          "desc": "Compress identical bars into percent signs.",
          "verified": true,
          "verification": "ok",
          "insert": "\\repeat percent 4 {\n  c8 d e f |\n}\n",
          "gotchas": [
            "The repeated music must fill whole bars - a partial bar is an error."
          ]
        },
        {
          "id": "repeat-tremolo",
          "name": "\\repeat tremolo",
          "syntax": "\\repeat tremolo 8 { c32 d }      c4:32",
          "kind": "command",
          "scope": "music",
          "desc": "Measured tremolo, or the single-note shorthand c4:32.",
          "verified": true,
          "verification": "ok",
          "insert": "\\repeat tremolo 8 { c32 d } ",
          "note": "Subdivides one written note into rapid repeats."
        },
        {
          "id": "alternative",
          "name": "\\alternative",
          "syntax": "\\alternative { { ending1 } { ending2 } }",
          "kind": "command",
          "scope": "music",
          "desc": "Holds one block per repeat ending, always paired with \\repeat volta.",
          "verified": true,
          "verification": "ok",
          "insert": "\\alternative {\n  { c4 d e f | }\n  { g1 | }\n}\n"
        },
        {
          "id": "bar-commands",
          "name": "\\bar (draws a barline)",
          "syntax": "\\bar \".|:\"   \\bar \":|.\"   \\bar \"||\"   \\bar \"|.\"",
          "kind": "command",
          "scope": "music",
          "desc": "Draws an actual barline. Common types: \".|:\" repeat start, \":|.\" repeat end, \":|.:\" both, \"||\" double, \"|.\" final.",
          "verified": true,
          "verification": "ok",
          "insert": "\\bar \"|.\" ",
          "note": "\\bar DRAWS; | CHECKS. Use both: ... g2 | \\bar \"|.\"."
        },
        {
          "id": "bar-check-vs-bar",
          "name": "| vs \\bar",
          "syntax": "... g2 | \\bar \"|.\"",
          "kind": "note",
          "scope": "music",
          "desc": "| warns if the bar is not full and prints nothing. \\bar prints a line and checks nothing.",
          "verified": true,
          "verification": "ok",
          "note": "warning: bar check failed at: 1/4 means the bar holds a quarter. Never delete the | to silence it - recount the bar."
        },
        {
          "id": "beam-manual",
          "name": "Manual beams [ ]",
          "syntax": "c8[ c] d[ d] e[ e]",
          "kind": "notation",
          "scope": "music",
          "desc": "Force a beam between two notes.",
          "verified": true,
          "verification": "ok",
          "insert": "c8[ ",
          "note": "Beaming is automatic by default; reach for [ ] only when the automatic result is wrong.",
          "gotchas": [
            "Beams may not cross a barline. Beam within the bar."
          ]
        },
        {
          "id": "auto-beam",
          "name": "\\autoBeamOff / \\autoBeamOn",
          "syntax": "c4 \\autoBeamOff c8. e16 \\autoBeamOn g4",
          "kind": "command",
          "scope": "music",
          "desc": "Suspend the time-signature beaming rules for a passage.",
          "verified": true,
          "verification": "ok",
          "insert": "c4 \\autoBeamOff c8. e16 \\autoBeamOn g4 ",
          "note": "In 6/8 the automatic result is two groups of three eighths. Check the PNG."
        },
        {
          "id": "cadenza",
          "name": "\\cadenzaOn / \\cadenzaOff",
          "syntax": "\\cadenzaOn c4 d e f \\cadenzaOff \\bar \"|\"",
          "kind": "command",
          "scope": "music",
          "desc": "Unmetered music: no barlines drawn or checked inside the span.",
          "verified": true,
          "verification": "ok",
          "insert": "\\cadenzaOn c4 d e f \\cadenzaOff ",
          "gotchas": [
            "Forgetting \\cadenzaOff makes every following bar check fail."
          ]
        },
        {
          "id": "polymeter",
          "name": "Polymeter / per-staff timing",
          "syntax": "different \\time on each staff",
          "kind": "note",
          "scope": "score",
          "desc": "Staves may carry separate time signatures. LilyPond aligns by absolute time, not by barlines.",
          "verified": true,
          "verification": "ok",
          "note": "Bar checks in a polymeter staff refer to that staff's own meter, so a 3/4 staff's bars must total 3 beats while a 4/4 staff's total 4. Observed on 2.26.0: mismatched per-staff meters inside one << >> produced bar check failures, while a 4/4 staff above a 2/4 staff compiled clean. Keep a calculator handy and verify in the PNG."
        },
        {
          "id": "break-commands",
          "name": "\\break / \\pageBreak / \\noBreak",
          "syntax": "c4 d e f | \\break  g4 a b c' | \\pageBreak",
          "kind": "command",
          "scope": "music",
          "desc": "Force a line break, a page break, or forbid one.",
          "verified": true,
          "verification": "ok",
          "insert": "c4 d e f | \\break g4 a b c' | \\pageBreak\n",
          "note": "Break control belongs in the music; spacing AMOUNTS belong in \\paper / \\layout."
        },
        {
          "id": "fine",
          "name": "\\fine",
          "syntax": "\\fine",
          "kind": "command",
          "scope": "music",
          "desc": "\"Play through to here\", used with repeats.",
          "verified": true,
          "verification": "ok",
          "insert": "\\fine\n",
          "note": "Behaviour changed in 2.23.12: \\fine no longer stops \\repeat iteration, so endings after \\fine still unfold in MIDI."
        }
      ]
    },
    {
      "id": "special",
      "title": "Special staves",
      "blurb": "Drums, guitar tablature, custom staff lines. These use their own input modes; note names and durations still apply, but the pitch meaning changes or disappears.",
      "stats": {
        "total": 10,
        "verified": 10,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "drummode",
          "name": "\\drummode",
          "syntax": "\\drummode { \\time 4/4 bd4 sn hh cymc }",
          "kind": "command",
          "scope": "top",
          "desc": "Percussion input. Note names are drum instruments, not pitches.",
          "verified": true,
          "verification": "ok",
          "insert": "\\drummode {\n  \\time 4/4\n  \\bar \"|.\"\n  bd4 sn sn sn |\n}\n",
          "note": "The drum context and the pitched staff are SEPARATE contexts in a score, each with its own \\time. Declare \\new DrumStaff, not \\new Staff.",
          "gotchas": [
            "130 names exist in 2.26. The ones worth knowing: bd (bass drum), sn (snare), hh (closed hi-hat), hho (open), cymc (crash cymbal), cymr (ride), cab, mar (maracas), toms tomh/toml, tamb, timh/timl, wbh/wbl (wood block), cl, cuim.",
            "COMMON WRONG NAMES, each rejected by 2.26 with error: not a note name -- ride, crash, cyc, splash, cymbal, ridecy, crashcy. Use ridecymbal, crashcymbal, cymc, splashhihat, splashcymbal instead.",
            "Checked against 2.26's own share/ly/drumpitch-init.ly, which defines exactly 130 names.",
            "Multi-stroke rolls: bd8-> ff bd ff means a flam."
          ]
        },
        {
          "id": "no-drumsstaff",
          "name": "There is no \\new DrumsStaff",
          "syntax": "\\new DrumsStaff   -- does not exist in 2.26",
          "kind": "warning",
          "scope": "score",
          "desc": "Only one drum context is creatable: \\new DrumStaff. Everything else people reach for fails.",
          "verified": true,
          "verification": "ok",
          "note": "Checked by compiling \\new X for each of Drum, Drums, Drumset, DrumsStaff on 2.26.0: all four give warning: cannot create context: X. Only DrumStaff works. The other identifiers are instrument names used with \\set Staff.instrumentName, not contexts."
        },
        {
          "id": "drum-notes",
          "name": "Common drum names",
          "syntax": "bd sn hh cymc ridecymbal crashcymbal",
          "kind": "notation",
          "scope": "drum",
          "desc": "The instruments you will actually need. bass/snare/cymbals/ride, plus hh = hi-hat.",
          "verified": true,
          "verification": "ok",
          "insert": "bd4 sn hh8 hh ",
          "note": "Never invent a name; compile it. An unknown drum name is an error naming the accepted list."
        },
        {
          "id": "drum-mid-change",
          "name": "Mid-piece drum change",
          "syntax": "\\change Staff = \"cymbals\"",
          "kind": "note",
          "scope": "note",
          "desc": "Two DrumStaves grouped in a StaffGroup, switched with \\change Staff = \"name\".",
          "verified": true,
          "verification": "ok",
          "note": "The 'change' notation used in charts maps onto \\change Staff. Name BOTH staves, and give the second staff its own DrumVoice holding at least a spacer rest, or nothing can be switched into.",
          "gotchas": [
            "There is NO \\new DrumGroup in 2.26: it fails with warning: cannot create context: DrumGroup. Confirmed by grepping 2.26's ly/*.ly, which define only Drum, DrumStaff, DrumVoice, Drums and Drumset. Use \\new StaffGroup."
          ]
        },
        {
          "id": "tablature",
          "name": "Guitar tablature",
          "syntax": "tab = { e'\\2\\3 g'\\2\\0 b'\\3\\2 c'\\2\\1 }",
          "kind": "snippet",
          "scope": "top",
          "desc": "A six-line staff carrying frets. The pitch letter picks the octave; two numbers after it give the STRING then the FRET.",
          "verified": true,
          "verification": "ok",
          "insert": "tab = {\n  \\time 4/4\n  e'\\2\\3 g'\\2\\0 b'\\3\\2 c'\\2\\1 |\n}\n",
          "note": "Order is \\string then \\fret, both AFTER the duration. String 1 is the highest-pitched (thin) E string; fret 0 is open.",
          "gotchas": [
            "CORRECTION to the skill's special-staves.md, which shows e'0 g'0 B0 c'1. That form does not compile: `error: not a duration` on every number, and the capital B is not a note name.",
            "Writing one fret only (e'\\3) compiles but warns: Requested string for pitch requires negative fret ... Ignoring string request and recalculating. Always give both.",
            "Tablature is a SEPARATE context paired with the Staff in a << >>. Write both parts or the tab floats unaligned."
          ]
        },
        {
          "id": "staff-lines",
          "name": "\\stopStaff",
          "syntax": "c4\\stopStaff d\\startStaff e",
          "kind": "command",
          "scope": "music",
          "desc": "Hide or restore staff lines under notes - used for fretted harmonics and some unpitched notation.",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\stopStaff "
        },
        {
          "id": "remove-empty",
          "name": "\\RemoveEmptyStaves",
          "syntax": "\\layout { \\context { \\Staff \\RemoveEmptyStaves } }",
          "kind": "property",
          "scope": "layout",
          "desc": "Drop staves that rest for a whole section, so a tacet part does not print six empty systems.",
          "verified": true,
          "verification": "ok",
          "insert": "\\RemoveEmptyStaves ",
          "note": "The right way to handle a part that enters late."
        },
        {
          "id": "remove-all-empty",
          "name": "RemoveAllEmptyStaves",
          "syntax": "\\layout { \\context { \\RemoveAllEmptyStaves } }",
          "kind": "property",
          "scope": "layout",
          "desc": "Same idea, applied to every context type at once.",
          "verified": true,
          "verification": "ok",
          "insert": "\\RemoveAllEmptyStaves ",
          "note": "It must sit inside a \\context block, not directly in \\layout."
        },
        {
          "id": "hide-empty-lyrics",
          "name": "Hiding empty lyric stanzas",
          "syntax": "\\override VerticalAxisGroup.remove-empty = ##t",
          "kind": "property",
          "scope": "context",
          "desc": "Stops blank verse lines printing under instrumental staves.",
          "verified": true,
          "verification": "ok",
          "insert": "\\new Lyrics \\with {\n  \\override VerticalAxisGroup.remove-empty = ##t\n} \\lyricsto \"mel\" \\wordsOne\n",
          "note": "Correct grob is VerticalAxisGroup, and the property is remove-empty. LyricText.HideEmptyStaves is the intuitive guess and it does not exist: observed warning: the property 'HideEmptyStaves' does not exist (perhaps a typing error)."
        },
        {
          "id": "mensural-signs",
          "name": "Mensural signs",
          "syntax": "\\numericTimeSignature \time 4/4",
          "kind": "snippet",
          "scope": "note",
          "desc": "Common time and cut time can be written as C and cut-C on the staff rather than 4/4 and 2/2.",
          "verified": true,
          "verification": "ok",
          "insert": "\\time 4/4 ",
          "note": "Use \\time 4/4 in the input; the sign is a rendering choice."
        }
      ]
    },
    {
      "id": "layout",
      "title": "Layout & spacing",
      "blurb": "Three layers, and which one you need depends on the question. \\paper is the sheet, \\layout is the engraving, \\set is for a span.",
      "stats": {
        "total": 14,
        "verified": 12,
        "unprobed": 2
      },
      "entries": [
        {
          "id": "which-block",
          "name": "Paper vs layout vs set",
          "syntax": "\\paper { }  \\layout { }  \\set Staff.X = v",
          "kind": "note",
          "scope": "note",
          "desc": "The single most useful routing rule in LilyPond.",
          "verified": false,
          "verification": "unprobed",
          "note": "\\paper  = the physical sheet: size, margins, fonts, headers.\n\\layout = how music is engraved: staff size, spacing, line breaking.\n\\set    = a change that applies from here until it is undone.\n\\override = a change to one grob's appearance, with an optional span.",
          "gotchas": [
            "\\paper NEVER goes inside \\score. \\layout goes inside \\score (or at top level to affect every score)."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "set-paper-size",
          "name": "#(set-paper-size ...)",
          "syntax": "#(set-paper-size \"a4\")",
          "kind": "command",
          "scope": "paper",
          "desc": "Sheet size by name or by dimensions.",
          "verified": true,
          "verification": "ok",
          "insert": "#(set-paper-size \"a4\")\n",
          "note": "Names: a3 a4 a5 a6 b4 b5 letter legal tabloid ledger. Or use explicit dimensions like \"9 x 7 in\"."
        },
        {
          "id": "set-paper-size-dims",
          "name": "Paper size by dimension",
          "syntax": "paper-width = 9\\in   paper-height = 7\\in",
          "kind": "snippet",
          "scope": "paper",
          "desc": "Explicit sheet size as two properties.",
          "verified": true,
          "verification": "ok",
          "insert": "paper-width = 9\\in\npaper-height = 7\\in\n",
          "note": "Set the two \\paper properties directly. Neither of the set-paper-size spellings for custom sizes works in 2.26: #(set-paper-size \"9 x 7 in\") and #(set-paper-size \"9in x 7in\") both give warning: Unknown paper size, and #(set-paper-size 9 \\in 7 \\in) errors in Guile."
        },
        {
          "id": "margins",
          "name": "Margins",
          "syntax": "top-margin = 10\\mm   left-margin = 15\\mm",
          "kind": "property",
          "scope": "paper",
          "desc": "Distance from the paper edge. Units: \\mm \\cm \\in \\pt.",
          "verified": true,
          "verification": "ok",
          "insert": "left-margin = 15\\mm\ntop-margin = 10\\mm\n",
          "note": "The system-indent is measured from the left MARGIN, so a large indent plus a large margin can push music off the page."
        },
        {
          "id": "staff-size",
          "name": "#(layout-set-staff-size ...)",
          "syntax": "#(layout-set-staff-size 18)",
          "kind": "command",
          "scope": "layout",
          "desc": "Enlarge or shrink everything. The number is the interline distance in points.",
          "verified": true,
          "verification": "ok",
          "insert": "#(layout-set-staff-size 18)\n",
          "note": "16 is the default. This scales all other spacing proportionally, so fix it FIRST.",
          "gotchas": [
            "Set staff size before anything else; every other spacing value you then choose will be relative to it."
          ]
        },
        {
          "id": "system-indent",
          "name": "indent (first-system indent)",
          "syntax": "indent = 2\\cm",
          "kind": "property",
          "scope": "layout",
          "desc": "Left margin of the FIRST system only. Later systems start at zero.",
          "verified": true,
          "verification": "ok",
          "insert": "indent = 2\\cm\n",
          "note": "Measured from the left paper margin. In a multi-staff score each StaffGroup in the first system indents."
        },
        {
          "id": "short-indent",
          "name": "short-indent (consequent systems)",
          "syntax": "short-indent = 1\\cm",
          "kind": "property",
          "scope": "layout",
          "desc": "Left margin of every system after the first.",
          "verified": true,
          "verification": "ok",
          "insert": "short-indent = 1\\cm\n"
        },
        {
          "id": "ragged-last",
          "name": "ragged-last (justify all but the last line)",
          "syntax": "ragged-last = ##t",
          "kind": "property",
          "scope": "layout",
          "desc": "Do not stretch the final system of a section to full width.",
          "verified": true,
          "verification": "ok",
          "insert": "ragged-last = ##t\n"
        },
        {
          "id": "ragged-right",
          "name": "ragged-right",
          "syntax": "ragged-right = ##t",
          "kind": "property",
          "scope": "layout",
          "desc": "Never justify. Systems end wherever the music ends.",
          "verified": true,
          "verification": "ok",
          "insert": "ragged-right = ##t\n",
          "note": "Can make a single-staff score look badly ragged; prefer ragged-last."
        },
        {
          "id": "line-width",
          "name": "#(make-paper ..) or system-width",
          "syntax": "",
          "kind": "note",
          "scope": "layout",
          "desc": "You rarely set line width directly; control it with indent and the \\paper width.",
          "verified": false,
          "verification": "unprobed",
          "note": "Line breaking is automatic from the paper width minus margins minus indent. Forcing it with explicit \\break is a last resort.",
          "why": "no probe supplied"
        },
        {
          "id": "spacing-sections",
          "name": "\\newSpacingSection",
          "syntax": "\\newSpacingSection",
          "kind": "command",
          "scope": "score",
          "desc": "Start a visually separate block of music inside one score, between staves.",
          "verified": true,
          "verification": "ok",
          "insert": "\\newSpacingSection\n",
          "note": "Placed inside the << >> that holds the staves. \\newSpacingSection is the only *Section command in 2.26's own ly/ and scm/ files.",
          "gotchas": [
            "\\newSectionSystem does NOT exist in 2.26: error: unknown command: `\\newSectionSystem' (and a cascade of 'string outside of text script'). \\section and \\textSection also fail outside markup."
          ]
        },
        {
          "id": "text-marker",
          "name": "\\textMark",
          "syntax": "\\textMark \\markup { \"A\" }",
          "kind": "command",
          "scope": "music",
          "desc": "A rehearsal letter printed at a system boundary rather than over the music.",
          "verified": true,
          "verification": "ok",
          "insert": "\\textMark \\markup { \"A\" } "
        },
        {
          "id": "page-properties",
          "name": "Common \\paper properties",
          "syntax": "print-page-number = ##t   oddHeaderMarkup = ...",
          "kind": "property",
          "scope": "paper",
          "desc": "Page numbers and running headers use markup properties.",
          "verified": true,
          "verification": "ok",
          "insert": "print-page-number = ##t\n",
          "note": "print-first-page-number, print-all-pages, oddHeaderMarkup, evenHeaderMarkup, oddFooterMarkup."
        },
        {
          "id": "spacing-lists",
          "name": "Spacing vector properties",
          "syntax": "StaffGrouper.stretchability = #2",
          "kind": "property",
          "scope": "layout",
          "desc": "Each spacing property takes a numeric vector: the first value applies when tight, the second when loose.",
          "verified": true,
          "verification": "ok",
          "insert": "\\context {\n  \\Score\n  \\override SpacingSpanner.uniform-stretching = ##t\n}\n",
          "note": "The number before a spacing property means 'stretch this many times more when loose than when tight'. Do not set these first; fix staff size and indents, then adjust one spacing value at a time and look at the PNG."
        }
      ]
    },
    {
      "id": "tweaks",
      "title": "Tweaking & overrides",
      "blurb": "\\override Grob.property = value for engraving, \\set Context.property for behaviour. Change nothing until the PNG tells you what to change.",
      "stats": {
        "total": 19,
        "verified": 16,
        "unprobed": 3
      },
      "entries": [
        {
          "id": "override-shape",
          "name": "\\override",
          "syntax": "\\override NoteHead.color = #red",
          "kind": "command",
          "scope": "music",
          "desc": "Sets a property on a grob (a drawn object). This is the engraving tool.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override NoteHead.color = #red ",
          "note": "Affects every following NoteHead until reverted or the music ends."
        },
        {
          "id": "set-shape",
          "name": "\\set",
          "syntax": "\\set Staff.instrumentName = \"Vln.\"",
          "kind": "command",
          "scope": "music",
          "desc": "Sets a property on a CONTEXT. This is the behaviour tool.",
          "verified": true,
          "verification": "ok",
          "insert": "\\set Staff.instrumentName = \"Vln.\" ",
          "note": "Timing, naming, counting, MIDI and instrument settings all go through \\set."
        },
        {
          "id": "set-vs-override-rule",
          "name": "Which one?",
          "syntax": "\\set Context.x   vs   \\override Grob.y",
          "kind": "note",
          "scope": "note",
          "desc": "Decide by asking whether the thing is a drawing or a behaviour.",
          "verified": false,
          "verification": "unprobed",
          "note": "\\set     = Staff.instrumentName, Score.tempo, Voice.Strings, Timing.transposition, any midiInstrument\n\\override = NoteHead.color, Stem.length, StaffSymbol.line-count, LyricText.font-size\nIn \\layout both are written as \\override or \\set inside the block.",
          "why": "no probe supplied"
        },
        {
          "id": "set-on-grob-fails",
          "name": "\\set aimed at a grob fails",
          "syntax": "\\set NoteHead.color = #red   -- broken",
          "kind": "warning",
          "scope": "music",
          "desc": "The most common \\set/\\override confusion, and its exact 2.26 output.",
          "verified": true,
          "verification": "expected-failure",
          "note": "Observed on 2.26.0, two warnings, and the music still prints:\n  warning: cannot find or create context: NoteHead\n  warning: the property 'color' does not exist (perhaps a typing error)",
          "gotchas": [
            "It is a WARNING, not an error - the run completes and you get a PDF that ignores your change. Look at the PNG.",
            "Conversely \\override with a misspelled grob is a hard error: error: bad grob property path."
          ]
        },
        {
          "id": "revert",
          "name": "\\revert",
          "syntax": "\\override NoteHead.color = #red   \\override NoteHead.color = #black",
          "kind": "command",
          "scope": "music",
          "desc": "Returns a grob property to its default.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override NoteHead.color = #black ",
          "note": "\\revert is rarely needed; simply override again with the default value."
        },
        {
          "id": "tweak-op",
          "name": "\\tweak (one note only)",
          "syntax": "c4\\tweak color #red",
          "kind": "command",
          "scope": "music",
          "desc": "Attaches a property change to the single preceding note, without a global override.",
          "verified": true,
          "verification": "ok",
          "insert": "c4\\tweak color #red ",
          "note": "\\tweak is a standalone command placed AFTER the note, and it takes bare property/value pairs with NO '=' sign. Use it for one-offs; \\override when the change should last several notes.",
          "gotchas": [
            "CORRECTION to the skill's tweaking-and-internals.md, which shows c-\\tweak color #red. The hyphen form is a hard error on 2.26.0: error: post-event expected. Write c4\\tweak color #red.",
            "There is no standalone \\color or any other property command: \\color gives error: unknown command: `\\color'."
          ]
        },
        {
          "id": "tweak-dotted",
          "name": "\\tweak on a chord",
          "syntax": "<c e g>4\\tweak color #red",
          "kind": "snippet",
          "scope": "music",
          "desc": "Place \\tweak after the chord event; the change applies to that chord only.",
          "verified": true,
          "verification": "ok",
          "insert": "<c e g>4\\tweak color #red ",
          "note": "\\tweak attaches to the preceding music EVENT, so for a chord the whole chord is affected. It does not go inside the <>.",
          "gotchas": [
            "Putting \\tweak inside the angle brackets (<c e-\\tweak color #red g>4) is error: post-event expected on 2.26.0."
          ]
        },
        {
          "id": "span-commands",
          "name": "Span commands",
          "syntax": "\\override Stem.color = #red c4 d e f \\revert Stem.color g2",
          "kind": "note",
          "scope": "music",
          "desc": "An override followed by \\revert (or a later override) limits the change to a span.",
          "verified": true,
          "verification": "ok",
          "note": "This is how you colour one passage and not the whole piece."
        },
        {
          "id": "common-notehead",
          "name": "NoteHead properties",
          "syntax": "\\override NoteHead.duration-log = #2",
          "kind": "property",
          "scope": "music",
          "desc": "Turn quarters into diamonds, doubles into triangles, or black a note.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override NoteHead.duration-log = #2 ",
          "note": "duration-log = #2 diamonds, #3 double-diamond, #1 triangles. Also: color, style #'black, font-size, direction, note-names."
        },
        {
          "id": "common-stem",
          "name": "Stem properties",
          "syntax": "\\override Stem.length = #8",
          "kind": "property",
          "scope": "music",
          "desc": "Stem length, direction, thickness and colour.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override Stem.length = #8 ",
          "note": "Forcing stems on a single-voice staff: \\override Stem.neutral-direction = #UP"
        },
        {
          "id": "common-staffsymbol",
          "name": "StaffSymbol properties",
          "syntax": "\\override StaffSymbol.line-count = #5",
          "kind": "property",
          "scope": "music",
          "desc": "Line count and thickness. Useful for tablature and for staffless notation.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override StaffSymbol.line-count = #5 "
        },
        {
          "id": "common-script",
          "name": "Script grobs",
          "syntax": "\\override Script.color = #blue",
          "kind": "property",
          "scope": "music",
          "desc": "Script covers text scripts and dynamic marks attached to notes.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override Script.color = #blue "
        },
        {
          "id": "common-slurbeam",
          "name": "Slur and Beam properties",
          "syntax": "\\override Slur.color = #red   \\override Beam.gap = #4",
          "kind": "property",
          "scope": "music",
          "desc": "Slur: color thickness, direction. Beam: gap, thickness, slope, position.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override Beam.gap = #4 "
        },
        {
          "id": "common-time-signature",
          "name": "TimeSignature and Clef",
          "syntax": "\\override TimeSignature.color = #red",
          "kind": "property",
          "scope": "music",
          "desc": "Appearance of the meter and clef at a point in the music.",
          "verified": true,
          "verification": "ok",
          "insert": "\\override TimeSignature.color = #red "
        },
        {
          "id": "colors",
          "name": "Colours",
          "syntax": "#red #blue #darkcyan #(x11-color 'red)",
          "kind": "notation",
          "scope": "note",
          "desc": "Named basic colours: red green blue cyan magenta yellow white black darkgrey lightgrey.",
          "verified": true,
          "verification": "ok",
          "insert": "#red ",
          "note": "Custom: #(x11-color 'orange) or #(rgb-color 1 0.5 0). Colours do NOT appear in printed output unless a colour profile is defined in \\paper - that is advanced and usually not wanted."
        },
        {
          "id": "paper-colour-profile",
          "name": "colormaps / colour profiles",
          "syntax": "",
          "kind": "note",
          "scope": "paper",
          "desc": "Required before colour reaches print output.",
          "verified": false,
          "verification": "unprobed",
          "note": "In \\paper: #(define output-ps-file #f) plus a colormaps block. Skip this unless the user explicitly asks for coloured PDF; the default is black-and-white print and colour affects only the PNG preview.",
          "why": "no probe supplied"
        },
        {
          "id": "tweak-vs-override-choice",
          "name": "\\tweak or \\override?",
          "syntax": "c4\\tweak color #red   /   \\override NoteHead.color = #red",
          "kind": "note",
          "scope": "note",
          "desc": "One note or one-off: \\tweak. Several notes or a passage: \\override.",
          "verified": false,
          "verification": "unprobed",
          "note": "\\tweak needs no \\revert; an \\override without one leaks to the end of the block.",
          "why": "no probe supplied"
        },
        {
          "id": "layout-block-overrides",
          "name": "Overrides in \\layout and \\paper",
          "syntax": "\\layout { \\context { \\Score \\override MetronomeMark.font-size = #2 } }",
          "kind": "snippet",
          "scope": "layout",
          "desc": "The same override language applies inside \\layout and \\paper, nested in \\context blocks.",
          "verified": true,
          "verification": "ok",
          "insert": "\\context {\n  \\Score\n  \\override MetronomeMark.font-size = #2\n}\n",
          "note": "Global settings belong here so the music stays readable."
        },
        {
          "id": "examine",
          "name": "Looking up a property's legal values",
          "syntax": "\\override Stem.direction = #BOGUS",
          "kind": "note",
          "scope": "note",
          "desc": "Assign a nonsense value and 2.26 tells you the legal ones in a warning.",
          "verified": true,
          "verification": "expected-failure",
          "note": "This is the reliable way to avoid guessing. Observed on 2.26.0: warning: direction of grob Stem must be UP or DOWN; using UP (plus a Guile error on the bogus constant). Grep LilyPond's own share/ly/*.ly for existing usages of a property you are unsure of.",
          "gotchas": [
            "Omitting the value does NOT list them. \\override Stem (no value) gives error: bad grob property path.",
            "A misspelled PROPERTY is often ignored in silence - the log is the only way to notice."
          ]
        }
      ]
    },
    {
      "id": "scheme",
      "title": "Scheme & functions",
      "blurb": "LilyPond is a Scheme program. # and ## escape into it, #(...) reads a value at parse time, and {...} is music, not code.",
      "stats": {
        "total": 13,
        "verified": 10,
        "unprobed": 3
      },
      "entries": [
        {
          "id": "music-function",
          "name": "Music function",
          "syntax": "myAccent =\n#(define-music-function (note) (ly:music?)\n  #{ $note ^\\markup { \\bold \">\" } #})",
          "kind": "snippet",
          "scope": "top",
          "desc": "A Scheme function that returns music, so it can be called with plain LilyPond syntax.",
          "verified": true,
          "verification": "ok",
          "insert": "myAccent =\n#(define-music-function\n  (note)\n  (ly:music?)\n  #{ $note ^\\markup { \\bold \">\" } #})\n",
          "note": "THREE positional parts in 2.26: the argument list, a predicate per argument, then the body. There is no location argument and no '=', the name goes in front of the #(...). Inside the body, #{ ... $note ... } splices the music argument back into LilyPond syntax; that is what makes this readable.",
          "gotchas": [
            "The OLD (myFour location) form is gone. On 2.26.0 it fails at the #() with: Guile signaled an error for the expression beginning here / unknown location: syntax: bad `syntax' form in form syntax.",
            "You write myAccent = #(define-music-function ...) - the '=' and name are OUTSIDE the #(). A bare #(define-music-function ...) defines nothing usable and the call site then says error: unknown command: `\\myAccent'.",
            "Omitting the predicate list fails too: the second list is read as the predicates, not as the body.",
            "A docstring in the (_i \"...\") form is NOT accepted in the user-facing 2.26 syntax; it only appears inside LilyPond's own ly/music-functions-init.ly.",
            "Use the right predicate or the call fails with wrong type for argument 1: list? rejects music, ly:music? is what you want."
          ]
        },
        {
          "id": "scalar-function",
          "name": "Scalar function (no music)",
          "syntax": "#(define (double x) (* 2 x))",
          "kind": "snippet",
          "scope": "top",
          "desc": "An ordinary Scheme function, callable from \\paper, \\header and \\layout values.",
          "verified": true,
          "verification": "ok",
          "insert": "#(define (double x) (* 2 x))\n",
          "note": "Use it for any repeated computation: page sizes, note arrays, string manipulation.",
          "gotchas": [
            "A Scheme RESULT cannot carry a LilyPond unit. indent = #(double 2)\\cm and indent = #(double 2)\\mm both fail with error: syntax error, unexpected NUMBER_IDENTIFIER. Either return a bare number (indent = #(double 2) compiles clean - LilyPond reads a unitless number as a length in staff spaces) or return a string for something like #(set-paper-size (pick 2)).",
            "\\mm is not a Scheme variable either: (* 2 \\mm) inside #() is error: Guile signaled an error."
          ]
        },
        {
          "id": "define-macro",
          "name": "#(define-macro ...)",
          "syntax": "#(define-macro (twice location . args) (interpret-element 'twice location args))",
          "kind": "snippet",
          "scope": "top",
          "desc": "Expands LilyPond syntax into other LilyPond syntax before parsing.",
          "verified": false,
          "verification": "unprobed",
          "insert": "myMacro =\n#(define-macro (twice location . args)\n   (interpret-element 'twice location args))\n",
          "note": "For syntax shorthands, not for generating music. Use interpret-element to build the replacement.",
          "unprobed": "define-macro needs a concrete expansion to be worth verifying; the syntax above is the standard shape",
          "why": "define-macro needs a concrete expansion to be worth verifying; the syntax above is the standard shape"
        },
        {
          "id": "schemes-file",
          "name": "\\include or inline Scheme",
          "syntax": "#(begin (display \"hi\") (newline))",
          "kind": "snippet",
          "scope": "top",
          "desc": "Several Scheme expressions are wrapped in #(...) or #(begin ...).",
          "verified": true,
          "verification": "ok",
          "insert": "#(begin (display \"hi\") (newline))\n",
          "note": "#(...) is an expression. To run several, use #(begin ...) or separate #() lines."
        },
        {
          "id": "hash-one",
          "name": "# (one hash)",
          "syntax": "#red   #UP   #'(c e g)   #(x11-color 'orange)",
          "kind": "note",
          "scope": "note",
          "desc": "Reads one value from Scheme while parsing.",
          "verified": true,
          "verification": "ok",
          "note": "#red is Scheme's symbol red. #'(...) quotes a list so LilyPond does not evaluate it."
        },
        {
          "id": "hash-two",
          "name": "## (two hashes)",
          "syntax": "instrumentName = ##t",
          "kind": "note",
          "scope": "note",
          "desc": "Scheme's #t for true. Double-hash to avoid LilyPond stealing the #.",
          "verified": true,
          "verification": "ok",
          "note": "##t and ##f are the only booleans. A single # would be read as a music value."
        },
        {
          "id": "false-is-not-false",
          "name": "Only ##f is false",
          "syntax": "prop = ##f        (correct)        prop = #f        (wrong)",
          "kind": "note",
          "scope": "note",
          "desc": "Any non-##f value is true, including 0 and the empty list.",
          "verified": true,
          "verification": "ok",
          "gotchas": [
            "The very common mistake prop = #f evaluates #f as LilyPond music, which is a spurious note, not false."
          ]
        },
        {
          "id": "variables-by-type",
          "name": "Four kinds of variable",
          "syntax": "musicVar = \\relative c' { }   identifierVar = 3",
          "kind": "note",
          "scope": "top",
          "desc": "LilyPond holds music, identifiers, Scheme values and modules, and each is referenced differently.",
          "verified": true,
          "verification": "ok",
          "note": "music variable        melody = { ... }   used as \\melody\nidentifier variable   x = 4             used as \\x\nScheme variable       #(define x 4)     used as #x\nnumber                x = 4             used as #x\nModule                \\module { }       referenced with module-name:"
        },
        {
          "id": "music-in-scheme",
          "name": "Referencing music from Scheme",
          "syntax": "(ly:make-music (ly:parser-output-name location) '(c d e f))",
          "kind": "snippet",
          "scope": "top",
          "desc": "The low-level way to build music in Scheme. Rarely needed.",
          "verified": false,
          "verification": "unprobed",
          "insert": "(ly:make-music (ly:parser-output-name location) '(c d e f))\n",
          "note": "Use a music function with make-music instead; this is for people extending the parser itself.",
          "unprobed": "ly:make-music is internal API and its signature is not stable across versions",
          "why": "ly:make-music is internal API and its signature is not stable across versions"
        },
        {
          "id": "scheme-inside-scheme",
          "name": "#(...) vs {...}",
          "syntax": "",
          "kind": "note",
          "scope": "top",
          "desc": "The single most common LilyPond/Scheme confusion.",
          "verified": true,
          "verification": "ok",
          "note": "#(f x)  = call a Scheme FUNCTION and use its value.\n{ f x }  = LilyPond MUSIC. f is a note name or a command, not a call.\nTo build music in Scheme you go through make-music, not by writing { } in Scheme."
        },
        {
          "id": "display-and-debug",
          "name": "#(display ...) debugging",
          "syntax": "#(display \"x\") (newline)",
          "kind": "snippet",
          "scope": "top",
          "desc": "Print to the terminal. The fastest way to see what a Scheme function returned.",
          "verified": true,
          "verification": "ok",
          "insert": "#(begin (display \"x\") (newline))\n",
          "note": "Where the text goes depends on the phase: parser-time Scheme prints before 'Interpreting music...', engraver-time prints after.",
          "gotchas": [
            "Each Scheme call needs its own #(...). #(display \"x\") (newline) is a syntax error: the bare (newline) is read as LilyPond, giving error: syntax error, unexpected EVENT_IDENTIFIER. Put the whole thing inside one #(begin (display \"x\") (newline))."
          ]
        },
        {
          "id": "guile-modules",
          "name": "Loading a Scheme module",
          "syntax": "#(use-modules (ice-9 optargs))",
          "kind": "snippet",
          "scope": "top",
          "desc": "Import Guile or LilyPond Scheme modules before using their functions.",
          "verified": true,
          "verification": "ok",
          "insert": "#(use-modules (ice-9 optargs))\n",
          "note": "Built-in LilyPond Scheme modules: (lily duration), (lily pitch), (lily make-music), (lily parser-output-name-def), (lily i18n). Guile's own: (ice-9 optargs), (srfi srfi-1)."
        },
        {
          "id": "syntax-modules",
          "name": "\\module for custom input mode",
          "syntax": "\\module { notes = { ... } }",
          "kind": "snippet",
          "scope": "top",
          "desc": "Defines a new parser namespace, then referenced as name:key.",
          "verified": false,
          "verification": "unprobed",
          "insert": "\\module {\n  notes = { c d e f }\n}\n",
          "note": "Needed for \\chordmode, \\drummode and \\numerical mode. Only reach for it if you are writing a library, not a score.",
          "unprobed": "a custom module with no consumers is not a meaningful probe",
          "why": "a custom module with no consumers is not a meaningful probe"
        }
      ]
    },
    {
      "id": "cli",
      "title": "Command line & tools",
      "blurb": "How lilypond is invoked, which output formats exist, what the diagnostics look like, and the two companion tools. None of this is LilyPond source, so it is verified by running the command.",
      "stats": {
        "total": 21,
        "verified": 18,
        "unprobed": 3
      },
      "entries": [
        {
          "id": "default-output",
          "name": "Default invocation",
          "syntax": "lilypond song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Writes song.pdf next to the input. The simplest possible command.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond song.ly",
          "note": "Output goes next to the INPUT, not into the current directory."
        },
        {
          "id": "output-basename",
          "name": "-o FILE",
          "syntax": "lilypond -o out song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Output basename. The format suffix is added for you.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -o out song.ly",
          "note": "-o also accepts a FOLDER, in which case the input's basename is kept inside it (verified: -o some/dir on song.ly yields some/dir/song.pdf)."
        },
        {
          "id": "output-formats",
          "name": "Output formats",
          "syntax": "lilypond --pdf | --png | --svg | -E | --ps  song.ly",
          "kind": "note",
          "scope": "top",
          "desc": "Pick the format with a long flag. All five verified on 2.26.0.",
          "verified": false,
          "verification": "unprobed",
          "note": "--pdf -> x.pdf\n--png -> x.png\n--svg -> x.svg\n-E    -> x.eps AND x-1.eps (encapsulated PostScript)\n--ps  -> PostScript\nDefault with no flag is PDF.",
          "why": "no probe supplied"
        },
        {
          "id": "png-format",
          "name": "--png",
          "syntax": "lilypond --png song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Renders one PNG per page. The flag you want for a preview image.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond --png song.ly"
        },
        {
          "id": "svg-format",
          "name": "--svg",
          "syntax": "lilypond --svg song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Vector output, one file per page.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond --svg song.ly"
        },
        {
          "id": "eps-format",
          "name": "-E",
          "syntax": "lilypond -E song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Encapsulated PostScript, for dropping single pages into other documents.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -E song.ly",
          "note": "Produces BOTH e.eps and e-1.eps. Both were produced on 2.26.0."
        },
        {
          "id": "backend-options",
          "name": "-dOPTION=VALUE",
          "syntax": "lilypond -dresolution=90 -dcrop -dno-point-and-click song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Backend (Scheme) options. These do NOT appear in `lilypond --help`; list them with `-dhelp`.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -dresolution=90 -dcrop -dno-point-and-click song.ly",
          "note": "Verified present in `lilypond -dhelp` on 2.26.0:\n  preview (#f)               create preview images\n  crop (#f)                  cropped single-page output\n  resolution (101)           PNG resolution (DEFAULT IS 101, not 90)\n  point-and-click (#t)       clickable source links\n  anti-alias-factor (1)\nBecause they are invisible in --help, do not treat a missing --help\nhit as evidence a -d flag is fake. Check -dhelp."
        },
        {
          "id": "no-point-and-click",
          "name": "-dno-point-and-click",
          "syntax": "lilypond -dno-point-and-click song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Drops the coloured PDF boxes that link back to source lines.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -dno-point-and-click song.ly",
          "note": "Worth using for any PDF you intend to hand to someone."
        },
        {
          "id": "include-path",
          "name": "-I DIR",
          "syntax": "lilypond -I include song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Add a directory to the \\include search path.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -I include song.ly",
          "note": "In lilypond-book this is why you pass --process='lilypond -I include'."
        },
        {
          "id": "eval-scheme",
          "name": "-e EXPR",
          "syntax": "lilypond -e '(define x 1)' song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Evaluate a Scheme expression before parsing.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -e '(define x 1)' song.ly",
          "note": "Careful: lilypond's -e is \"evaluate Scheme\", but convert-ly's -e is \"--edit\" (upgrade in place). Same letter, opposite meaning."
        },
        {
          "id": "dump-header",
          "name": "-H FIELD",
          "syntax": "lilypond -H title song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Write one \\header field to its own file instead of typesetting.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -H title song.ly",
          "note": "Useful for driving a build from metadata without engraving anything."
        },
        {
          "id": "log-level",
          "name": "-l LOGLEVEL / -s / -V",
          "syntax": "lilypond -l WARN song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Control chatter.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond -l WARN song.ly",
          "note": "Levels, from `lilypond --help` on 2.26.0:\n  NONE  ERROR  WARN  BASIC  PROGRESS  INFO (default)  DEBUG\n-s is shorthand for -l ERROR.\n-V is shorthand for -l DEBUG.\n-l WARN is the right choice when you want warnings but no progress lines."
        },
        {
          "id": "diagnostic-format",
          "name": "Reading the log",
          "syntax": "song.ly:33:33: error: syntax error, unexpected \\lyrics",
          "kind": "note",
          "scope": "top",
          "desc": "The shape of every diagnostic: file, line, column, severity, message.",
          "verified": false,
          "verification": "unprobed",
          "note": "The column is not always there. 2.26 also emits:\n  song.ly:1: warning: no \\version statement found, please add\n  warning: identifier name is a keyword: `lyrics'\nAny log parser that requires file:line:col: will miss both.",
          "why": "no probe supplied"
        },
        {
          "id": "exit-codes",
          "name": "Exit codes",
          "syntax": "lilypond song.ly; echo $?",
          "kind": "note",
          "scope": "top",
          "desc": "lilypond itself: 0 on success, 1 when the file FAILED to build.",
          "verified": true,
          "verification": "expected-failure",
          "note": "VERIFIED, and this is the single most important gotcha in the whole toolchain: a file full of bar-check warnings still exits 0. Both probes below were run for real -- the warning case asserts exit 0 AND the presence of the warning text, the error case asserts exit 1.\nSo `lilypond f.ly && echo ok` does NOT mean the file is correct. Grep the log for the severity words, or use check_ly.sh.",
          "gotchas": [
            "check_ly.sh in this skill treats warnings as failures precisely because of this. It exits 0 clean, 1 on warnings, 2 on errors.",
            "Note the contrast with the compile path in this palette: the harness does NOT trust exit codes, because they cannot distinguish these two cases."
          ]
        },
        {
          "id": "error-exit-code",
          "name": "Errors DO exit nonzero",
          "syntax": "lilypond bad.ly; echo $?   ->  1",
          "kind": "note",
          "scope": "top",
          "desc": "The companion half of the trap: an unknown command is a hard exit 1 with no output file.",
          "verified": true,
          "verification": "expected-failure",
          "note": "So exit status catches errors but is completely blind to warnings."
        },
        {
          "id": "convert-ly",
          "name": "convert-ly",
          "syntax": "convert-ly --from=2.18.2 --to=2.26.0 old.ly > new.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Mechanically upgrades syntax across versions. Verified present at 2.26.0.",
          "verified": true,
          "verification": "ok",
          "copy": "convert-ly --from=2.18.2 --to=2.26.0 old.ly > new.ly",
          "note": "Flags confirmed via `convert-ly --help` on 2.26.0:\n  -f, --from=VERSION   source version [default: read from the file]\n  -t, --to=VERSION     target version [default: 2.26.0]\n  -e, --edit           upgrade IN PLACE\n  -n, --no-version     do not add a \\version line if missing\nRun this BEFORE hand-editing any file whose \\version predates 2.26."
        },
        {
          "id": "lilypond-book",
          "name": "lilypond-book",
          "syntax": "lilypond-book --format=latex --pdf doc.tex",
          "kind": "command",
          "scope": "top",
          "desc": "Typesets LilyPond snippets embedded in a document. Verified present at 2.26.0.",
          "verified": true,
          "verification": "ok",
          "copy": "lilypond-book --format=latex --pdf doc.tex",
          "note": "Flags confirmed via `lilypond-book --help` on 2.26.0:\n  -f, --format=FORMAT   texi (default), texi-html, latex, html, docbook\n  -F, --filter=FILTER   pipe snippets through FILTER [default: convert-ly -n -]\n      --process=CMD     command used to run each snippet\nSnippets live inside \\begin{lilypond} ... \\end{lilypond} blocks in the source.",
          "gotchas": [
            "The \\begin{lilypond} and \\end{lilypond} lines must each stand on their OWN line. All on one line is silently ignored: lilypond-book reports 'All snippets are up to date', compiles nothing, still exits 0, and the output .tex still contains the raw block.",
            "--latex-program=true is probe-only scaffolding, not part of the command. lilypond-book shells out to `latex` to auto-detect page settings; where no TeX is installed that step warns ('Unable to auto-detect default settings: latex: not found'). Pointing it at `true` keeps the probe about lilypond-book instead of about your TeX installation. On a machine with TeX Live the plain command is warning-free."
          ]
        },
        {
          "id": "check-script",
          "name": "check_ly.sh",
          "syntax": "./scripts/check_ly.sh song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "This skill's own gate: compiles, prints the log, and returns a verdict as the exit code.",
          "verified": true,
          "verification": "ok",
          "copy": "./scripts/check_ly.sh song.ly",
          "note": "Exit 0 = clean, 1 = warnings, 2 = errors.\nUse this rather than bare `lilypond`, because of the exit-0-on-warning trap above.",
          "gotchas": [
            "The 0/1/2 contract only holds for diagnostics WITH a file:line:col: prefix. Column-less warnings slip through as exit 0 -- see the next entry."
          ]
        },
        {
          "id": "check-script-blind-spot",
          "name": "check_ly.sh misses column-less warnings",
          "syntax": "check_ly.sh no-version.ly  ->  exit 0 (says OK)",
          "kind": "warning",
          "scope": "top",
          "desc": "The skill's own gate has the same blind spot the harness was fixed for: column-less warnings read as clean.",
          "verified": true,
          "verification": "expected-failure",
          "note": "VERIFIED on 2.26.0: a file with no \\version statement emits `warning: no \\version statement found` with no file:line:col: prefix, and check_ly.sh reports `RESULT: OK` with exit 0. Same for `identifier name is a keyword`. Its greps require `:[0-9]+:[0-9]+:` before the severity word, so both slip through.\nThis probe pins the buggy behavior: it passes only while check_ly.sh keeps saying OK here. If the script is ever fixed, this entry must be rewritten, not deleted -- the column-less shapes stay real."
        },
        {
          "id": "render-preview",
          "name": "render_preview.sh",
          "syntax": "./scripts/render_preview.sh song.ly",
          "kind": "command",
          "scope": "top",
          "desc": "Page-1 PNG plus PDF plus MIDI, compact enough to actually look at.",
          "verified": true,
          "verification": "ok",
          "copy": "./scripts/render_preview.sh song.ly",
          "note": "Internally runs -dpreview -dresolution=90 -dno-point-and-click."
        },
        {
          "id": "version-pin",
          "name": "Version pin",
          "syntax": "\\version \"2.26.0\"",
          "kind": "note",
          "scope": "top",
          "desc": "The skill pins 2.26.0 and every corpus entry is verified against exactly that.",
          "verified": false,
          "verification": "unprobed",
          "note": "Everything in this palette was compiled on GNU LilyPond 2.26.0 (running Guile 3.0). Syntax that works on another version is not guaranteed here, and several constructs the older manuals show are dead in 2.26 - see the 'Never emit' category.",
          "why": "no probe supplied"
        }
      ]
    },
    {
      "id": "never",
      "title": "Never emit",
      "blurb": "Not for inserting. These are constructs to avoid, each paired with the form that actually compiles on 2.26.0. Nothing in this category is insertable.",
      "stats": {
        "total": 27,
        "verified": 21,
        "unprobed": 6
      },
      "entries": [
        {
          "id": "how-to-read",
          "name": "How to read this",
          "syntax": "",
          "kind": "note",
          "scope": "note",
          "desc": "Each entry lists the BAD form and the GOOD form side by side, with the exact 2.26 diagnostic for the bad one.",
          "verified": false,
          "verification": "unprobed",
          "note": "Every 'bad' entry here was compiled to get that diagnostic, so the message is real rather than remembered. A warning rather than an error means LilyPond still produced output and you will not notice from the PDF alone.",
          "gotchas": [
            "Some of these do NOT fail at all -- they are accepted silently and quietly do nothing (see the removed-engravers entry)."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "keysignature",
          "name": "keySignature -> keyAlterations",
          "syntax": "\\set Score.keyAlterations = #`((6 . ,FLAT))",
          "kind": "note",
          "scope": "music",
          "desc": "The current key signature.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\override Score.keySignature -> error: bad grob property path.\nGOOD: \\set Score.keyAlterations = #`((6 . ,FLAT)) -> compiles clean.",
          "gotchas": [
            "It is a CONTEXT property, so it needs \\set, not \\override. The rename alone is not enough -- copy-pasting the new name into an \\override still fails.",
            "The value is an alist keyed by step number: #`((6 . ,FLAT)) is one flat, ((2 . ,SHARP)) is one sharp."
          ]
        },
        {
          "id": "whiteout",
          "name": "whiteout: BOTH names are dead",
          "syntax": "there is no working form",
          "kind": "warning",
          "scope": "note",
          "desc": "The skill's table says write \\whiteout-box instead of \\whiteout. Neither exists in 2.26.0.",
          "verified": true,
          "verification": "expected-failure",
          "note": "VERIFIED both on 2.26.0:\n  c4\\whiteout      -> error: unknown command: `\\whiteout'\n  c4\\whiteout-box  -> error: unknown command: `\\whiteout-box'\nCORRECTION to version-differences.md.",
          "gotchas": [
            "Why the table is wrong: convertrules.py rule (2,19,22) renames whiteout -> whiteout-box, and rule (2,19,32) renames it BACK. Applied in version order they cancel, which is why convert-ly --from=2.19.21 --to=2.26.0 leaves `\\whiteout' in place -- producing a file that still does not compile.",
            "Also: grepping 2.26's ly/*.ly for `whiteout' matches only stencil-whiteout-if-style-set, a Scheme helper. There is no music-level command.",
            "If you need a whiteout effect, do it in Scheme on a stencil, not with a note post-event."
          ]
        },
        {
          "id": "chordnamevoice",
          "name": "ChordNameVoice -> ChordNames",
          "syntax": "\\new ChordNames << \\new Voice { ... } >>",
          "kind": "note",
          "scope": "score",
          "desc": "The context that carries chord names above the staff.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\new ChordNameVoice -> warning: cannot create context: ChordNameVoice.\nGOOD: \\new ChordNames -> compiles clean.",
          "gotchas": [
            "Note it is a WARNING, not an error, so the run completes and you get chord names missing rather than a build failure."
          ]
        },
        {
          "id": "autochange",
          "name": "autochange -> autoChange",
          "syntax": "c4\\autoChange { d e f }",
          "kind": "note",
          "scope": "music",
          "desc": "Auto-octave-change notation for guitar/harp.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: error: unknown command: `\\autochange'. GOOD: compiles clean."
        },
        {
          "id": "partcombine",
          "name": "partcombine -> partCombine",
          "syntax": "\\partCombine { c4 d }",
          "kind": "note",
          "scope": "music",
          "desc": "Merges two parts onto one staff by pitch.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: error: unknown command: `\\partcombine'. GOOD: compiles clean."
        },
        {
          "id": "fermata-markup",
          "name": "fermataMarkup -> fermata",
          "syntax": "c4\\fermata",
          "kind": "note",
          "scope": "music",
          "desc": "The fermata sign.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: error: unknown command: `\\fermataMarkup'. GOOD: compiles clean."
        },
        {
          "id": "compress-bars",
          "name": "compressFullBarRests -> compressEmptyMeasures",
          "syntax": "\\compressEmptyMeasures",
          "kind": "note",
          "scope": "music",
          "desc": "Collapses consecutive empty measures into one.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: error: unknown command: `\\compressFullBarRests'. GOOD: compiles clean."
        },
        {
          "id": "rest-duration",
          "name": "\\rest \"4.\" -> \\rest {4.}",
          "syntax": "\\rest {4.}",
          "kind": "note",
          "scope": "music",
          "desc": "A multi-character rest duration needs braces.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: c4\\rest \"4.\" -> error: string outside of text script or \\lyricmode.\nGOOD: c4\\rest {4.} -> compiles clean (and is a dotted HALF = 6 sixteenths, not 3).",
          "gotchas": [
            "Braces, not quotes, and note the value: \\rest {4.} fills half a 4/4 bar, so it does not pair with a surrounding c4 in the same bar."
          ]
        },
        {
          "id": "defaultbartype",
          "name": "defaultBarType -> measureBarType",
          "syntax": "\\set Score.measureBarType = \"\"",
          "kind": "note",
          "scope": "music",
          "desc": "Suppresses the barline at a measure boundary.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\set Score.defaultBarType = \"\" -> warning: the property 'defaultBarType' does not exist.\nGOOD: \\set Score.measureBarType = \"\" -> compiles clean."
        },
        {
          "id": "markformatter",
          "name": "markFormatter -> rehearsalMarkFormatter",
          "syntax": "\\set Score.rehearsalMarkFormatter = #ly:text-interface::print",
          "kind": "note",
          "scope": "music",
          "desc": "How \\textMark rehearsal letters are rendered.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\set Score.markFormatter = ... -> warning: the property 'markFormatter' does not exist.\nGOOD: \\set Score.rehearsalMarkFormatter = ... -> compiles clean."
        },
        {
          "id": "glyph-name-alist",
          "name": "glyph-name-alist -> alteration-glyph-name-alist",
          "syntax": "\\override Accidental.alteration-glyph-name-alist = #'((32 . \"...\"))",
          "kind": "note",
          "scope": "music",
          "desc": "Maps alterations to glyph names.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\override Accidental.glyph-name-alist -> warning: the property 'glyph-name-alist' does not exist.\nGOOD: \\override Accidental.alteration-glyph-name-alist -> compiles clean."
        },
        {
          "id": "featherdurations",
          "name": "\\featherDurations takes a fraction now",
          "syntax": "\\featherDurations 1/2",
          "kind": "note",
          "scope": "music",
          "desc": "Lengthens notes slightly to force better spacing.",
          "verified": false,
          "verification": "unprobed",
          "note": "The old \\featherDurations #(ly:make-moment 1/2) STILL COMPILES CLEAN on 2.26.0 -- this is a stylistic deprecation, not a removal. Prefer the plain fraction.",
          "gotchas": [
            "Verified: both the Scheme and the fraction form compile clean, so nothing warns you to change it."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "bar-dash",
          "name": "\\bar \"-\" is NOT deprecated",
          "syntax": "\\bar \"\"",
          "kind": "note",
          "scope": "music",
          "desc": "The table says \\bar \"-\" became \\bar \"\". Both compile clean on 2.26.0.",
          "verified": false,
          "verification": "unprobed",
          "note": "VERIFIED: \\bar \"-\" -> clean, \\bar \"\" -> clean. Nothing warns. Use \\bar \"\" as the table advises because it is clearer, but this row is not a correctness issue.",
          "gotchas": [
            "This is one of three rows where the table overstates the change. See the summary entry at the bottom."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "roman-markup",
          "name": "\\roman -> \\serif (markup)",
          "syntax": "\\markup \\serif { Allegro }",
          "kind": "note",
          "scope": "markup",
          "desc": "The roman/serif font selector in markup.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\markup \\roman { ... } -> error: unknown command: `\\roman'.\nGOOD: \\markup \\serif { ... } -> compiles clean.\nThe markup must be reached through a markup context: a text script (c4-\\markup \\serif { Allegro }) or \\header."
        },
        {
          "id": "font-family-roman",
          "name": "font-family = #'roman is accepted SILENTLY",
          "syntax": "\\override LyricText.font-family = #'serif",
          "kind": "warning",
          "scope": "music",
          "desc": "Unlike the markup \\roman, this deprecated value still compiles with no warning at all.",
          "verified": false,
          "verification": "unprobed",
          "note": "VERIFIED: font-family = #'roman and font-family = #'serif BOTH compile clean on 2.26.0.\n2.26's own property doc (define-grob-properties.scm:361) lists only serif, sans and typewriter.",
          "gotchas": [
            "font-family is declared (font-family ,symbol? ...) with no value validation, so ANY symbol is accepted -- including a dead one. It will not warn and will not error; it just selects a font family that does not exist and the text falls back.",
            "That makes it MORE dangerous than the forms that error, because nothing tells you. Use #'serif."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "single-digit",
          "name": "single-digit -> TimeSignature.style",
          "syntax": "\\override TimeSignature.style = #'single-number",
          "kind": "note",
          "scope": "music",
          "desc": "The meter was renamed, but it is a grob STYLE value, not a boolean.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\set Score.single-digit = ##t -> warning: the property 'single-digit' does not exist.\nGOOD: \\override TimeSignature.style = #'single-number -> compiles clean.\nCORRECTION: the table's \\set Score.single-number = ##t is ALSO wrong -- single-number is not a property either. In 2.26 it is one of the time-signature STYLE symbols (time-signature-settings.scm:972), alongside 'numbered and mensural."
        },
        {
          "id": "compoundmeter",
          "name": "compoundMeter -> timeAbbrev",
          "syntax": "\\timeAbbrev #'((3 4))",
          "kind": "note",
          "scope": "music",
          "desc": "Abbreviated (additive) meters.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\time 4/4 \\compoundMeter -> error: unknown command: `\\compoundMeter'.\nGOOD: \\timeAbbrev #'((4 4)) -> compiles clean.\ntimeAbbrev is a music function taking a PAIR or a list of triples: #'((3 1 8) (2 4)) means (3+1)/8 + 2/4, and 3,2,8 abbreviates (3+2)/8."
        },
        {
          "id": "percent-shorthand",
          "name": "percent shorthand -> \\repeat percent",
          "syntax": "c4\\repeat percent 3 { d e }",
          "kind": "note",
          "scope": "music",
          "desc": "The c4\\% { ... } shorthand was removed in 2.25.35.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: c4\\% { d e } f -> error: wrong type for argument 1. Expecting number, found (make-music ...). \\% is now a valid but DIFFERENT command, so it fails at type-check rather than with 'unknown command' -- which is a confusing message for a rename.\nGOOD: c4\\repeat percent 3 { d e } -> compiles clean. Note the required COUNT argument."
        },
        {
          "id": "star-shorthand",
          "name": "star shorthand -> \\repeat unfold",
          "syntax": "c4\\repeat unfold 2 { d e }",
          "kind": "note",
          "scope": "music",
          "desc": "The c4\\* { ... } shorthand was removed in 2.25.35.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: c4\\* { d e } f -> error: wrong type for argument 1. Expecting number.\nGOOD: c4\\repeat unfold 2 { d e } -> compiles clean. Note the required COUNT argument."
        },
        {
          "id": "german-chords",
          "name": "\\norwegianChords is GONE; \\semiGermanChords is correct",
          "syntax": "\\semiGermanChords",
          "kind": "note",
          "scope": "chordmode",
          "desc": "The table lists both directions of this swap, which is confusing; 2.26.0 keeps only one.",
          "verified": true,
          "verification": "expected-failure",
          "note": "VERIFIED on 2.26.0:\n  \\semiGermanChords  -> compiles clean\n  \\norwegianChords   -> error: unknown command: `\\norwegianChords'\nThe swap was applied (2,25,35 semiGerman->norwegian) then UNDONE (2,25,80 norwegian->semiGerman), so the end state is \\semiGermanChords.",
          "gotchas": [
            "Run convert-ly --from=2.25.79 --to=2.26.0 on a file using \\norwegianChords and it correctly emits \\semiGermanChords, which compiles. Trust convert-ly here over the table."
          ]
        },
        {
          "id": "enablepolymeter",
          "name": "enablePolymeter -> enablePerStaffTiming",
          "syntax": "\\layout { \\enablePerStaffTiming }",
          "kind": "note",
          "scope": "layout",
          "desc": "Polymeter with unaligned measures.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\override Score.enablePolymeter = ##t -> error: bad grob property path.\nGOOD: \\layout { \\enablePerStaffTiming } -> compiles clean.\nCORRECTION: the table's \\override Score.enablePerStaffTiming = ##t is wrong. enablePerStaffTiming is a void FUNCTION (context-mods-init.ly:90), not a property, so you \\set nothing -- you call it. In music it fails with error: Not in an output definition.",
          "gotchas": [
            "It goes inside \\layout, not in the music and not as an \\override."
          ]
        },
        {
          "id": "ellipsis-direction",
          "name": "ellipsis-direction -> passage-direction",
          "syntax": "\\override OptionalMaterialBracket.passage-direction = #LEFT",
          "kind": "note",
          "scope": "music",
          "desc": "Which side of a bracket a passage delimiter sits on.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\override Score.ellipsis-direction -> error: bad grob property path.\nGOOD: \\override OptionalMaterialBracket.passage-direction -> compiles clean.\nCORRECTION: the table's \\override Score.passage-direction is also wrong. passage-direction is a property of the passage-delimiter GROBS (define-grob-properties.scm:1637), not of the Score context -- \\set Score.passage-direction warns that the property does not exist."
        },
        {
          "id": "bottom-space",
          "name": "bottom-space -> bottom-padding",
          "syntax": "\\override PaperColumn.line-break-system-details.bottom-padding = #2",
          "kind": "note",
          "scope": "layout",
          "desc": "Distance from the page bottom to the lowest staff.",
          "verified": true,
          "verification": "expected-failure",
          "note": "BAD: \\override Score.BarNumber.bottom-space = #2 -> warning: the property 'bottom-space' does not exist.\nGOOD: \\override PaperColumn.line-break-system-details.bottom-padding = #2 -> compiles clean.\nCORRECTION: bottom-padding is a SUBPROPERTY of PaperColumn's line-break-system-details (define-grob-properties.scm:703), not a BarNumber property. Both the table's owner and its spelling are wrong."
        },
        {
          "id": "instrument-name",
          "name": "instrument -> instrumentName",
          "syntax": "\\set Staff.instrumentName = \"Vln.\"",
          "kind": "note",
          "scope": "music",
          "desc": "The full instrument name printed before the staff.",
          "verified": false,
          "verification": "unprobed",
          "note": "BAD: \\set Staff.instrument = \"Vln.\" -> compiles but sets nothing useful; in 2.26 'instrument' is not a Score/Staff property and is silently ignored.\nGOOD: \\set Staff.instrumentName -> compiles and prints.\nThe short form is \\set Staff.shortInstrumentName.",
          "gotchas": [
            "Unlike most rows in this category this one fails SILENTLY -- no warning at all, the name just does not appear."
          ],
          "why": "no probe supplied"
        },
        {
          "id": "removed-engravers",
          "name": "Removed engravers are ignored, NOT rejected",
          "syntax": "\\remove Note_swallow_translator",
          "kind": "warning",
          "scope": "context",
          "desc": "The skill says \\remove lines naming these error out. On 2.26.0 they compile clean.",
          "verified": true,
          "verification": "ok",
          "note": "VERIFIED -- all four compile clean with no diagnostic:\n  \\remove Note_swallow_translator\n  \\remove Rest_swallow_translator\n  \\remove Default_bar_line_engraver\n  \\remove Mark_tracking_translator\nCORRECTION to version-differences.md section 4, which says such lines 'error out'.",
          "gotchas": [
            "This is the dangerous case in the whole category: a stale \\remove is not an error, so a converted old file looks fine and quietly behaves differently. Delete these lines rather than relying on the compiler to tell you.",
            "Consequence for \\consists too: a stale \\consists of a removed engraver is likewise ignored."
          ]
        },
        {
          "id": "wrong-in-the-table",
          "name": "Summary: rows the skill's table gets wrong",
          "syntax": "",
          "kind": "note",
          "scope": "note",
          "desc": "If you only remember one entry from this category, make it this one.",
          "verified": false,
          "verification": "unprobed",
          "note": "Seven of version-differences.md's rows do not survive contact with 2.26.0.\n1. whiteout -> whiteout-box: BOTH are dead. The rename was reverted by convertrules rule (2,19,32).\n2. single-digit -> \\set Score.single-number = ##t: both wrong. It is \\override TimeSignature.style = #'single-number.\n3. compoundMeter -> timeAbbrev: right name, but the table gives no argument; timeAbbrev takes #'((4 4)) or 4,4.\n4. enablePolymeter -> \\override Score.enablePerStaffTiming = ##t: wrong. It is \\layout { \\enablePerStaffTiming }, a void function.\n5. ellipsis-direction -> \\override Score.passage-direction: wrong owner. It is OptionalMaterialBracket.passage-direction.\n6. bottom-space -> \\override ... .bottom-padding: wrong owner. It is PaperColumn.line-break-system-details.bottom-padding.\n7. Section 4 (removed engravers 'error out'): they are ignored silently.\nPlus two rows that overstate the change: \\bar \"-\" and \\featherDurations #(ly:make-moment x/y) both still compile clean.\nRoot cause: the table lists rename RULES individually. Several were later reverted, so applying the rules IN VERSION ORDER gives a different answer than reading them as a flat table.",
          "gotchas": [
            "When the table and the compiler disagree, the compiler wins. Use convert-ly --from=<old> --to=2.26.0 as the oracle, then compile the result -- that is exactly what this category was built by.",
            "This is also the strongest argument for the never-invert rule: five of these seven errors are invisible at the source level and would have shipped as silently wrong files."
          ],
          "why": "no probe supplied"
        }
      ]
    },
    {
      "id": "templates",
      "title": "Whole scores",
      "blurb": "Complete starting points, not fragments. Inserting one replaces the editor contents. All seven compile clean on 2.26.0.",
      "stats": {
        "total": 7,
        "verified": 7,
        "unprobed": 0
      },
      "entries": [
        {
          "id": "drum-part",
          "name": "Drum part",
          "syntax": "Drum part  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "A groove on a DrumStaff using \\drummode.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% Drum groove on a DrumStaff using \\drummode.\n%% Drum note names used below: bd (bass drum), sn (snare),\n%% hh (closed hi-hat), hho (open hi-hat), cymc (crash), r (rest).\n%% Add \\midi { } and a DrumStaff with default instrument name for playback.\n\n\\header {\n  title = \"Drum groove\"\n  composer = \"D. Drummer\"\n}\n\n\\score {\n  \\new DrumStaff \\with {\n    instrumentName = \"Drums\"\n  } <<\n    \\new DrumVoice {\n      \\drummode {\n        \\time 4/4\n        bd4 sn hh bd |\n        hh8 hh hh hh sn4 hho |\n        cymc4 bd sn8 sn sn sn |\n        hh4 hh bd sn |\n      }\n    }\n  >>\n  \\layout { }\n  \\midi { }\n}",
          "note": "Note names are instruments, not pitches. Only DrumStaff is a creatable drum context.",
          "gotchas": [
            "Verify every drum name by compiling it -- an unknown name is an error, and the plausible guesses (ride, crash, cyc) are all rejected in 2.26."
          ]
        },
        {
          "id": "guitar-tab",
          "name": "Guitar with tablature",
          "syntax": "Guitar with tablature  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "Standard notation above a TabStaff carrying the same line, with a bend and a slide.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% Guitar with tablature: standard notation on top, tab staff below,\n%% same music in both (TabStaff transposes to tab automatically).\n%% A bend and a slide are shown for illustration.\n\n\\header {\n  title = \"Guitar & tab\"\n  composer = \"G. Composer\"\n}\n\nmusic = \\relative c' {\n  \\time 4/4\n  e4 < a c e> d8 c b a |\n  c4\\glissando d gis\\bendAfter #4 <g b d>4 |\n}\n\n\\score {\n  \\new StaffGroup <<\n    \\new Staff \\with {\n      instrumentName = \"Guitar\"\n    } {\n      \\clef \"G_8\"\n      \\music\n    }\n    \\new TabStaff \\with {\n      instrumentName = \"Tab\"\n      stringTunings = \\stringTuning <e, a, d g b e'>\n    } {\n      \\music\n    }\n  >>\n  \\layout { }\n  \\midi { }\n}",
          "note": "Two contexts in one << >>: a TabStaff for the frets and a Staff for the notation. The tab voices the standard notation automatically.",
          "gotchas": [
            "Tablature is written pitch + TWO numbers after the duration: \\string then \\fret. e'\\2\\3 is fret 3 on string 2.",
            "One number alone compiles but warns about recalculating the string."
          ]
        },
        {
          "id": "lead-sheet",
          "name": "Lead sheet",
          "syntax": "Lead sheet  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "Melody plus chord symbols plus lyrics, in one system.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% Lead sheet: melody + chord symbols + lyrics.\n%% Reader note: the melody Voice must have a NAME (\"mel\") so that\n%% \\lyricsto can attach lyrics to exactly that voice, and the same\n%% melody must be reused for MIDI, so keep it in a variable.\n\n\\header {\n  title = \"Lead sheet\"\n  subtitle = \"melody + chords + lyrics\"\n  composer = \"A. Composer\"\n  poet = \"Lyrics by B. Writer\"\n}\n\nmelody = \\relative c'' {\n  \\key c \\major\n  \\time 4/4\n  c4 d e f | g2 a4 g | f e d c | g'2 r2 |\n}\n\nharmony = \\chordmode {\n  \\time 4/4\n  c1 | g:7 | f | c |\n}\n\nwordsOne = \\lyricmode {\n  This is the lead -- sheet test, four bars long.\n}\n\n\\score {\n  <<\n    \\new ChordNames \\harmony\n    \\new Voice = \"mel\" { \\melody }\n    \\new Lyrics \\lyricsto \"mel\" \\wordsOne\n  >>\n  \\layout { }\n  \\midi { }\n}",
          "note": "Needs three contexts stacked in one << >>: a named Voice for the melody, \\new ChordNames for the symbols, and \\new Lyrics bound to the melody's name.",
          "gotchas": [
            "Reuse the same melody variable for the layout and the MIDI block, or the two will drift apart.",
            "Chord symbols need an explicit duration or the bar check fails -- write c1:maj7, not c:maj7."
          ]
        },
        {
          "id": "multi-movement-book",
          "name": "Multi-movement book",
          "syntax": "Multi-movement book  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "Several \\bookpart blocks inside one \\book, each with its own subtitle.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% Multi-movement book: several \\bookpart blocks, each with its own\n%% subtitle, wrapped in one \\book so all movements share a page setup.\n%% Each \\score carries both \\layout and \\midi.\n\n\\header {\n  title = \"A small suite\"\n  composer = \"Suite. Composer\"\n}\n\nmovementOne = \\relative c' {\n  \\time 4/4\n  c4 d e f | g2 a4 g | f2 e4 d | c2 r2 |\n}\n\nmovementTwo = \\relative c' {\n  \\time 3/4\n  g4 a b | c2 d4 | e2 c4 | d2. |\n}\n\n\\book {\n  \\bookpart {\n    \\header { subtitle = \"I. Moderato\" }\n    \\score {\n      \\new Staff \\movementOne\n      \\layout { }\n      \\midi { }\n    }\n  }\n\n  \\bookpart {\n    \\header { subtitle = \"II. Lento\" }\n    \\score {\n      \\new Staff \\movementTwo\n      \\layout { }\n      \\midi { }\n    }\n  }\n}",
          "note": "One \\book means one shared \\paper setup for every movement. Each \\score still needs both \\layout and \\midi.",
          "gotchas": [
            "With more than one \\bookpart, page numbers need (add-book-part-markup) or the numbering restarts confusingly."
          ]
        },
        {
          "id": "piano-grand-staff",
          "name": "Piano, grand staff",
          "syntax": "Piano, grand staff  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "Right hand over left hand on a PianoStaff, with dynamics, pedal and MIDI.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% Piano grand staff: right hand + left hand on a PianoStaff,\n%% with dynamics, pedal, and a midi block.\n%% Note: notes entered \\relative c (each staff's base octave differs);\n%% each hand goes in its own named Staff so \\change Staff etc. can find them.\n\n\\header {\n  title = \"Piano\"\n  subtitle = \"grand staff\"\n  composer = \"C. Composer\"\n}\n\nupper = \\relative c'' {\n  \\time 4/4\n  \\dynamicUp\n  c4 e g c | g2 e4 c | g'4\\ff e c g | c2 r2 |\n}\n\nlower = \\relative c {\n  \\clef bass\n  c'2 e | g e | c a, | c r |\n}\n\n\\score {\n  \\new PianoStaff <<\n    \\new Staff = \"up\" { \\upper }\n    \\new Staff = \"down\" { \\lower }\n  >>\n  \\layout { }\n  \\midi { }\n}\n\n%% Sustain pedal (verified 2.26 syntax): attach \\sustainOn / \\sustainOff\n%% to notes inside either staff.\npedalScore = {\n  \\new PianoStaff <<\n    \\new Staff = \"up\" {\n      \\relative c'' { c4\\sustainOn d e g <c, f a>1\\sustainOff }\n    }\n    \\new Staff = \"down\" {\n      \\clef bass \\relative c { c2 d e1 }\n    }\n  >>\n}",
          "note": "Both hands are entered \\relative c, not c', because the two staves have different base octaves. Each hand gets its own named Staff.",
          "gotchas": [
            "Pedal markings come from the SustainPedal grob and need \\sustainOn / \\sustainOff, not \\pianoPedal."
          ]
        },
        {
          "id": "satb-lyrics",
          "name": "SATB hymn with lyrics",
          "syntax": "SATB hymn with lyrics  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "S and A share a staff, T and B share another, each voice with its own lyric line.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% SATB hymn with lyrics: soprano and alto share a staff,\n%% tenor and bass share a staff; each voice gets its own lyrics.\n%% The \\voiceOne / \\voiceTwo marks set stems/directions per voice.\n\n\\header {\n  title = \"SATB hymn\"\n  composer = \"H. Composer\"\n}\n\nglobal = {\n  \\key g \\major\n  \\time 4/4\n}\n\nsoprano = \\relative c'' { g4 a b c | d2 b | g4 a b c | d2 r2 }\nalto = \\relative c' { d4 fis g a | b2 g | d4 fis g a | b2 r2 }\ntenor = \\relative c' { b4 c d e | fis2 d | b4 c d e | fis2 r2 }\nbass = \\relative c { g4 a b c | b2 g | g4 a b c | g2 r2 }\n\nsopranoWords = \\lyricmode { A men, A men, a -- men. }\naltoWords   = \\lyricmode { A men, A men, a -- men. }\ntenorWords  = \\lyricmode { A men, A men, a -- men. }\nbassWords   = \\lyricmode { A men, A men, a -- men. }\n\n\\score {\n  \\new ChoirStaff <<\n    \\new Staff = \"sa\" <<\n      \\clef treble\n      \\new Voice = \"soprano\" { \\voiceOne \\global \\soprano }\n      \\new Voice = \"alto\"    { \\voiceTwo \\global \\alto }\n    >>\n    \\new Lyrics \\lyricsto \"soprano\" \\sopranoWords\n    \\new Lyrics \\lyricsto \"alto\" \\altoWords\n    \\new Staff = \"tb\" <<\n      \\clef \"treble_8\"\n      \\new Voice = \"tenor\" { \\voiceOne \\global \\tenor }\n      \\new Voice = \"bass\"  { \\voiceTwo \\global \\bass }\n    >>\n    \\new Lyrics \\lyricsto \"tenor\" \\tenorWords\n    \\new Lyrics \\lyricsto \"bass\" \\bassWords\n  >>\n  \\layout { }\n  \\midi { }\n}",
          "note": "\\voiceOne .. \\voiceFour assign stem direction and collision behaviour per voice, and each Lyrics context is bound with \\lyricsto to one named Voice.",
          "gotchas": [
            "A Lyrics context must name its Voice, or \\lyricsto cannot attach and you get a silently unattached verse."
          ]
        },
        {
          "id": "string-quartet",
          "name": "String quartet",
          "syntax": "String quartet  (whole file)",
          "kind": "template",
          "scope": "top",
          "desc": "Four independent staves in a StaffGroup, viola on alto clef, cello on bass clef.",
          "verified": true,
          "verification": "ok",
          "insert": "\\version \"2.26.0\"\n%% String quartet: four independent staves in a StaffGroup,\n%% each with an instrument name. Viola uses alto clef, cello bass clef.\n\n\\header {\n  title = \"String quartet\"\n  composer = \"L. van Beethoven\"\n}\n\nviolinI = \\relative c'' { c2 d4 e | f2 e | d4 c b a | g1 }\nviolinII = \\relative c' { a2 b4 c | d2 c | b4 a gis a | b1 }\nviola = \\relative c' { e2 fis4 g | a2 g | fis4 e d dis | e1 }\ncello = \\relative c, { c2 b4 a | d2 c | b4 c d e | c1 }\n\n\\score {\n  \\new StaffGroup <<\n    \\new Staff \\with { instrumentName = \"Violin I\" } \\violinI\n    \\new Staff \\with { instrumentName = \"Violin II\" } \\violinII\n    \\new Staff \\with { instrumentName = \"Viola\" }\n      { \\clef alto \\viola }\n    \\new Staff \\with { instrumentName = \"Cello\" }\n      { \\clef bass \\cello }\n  >>\n  \\layout { indent = 2\\cm }\n  \\midi { }\n}",
          "note": "The baseline for any multi-part score. Each part is a named music variable; \\new Staff = \"name\" is what lets \\change Staff and \\lyricsto find things later."
        }
      ]
    }
  ]
};
