// Lyric input mode, attaching to voices, hyphens and melismas, stanzas.
// Source: references/lyrics-and-vocal.md, examples/10-lyrics-align.ly.

module.exports = {
  id: "lyrics",
  title: "Lyrics & singing",
  blurb:
    "Lyrics attach to a NAMED voice via \\lyricsto. Syllables take " +
    "durations like notes, so the syllable count must match the note count " +
    "exactly or everything downstream shifts.",
  entries: [
    {
      id: "lyricmode",
      name: "\\lyricmode",
      syntax: "wordsOne = \\lyricmode { Three4 blind mice2 }",
      kind: "command",
      scope: "top",
      desc: "Lyric input mode. A number after a syllable sets how many notes it spans.",
      insert: "wordsOne = \\lyricmode {\n  Three4 blind mice2\n}\n",
      note: "Never name the variable `lyrics` - it is reserved.",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { Three4 blind mice2 }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "lyricsto",
      name: "\\lyricsto (use this, not \\addlyrics)",
      syntax: '\\new Lyrics \\lyricsto "mel" \\wordsOne',
      insert: "\\new Lyrics \\lyricsto \"mel\" \\wordsOne\n",
      kind: "command",
      scope: "score",
      desc: "Binds lyrics to a named voice's rhythm exactly.",
      note:
        "\\addlyrics attaches to whatever precedes it and misaligns the " +
        "moment the music changes. Prefer \\lyricsto in every file you write.",
      gotchas: ["\\addlyrics after a << >> block attaches to the wrong voice."],
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { Three4 blind mice2 }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "hyphens",
      name: "-- hyphen and __ extender",
      syntax: "mel -- o -- dy __",
      kind: "notation",
      scope: "lyricmode",
      desc: "-- draws a hyphen between syllables, __ draws an extender line across a melisma.",
      insert: "mel -- o -- dy __",
      note: "One -- per syllable break, with spaces around it. __ goes after the word, not after the syllable.",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { This is the mel -- o -- dy __ test. }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "melisma",
      name: "Melisma (one syllable, several notes)",
      syntax: "dy2",
      insert: "dy2 ",
      kind: "notation",
      scope: "lyricmode",
      desc: "A number after the syllable stretches it over that many notes.",
      note: "Works only inside a \\lyricmode block, not on a bare word.",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { Three4 blind mice2 }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "skip",
      name: "_ (skip a note)",
      syntax: "glo -- _ ri -- a",
      insert: "glo -- _ ri -- a ",
      kind: "notation",
      scope: "lyricmode",
      desc: "Consumes one note without printing a syllable. Use when the word has fewer syllables than the melody has notes.",
      note: "Count syllables against notes exactly. A mismatch shifts every following word.",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { glo -- _ ri -- a4 }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "stanzas",
      name: "Several stanzas",
      syntax: '\\new Lyrics \\lyricsto "mel" \\verseOne   \\new Lyrics \\lyricsto "mel" \\verseTwo',
      kind: "snippet",
      scope: "score",
      desc: "One Lyrics context per stanza, all bound to the same voice.",
      insert:
        '\\new Lyrics \\lyricsto "mel" \\verseOne\n\\new Lyrics \\lyricsto "mel" \\verseTwo',
      note: 'Stanza numbers live in the variable name or \\set Lyrics.stanza = "1."',
      probeFull:
        '\\version "2.26.0"\nverseOne = \\lyricmode { Three4 blind mice2 }\nverseTwo = \\lyricmode { Sharp4 keen the blind mice }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\verseOne\n    \\new Lyrics \\lyricsto "mel" \\verseTwo\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "quotes",
      name: "Quoted punctuation",
      syntax: '"I" am so lone -- "ly,"',
      kind: "note",
      scope: "lyricmode",
      desc: "Quote punctuation that belongs to the word.",
      note: "Unquoted glued punctuation (ly,) changes how the word hyphenates.",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { "I" am so lone -- "ly," }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
    {
      id: "lyric-counting",
      name: "Syllable vs note counting",
      syntax: "8 notes in the melody, 8 syllables in the words",
      kind: "note",
      scope: "lyricmode",
      desc: "The rule behind every lyric misalignment: one syllable per note unless you say otherwise.",
      note:
        "A mismatch produces NO error. The PNG shows the words under the " +
        "wrong notes. Recompile after every verse edit and read the score.",
      probeFull:
        '\\version "2.26.0"\nwordsOne = \\lyricmode { Three4 blind mice2 }\n\\score {\n  <<\n    \\new Voice = "mel" { \\relative c\' { \\time 4/4 c4 d e f | g2 a4 g | } }\n    \\new Lyrics \\lyricsto "mel" \\wordsOne\n  >>\n  \\layout { }\n}\n',
    },
  ],
};