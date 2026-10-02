export function registerLilypond(monaco: any) {
  const languages = monaco.languages;

  try {
    languages.register({
      id: "lilypond",
      extensions: [".ly", ".ily"],
      aliases: ["LilyPond", "lilypond"],
      mimetypes: ["text/x-lilypond"],
    });
  } catch (_e) {
    // already registered
  }

  // Command groups get distinct token scopes so structural blocks,
  // context constructors, music setters, and dynamics/voices read
  // differently at a glance.
  const STRUCTURAL = "version|include|header|score|paper|book|bookpart|layout|midi|book";
  const CONTEXT = "new|context|with|consists|consistsCopy|consistsOnly|remove|consistsSet|alias";
  const MUSICSET = "relative|absolute|transpose|clef|key|time|tempo|mark|bar|partial|repeat|break|fine|segno|repeatBreak|unfoldRepeats";
  const MODE = "lyricmode|chordmode|drummode|figuresmode|markup|markupMode";
  const DYNAMICS = "voiceOne|voiceTwo|voiceThree|voiceFour|p|mp|mf|f|ff|fff|pp|ppp|crescendo|decrescendo";

  languages.setMonarchTokensProvider("lilypond", {
    defaultToken: "",
    tokenizer: {
      root: [
        // % ... comment
        [/%[^\n]*/, "comment"],
        // "quoted string"
        [/"[^"]*"/, "string"],
        // structural commands: \version, \include, \score, \header, ...
        [new RegExp(`\\\\(${STRUCTURAL})\\b`), "keyword"],
        // context constructors: \new, \context, \with, ...
        [new RegExp(`\\\\(${CONTEXT})\\b`), "type"],
        // music setters: \relative, \clef, \time, \key, \tempo, ...
        [new RegExp(`\\\\(${MUSICSET})\\b`), "function"],
        // mode switches: \lyricmode, \chordmode, \drummode, ...
        [new RegExp(`\\\\(${MODE})\\b`), "constant"],
        // dynamics & voice directions: \voiceOne, \p, \f, ...
        [new RegExp(`\\\\(${DYNAMICS})\\b`), "variable"],
        // any other \\command
        [/\\[^\s]*/, "keyword"],

        // pure numbers (4, 8, 16, ...)
        [/\d+/, "number"],

        // Braces / brackets / operators
        [/\{/, "delimiter.curly"],
        [/\}/, "delimiter.curly"],
        [/\(/, "delimiter.parenthesis"],
        [/\)/, "delimiter.parenthesis"],
        [/\[/, "delimiter.square"],
        [/\]/, "delimiter.square"],
        [/<<|>>/, "operator"],
        [/[_~!+-\/|'=]/, "operator"],

        // identifiers and literals in this lock of notation
        [/[a-zA-Z0-9_-]+/, "identifier"],
      ],
    },
  });

  languages.setLanguageConfiguration("lilypond", {
    comments: {
      lineComment: "%",
    },
    brackets: [
      ["{", "}"],
      ["(", ")"],
      ["[", "]"],
    ],
    autoClosingPairs: [
      { open: '"', close: '"' },
      { open: "{", close: "}" },
      { open: "(", close: ")" },
      { open: "[", close: "]" },
    ],
  });

  const FALLBACK = [
    "version",
    "header",
    "score",
    "include",
    "layout",
    "midi",
    "paper",
    "book",
    "bookpart",
    "name",
    "title",
    "subtitle",
    "composer",
    "tagline",
    "subject",
    "date",
    "relative",
    "absolute",
    "voiceOne",
    "voiceTwo",
    "voiceThree",
    "voiceFour",
    "time",
    "key",
    "tempo",
    "repeat",
    "bar",
    "partial",
    "clef",
    "transpose",
    "new",
    "with",
    "staff",
    "staffgroup",
    "pianostaff",
    "chordnames",
    "lyrics",
    "lyricmode",
    "chordmode",
    "drummode",
    "figuresmode",
    "lyricsto",
    "addlyrics",
    "figuremode",
    "markup",
    "mark",
    "partcombine",
    "merge",
    "override",
    "once",
    "revert",
    "set",
    "unset",
    "context",
    "sequential",
    "simultaneous",
    "autoAccidentals",
    "compressEmptyMeasures",
    "quoteDuring",
    "indent",
    "ragged-right",
    "raggedbottom",
    "paper-width",
    "line-width",
  ];
  try {
    languages.registerCompletionItemProvider("lilypond", {
      triggerCharacters: ["\\"],
      provideCompletionItems: () => {
        const keywords = FALLBACK.map((kw: string) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          documentation: `LilyPond command \\\\${kw}`,
        }));
        const SNIPPETS: { label: string; insertText: string; detail: string }[] = [
          { label: "relative", insertText: "relative c' {\n\t$0\n}", detail: "\relative c' { … } block" },
          { label: "score", insertText: "score {\n\t$0\n\t\\layout { }\n\t\\midi { }\n}", detail: "\\score { … } block" },
          { label: "new Staff", insertText: "new Staff {\n\t$0\n}", detail: "\\new Staff { … }" },
          { label: "new PianoStaff", insertText: "new PianoStaff <<\n\t\\new Staff = \"upper\" $1\n\t\\new Staff = \"lower\" $2\n>>", detail: "PianoStaff context" },
          { label: "new DrumStaff", insertText: "new DrumStaff {\n\t$0\n}", detail: "DrumStaff context" },
          { label: "new Voice", insertText: "new Voice = \"${1:v1}\" {\n\t$0\n}", detail: "Named voice" },
          { label: "new Lyrics", insertText: "new Lyrics \\lyricsto \"${1:v1}\" $2", detail: "Lyrics block" },
          { label: "header", insertText: "header {\n\ttitle = \"$1\"\n\tcomposer = \"$2\"\n}", detail: "\\header { … }" },
          { label: "include", insertText: "include \"${1:file.ily}\"", detail: "\\include file" },
          { label: "version", insertText: "version \"2.24.4\"", detail: "LilyPond version" },
          { label: "repeat volta", insertText: "repeat volta 2 {\n\t$0\n}", detail: "Repeat block" },
          { label: "with", insertText: "with {\n\tinstrumentName = \"$1\"\n}", detail: "\\with { … }" },
          { label: "lyricmode", insertText: "lyricmode {\n\t$0\n}", detail: "Lyrics mode" },
          { label: "chordmode", insertText: "chordmode {\n\t$0\n}", detail: "Chord mode" },
          { label: "drummode", insertText: "drummode {\n\t$0\n}", detail: "Drum mode" },
          { label: "paper", insertText: "paper {\n\t$0\n}", detail: "\\paper { … }" },
          { label: "layout", insertText: "layout {\n\t$0\n}", detail: "\\layout { … }" },
          { label: "midi block", insertText: "midi {\n\t\\tempo 4 = ${1:120}\n}", detail: "\\midi { … }" },
        ];
        const snippets = SNIPPETS.map((s) => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: s.insertText,
          insertTextRule: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: s.detail,
          documentation: s.detail,
        }));
        return { suggestions: [...keywords, ...snippets] };
      },
    });
  } catch (_e) {
    // silently ignore if already registered
  }
}
