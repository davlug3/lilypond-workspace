# Scheme and music functions

Contents: # and $ · quoting · define-music-function ·
define-scheme-function · define-event-function · safe Guile patterns.

## 1. Embedding: `#` evaluates, `$` inserts

```lilypond
#(define shout "forte")          % Scheme definition at top level
\markup { $shout }               % $ inserts the value back into LilyPond
\override NoteHead.color = #red  % # evaluates Scheme inline
```

`#` runs Scheme where LilyPond expects a value. `$name` pastes a
Scheme variable into LilyPond code. `##t`/`##f` are booleans,
`#'symbol` a symbol, `#"string"` a string.

## 2. Quoting rules (where models break)

- `'()` empty list, `'x` quoted symbol — data, not evaluated.
- `#(quote x)` is the explicit form of `'x`.
- `#{ ... #}` embeds LilyPond code inside Scheme; `$var` inside it
  substitutes a Scheme value into the music.
- Never mix levels: Scheme parentheses `()` inside LilyPond music
  without `#{ #}` is a syntax error, and vice versa.

## 3. define-music-function (returns music)

2.26 shape — parser/location are implicit; list args, then predicates:

```lilypond
myAccent =
#(define-music-function
  (note)
  (ly:music?)
  #{ $note ^\markup { \bold ">" } #})

\relative c' { \myAccent c4 d e f }
```

This compiles (verified). A music function must return *music* —
returning `\markup` from one is `error: music function cannot return`.
Common predicates: `ly:music?`, `markup?`, `string?`, `number?`,
`integer?`, `boolean?`, `ly:duration?`, `ly:pitch?`.

## 4. define-scheme-function (returns values)

```lilypond
greet =
#(define-scheme-function
  (name)
  (string?)
  (string-append "Hello, " name))
```

Use for computing strings, numbers, lists — not for emitting notes.

## 5. define-event-function (post-events without direction)

```lilypond
dyn =
#(define-event-function
  (arg)
  (markup?)
  (make-dynamic-script arg))

\relative c' { c'\dyn pfsss }
```

An event function attaches like `-`/`^` articulations but needs no
direction indicator. Reach for it for custom dynamics and ornaments.

## 6. Safe Guile patterns

- Compute at the top, use in the music: `#(define n 4)`, then `$n`.
- `#{ $music #}` round-trips music through Scheme for transforms.
- `\applyMusic`, `\applyOutput`, `\applyContext` map procedures over
  music, layout, and context state — copy the call shape from the
  Extending manual example, never from memory.
- `define-markup-command` adds `\markup` commands; its argument list
  ends with the markup body — read the Extending example first.

## 7. Gotchas

- Arity mismatch (`define-music-function` called with the wrong number
  of args) fails at the call site, far from the definition — count args.
- `#` where LilyPond expects music, or music where Scheme expects a
  value: both are immediate syntax errors. Keep the two levels
  visually separate with `#{ #}` blocks.
- Guile 3.0 ships with 2.26: prefer `define`, `lambda`, `map`,
  `string-append`; avoid exotic macros.
