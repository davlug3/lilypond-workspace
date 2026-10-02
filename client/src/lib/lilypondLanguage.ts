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

  languages.setMonarchTokensProvider("lilypond", {
    defaultToken: "",
    tokenizer: {
      root: [
        // % ... comment
        [/%[^\n]*/, "comment"],
        // "quoted string"
        [/"[^"]*"/, "string"],
        // \\ backslash command (\\version, \\relative, \\time ...)
        [/\\\\[^\s]*/, "keyword"],

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
        const suggestions = FALLBACK.map((kw: string) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          documentation: `LilyPond command \\\\${kw}`,
        }));
        return { suggestions };
      },
    });
  } catch (_e) {
    // silently ignore if already registered
  }
}
