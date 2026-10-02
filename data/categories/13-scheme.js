// Scheme inside LilyPond: #, ##, #(...) vs {...}, music functions,
// variables of each type, and the encapsulation rules that actually bite.
// Source: references/scheme-music-functions.md.

module.exports = {
  id: "scheme",
  title: "Scheme & functions",
  blurb:
    "LilyPond is a Scheme program. # and ## escape into it, #(...) reads " +
    "a value at parse time, and {...} is music, not code.",
  entries: [
    {
      id: "music-function",
      name: "Music function",
      syntax:
        "myAccent =\n" +
        "#(define-music-function (note) (ly:music?)\n" +
        "  #{ $note ^\\markup { \\bold \">\" } #})",
        insert: "myAccent =\n#(define-music-function\n  (note)\n  (ly:music?)\n  #{ $note ^\\markup { \\bold \">\" } #})\n",
      kind: "snippet",
      scope: "top",
      desc: "A Scheme function that returns music, so it can be called with plain LilyPond syntax.",
      note:
        "THREE positional parts in 2.26: the argument list, a predicate " +
        "per argument, then the body. There is no location argument and " +
        "no '=', the name goes in front of the #(...). Inside the body, " +
        "#{ ... $note ... } splices the music argument back into " +
        "LilyPond syntax; that is what makes this readable.",
      gotchas: [
        "The OLD (myFour location) form is gone. On 2.26.0 it fails at the #() with: Guile signaled an error for the expression beginning here / unknown location: syntax: bad `syntax' form in form syntax.",
        "You write myAccent = #(define-music-function ...) - the '=' and name are OUTSIDE the #(). A bare #(define-music-function ...) defines nothing usable and the call site then says error: unknown command: `\\myAccent'.",
        "Omitting the predicate list fails too: the second list is read as the predicates, not as the body.",
        "A docstring in the (_i \"...\") form is NOT accepted in the user-facing 2.26 syntax; it only appears inside LilyPond's own ly/music-functions-init.ly.",
        "Use the right predicate or the call fails with wrong type for argument 1: list? rejects music, ly:music? is what you want.",
      ],
      probeFull:
        '\\version "2.26.0"\nmyAccent =\n#(define-music-function\n  (note)\n  (ly:music?)\n  #{ $note ^\\markup { \\bold ">" } #})\n\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 \\myAccent c4 d e f | g2 r2 | } }\n  \\layout { }\n}\n',
    },
    {
      id: "scalar-function",
      name: "Scalar function (no music)",
      syntax: "#(define (double x) (* 2 x))",
      insert: "#(define (double x) (* 2 x))\n",
      kind: "snippet",
      scope: "top",
      desc: "An ordinary Scheme function, callable from \\paper, \\header and \\layout values.",
      note: "Use it for any repeated computation: page sizes, note arrays, string manipulation.",
      gotchas: [
        "A Scheme RESULT cannot carry a LilyPond unit. indent = #(double 2)\\cm and indent = #(double 2)\\mm both fail with error: syntax error, unexpected NUMBER_IDENTIFIER. Either return a bare number (indent = #(double 2) compiles clean - LilyPond reads a unitless number as a length in staff spaces) or return a string for something like #(set-paper-size (pick 2)).",
        "\\mm is not a Scheme variable either: (* 2 \\mm) inside #() is error: Guile signaled an error.",
      ],
      probeFull:
        '\\version "2.26.0"\n#(define (pick n) (if (> n 1) "a4" "letter"))\n\\paper {\n  #(set-paper-size (pick 2))\n}\n\\score { \\new Staff { \\time 4/4 c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "define-macro",
      name: "#(define-macro ...)",
      syntax: "#(define-macro (twice location . args) (interpret-element 'twice location args))",
      insert: "myMacro =\n#(define-macro (twice location . args)\n   (interpret-element 'twice location args))\n",
      kind: "snippet",
      scope: "top",
      desc: "Expands LilyPond syntax into other LilyPond syntax before parsing.",
      note: "For syntax shorthands, not for generating music. Use interpret-element to build the replacement.",
      unprobed: "define-macro needs a concrete expansion to be worth verifying; the syntax above is the standard shape",
    },
    {
      id: "schemes-file",
      name: "\\include or inline Scheme",
      syntax: "#(begin (display \"hi\") (newline))",
      insert: "#(begin (display \"hi\") (newline))\n",
      kind: "snippet",
      scope: "top",
      desc: "Several Scheme expressions are wrapped in #(...) or #(begin ...).",
      note: "#(...) is an expression. To run several, use #(begin ...) or separate #() lines.",
      probeFull:
        '\\version "2.26.0"\n#(begin (display "generating\\n") (newline))\n\\score { \\new Staff { \\time 4/4 c4 d e f | g2 r2 | } \\layout { } }\n',
    },
    {
      id: "hash-one",
      name: "# (one hash)",
      syntax: "#red   #UP   #'(c e g)   #(x11-color 'orange)",
      kind: "note",
      scope: "note",
      desc: "Reads one value from Scheme while parsing.",
      note: "#red is Scheme's symbol red. #'(...) quotes a list so LilyPond does not evaluate it.",
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 \\override NoteHead.color = #(x11-color \'red) c4 d e f | g2 r2 | } }\n  \\layout { }\n}\n',
    },
    {
      id: "hash-two",
      name: "## (two hashes)",
      syntax: "instrumentName = ##t",
      kind: "note",
      scope: "note",
      desc: "Scheme's #t for true. Double-hash to avoid LilyPond stealing the #.",
      note: "##t and ##f are the only booleans. A single # would be read as a music value.",
      probeFull:
        '\\version "2.26.0"\n\\paper { #(set-paper-size "a4") }\n\\score {\n  <<\n    \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } }\n  >>\n  \\layout { #(layout-set-staff-size 16) }\n}\n',
    },
    {
      id: "false-is-not-false",
      name: "Only ##f is false",
      syntax: "prop = ##f        (correct)        prop = #f        (wrong)",
      kind: "note",
      scope: "note",
      desc: "Any non-##f value is true, including 0 and the empty list.",
      gotchas: [
        "The very common mistake prop = #f evaluates #f as LilyPond music, which is a spurious note, not false.",
      ],
      probeFull:
        '\\version "2.26.0"\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } }\n  \\layout { indent = 0\\cm }\n}\n',
    },
    {
      id: "variables-by-type",
      name: "Four kinds of variable",
      syntax: "musicVar = \\relative c' { }   identifierVar = 3",
      kind: "note",
      scope: "top",
      desc: "LilyPond holds music, identifiers, Scheme values and modules, and each is referenced differently.",
      note:
        "music variable        melody = { ... }   used as \\melody\n" +
        "identifier variable   x = 4             used as \\x\n" +
        "Scheme variable       #(define x 4)     used as #x\n" +
        "number                x = 4             used as #x\n" +
        "Module                \\module { }       referenced with module-name:",
      probeFull:
        '\\version "2.26.0"\nmelody = \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | }\nidentifierVar = 4\n#(define schemeVar 4)\n\\score { \\new Staff { \\melody } \\layout { indent = \\identifierVar } }\n',
    },
    {
      id: "music-in-scheme",
      name: "Referencing music from Scheme",
      syntax: "(ly:make-music (ly:parser-output-name location) '(c d e f))",
      insert: "(ly:make-music (ly:parser-output-name location) '(c d e f))\n",
      kind: "snippet",
      scope: "top",
      desc: "The low-level way to build music in Scheme. Rarely needed.",
      note: "Use a music function with make-music instead; this is for people extending the parser itself.",
      unprobed: "ly:make-music is internal API and its signature is not stable across versions",
    },
    {
      id: "scheme-inside-scheme",
      name: "#(...) vs {...}",
      kind: "note",
      scope: "top",
      desc: "The single most common LilyPond/Scheme confusion.",
      note:
        "#(f x)  = call a Scheme FUNCTION and use its value.\n" +
        "{ f x }  = LilyPond MUSIC. f is a note name or a command, not a call.\n" +
        "To build music in Scheme you go through make-music, not by writing { } in Scheme.",
      probeFull:
        '\\version "2.26.0"\n#(define (double x) (* 2 x))\n\\score { \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } } \\layout { indent = #(double 2) } }\n',
    },
    {
      id: "display-and-debug",
      name: "#(display ...) debugging",
      syntax: '#(display "x") (newline)',
      insert: "#(begin (display \"x\") (newline))\n",
      kind: "snippet",
      scope: "top",
      desc: "Print to the terminal. The fastest way to see what a Scheme function returned.",
      note:
        "Where the text goes depends on the phase: parser-time Scheme " +
        "prints before 'Interpreting music...', engraver-time prints after.",
      gotchas: [
        "Each Scheme call needs its own #(...). #(display \"x\") (newline) is a syntax error: the bare (newline) is read as LilyPond, giving error: syntax error, unexpected EVENT_IDENTIFIER. Put the whole thing inside one #(begin (display \"x\") (newline)).",
      ],
      probeFull:
        '\\version "2.26.0"\n#(begin (display "parser phase") (newline))\n\\score {\n  \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 } }\n  \\layout { }\n}\n#(begin (display "trailing phase") (newline))\n',
    },
    {
      id: "guile-modules",
      name: "Loading a Scheme module",
      syntax: "#(use-modules (ice-9 optargs))",
      insert: "#(use-modules (ice-9 optargs))\n",
      kind: "snippet",
      scope: "top",
      desc: "Import Guile or LilyPond Scheme modules before using their functions.",
      note:
        "Built-in LilyPond Scheme modules: (lily duration), (lily pitch), " +
        "(lily make-music), (lily parser-output-name-def), (lily i18n). " +
        "Guile's own: (ice-9 optargs), (srfi srfi-1).",
      probeFull:
        '\\version "2.26.0"\n#(use-modules (ice-9 optargs))\n#(define (f . args) (length args))\n\\score { \\new Staff { \\relative c\' { \\time 4/4 c4 d e f | g2 r2 | } } \\layout { } }\n',
    },
    {
      id: "syntax-modules",
      name: "\\module for custom input mode",
      syntax: "\\module { notes = { ... } }",
      insert: "\\module {\n  notes = { c d e f }\n}\n",
      kind: "snippet",
      scope: "top",
      desc: "Defines a new parser namespace, then referenced as name:key.",
      note:
        "Needed for \\chordmode, \\drummode and \\numerical mode. Only " +
        "reach for it if you are writing a library, not a score.",
      unprobed: "a custom module with no consumers is not a meaningful probe",
    },
  ],
};