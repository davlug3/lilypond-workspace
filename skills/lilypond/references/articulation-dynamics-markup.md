# Articulation, dynamics, markup

Contents: articulations · dynamics/hairpins · slur family · ornaments ·
text scripts · markup commands · fonts.

## 1. Articulations (attach after the note)

```lilypond
c4-. c4-^ c4-_ c4-!    % staccato, marcato-ish, tenuto-ish, accent-ish
c4-- c4-+              % tenuto, stopped
c4\staccato c4\tenuto c4\marcato c4\accent
c4\espressivo c4\portato
c2\fermata
c4\upbow c4\downbow     % strings
c4\open c4\stopped c4\harmonic
```

Direction: `-` auto, `^` force up, `_` force down (`c4-^`,
`c4-_`). Flip colliding scripts with `^`/`_` before recompiling.

## 2. Dynamics and hairpins

```lilypond
c4\p d\mp e\mf f\f |
g4\pp\< a b c\! |
g2\ff r2\fermata |
```

Letters: `\ppp \pp \p \mp \mf \f \ff \fff \sf \sfz \fp \rfz`.
Hairpins: `\<` crescendo, `\>` diminuendo, `\!` terminate.
Every hairpin MUST end with `\!` (or the next dynamic) — an unterminated
hairpin warns and spans to the movement's end.
Full example: `examples/11-articulations-dynamics.ly`.

## 3. Slurs, phrasing slurs, breaths

```lilypond
c( d e f)        % slur
g\( a b c\)      % phrasing slur (structural)
e4 d c b |
c2 r2 \breathe   % breath mark after the bar's music
```

`\slurUp` / `\slurDown` / `\slurNeutral` control placement.
Falls and doits: `\bendAfter`, `c\fall`, `c\doit` for jazz winds.

## 4. Ornaments, glissando, trills, arpeggio

```lilypond
c4\prall d\mordent e\trill f\turn |
c4\glissando d |
<e g c>1\arpeggio |
\pitchedTrill c4\startTrillSpan d \stopTrillSpan c4 |
```

`\grace`-family ornaments before the note; `\trill`/`\mordent` after.
Glissando connects two pitches with a line — both notes must exist.

## 5. Text on notes

```lilypond
c4^\markup { \bold "forte" \italic "molto" }
g1^\markup \center-column { "two lines" \small "of text" }
```

`^` above, `_` below, `-` auto. Full example:
`examples/12-markup-annotations.ly`.

## 6. Markup commands (the ~60 that matter)

Fonts: `\bold \italic \underline \small \normalsize \large \huge
\fontsize #2 \sans \serif \typewriter \with-color #red`.
Layout: `\column \center-column \left-column \right-column \concat
\line \fill-line \justified-line \pad-around #1 \box \circle`.
Music: `\musicglyph #"scripts.segno" \note #"4" #1 \rest #"4"
\clef \key \time \beam \slur \tuplet \dynamic`.
Structure: `\markuplist \table \column-lines`.
Each takes `{ }` or a value: `\fontsize #+3 { text }`,
`\with-color #red { text }`.

## 7. Fonts

```lilypond
\paper {
  fonts = #(make-pango-font-tree "DejaVu Serif" "DejaVu Sans" "DejaVu Sans Mono" 1)
}
```

Three families (serif/sans/mono) plus scaling factor. Changing the
*notation* font is a separate, advanced step — leave Emmentaler alone
unless asked.

## 8. Gotchas

- `\fermata` on a rest: `r2\fermata` works; bare `\fermata` alone does not.
- Hairpin without `\!`: spans to end of piece, warning issued.
- `\markup` inside music needs `^`, `_`, or `-` to attach; bare
  `\markup` at top level makes a standalone text block instead.
- Ornament before vs after the note: `\grace`/`\acciaccatura` go
  *before*, `\trill`/`\mordent` go *after*.
