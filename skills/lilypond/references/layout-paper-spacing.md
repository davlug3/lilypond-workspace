# Layout, paper, spacing

Contents: paper block · sizes/margins · staff size · breaks ·
vertical/horizontal spacing · fit-on-page recipe.

## 1. The \paper block (top level only)

```lilypond
\paper {
  #(set-paper-size "a4")
  left-margin = 18\mm
  right-margin = 18\mm
  top-margin = 15\mm
  bottom-margin = 15\mm
  indent = 20\mm
  short-indent = 10\mm
}
```

`\paper` never goes inside `\score`. Lengths take `\mm \cm \in \pt`.

## 2. Paper sizes

`a6 a5 a4 a3 letter legal tabloid quarto 11x17` plus `"a4landscape"`.
Set globally or per book:

```lilypond
\paper { #(set-paper-size "a4") }
```

Two-sided printing: `two-sided = ##t`. Page numbers:
`print-page-number = ##t`, `print-first-page-number = ##t`.
Headers/footers: `oddHeaderMarkup`, `evenHeaderMarkup`,
`oddFooterMarkup`, `evenFooterMarkup`.

## 3. Staff size

```lilypond
#(set-global-staff-size 18)      % whole file, before any \score
```

```lilypond
\layout {
  #(layout-set-staff-size 16)    % this score only
}
```

Default is 20 (staff-space units in disguise: 20pt staff height).
Smaller number = smaller staves = more music per page.

## 4. Line and page breaks

```lilypond
c4 d e f | \break
g4 a b c' | \pageBreak
c''1 \noBreak
```

`\break` forces a line break after the bar, `\pageBreak` a page break,
`\noBreak` forbids one. Break control belongs in the music, spacing
amounts in `\paper`/`\layout` — keep the two apart.

## 5. Vertical spacing (systems on the page)

```lilypond
\paper {
  system-system-spacing.basic-distance = #12
  top-system-spacing.basic-distance = #14
  last-bottom-spacing.basic-distance = #12
  ragged-last-bottom = ##f
}
```

`basic-distance` sets the gap; `ragged-last-bottom = ##f` stretches the
last page full height. `systems-per-page` and `max-system-count` cap
density. Tune one variable, recompile, look at the PNG.

## 6. Horizontal spacing (notes in the bar)

```lilypond
\layout {
  \context {
    \Score
    \override SpacingSpanner.uniform-stretching = ##t
    proportionalNotationDuration = #(ly:make-moment 1/8)
  }
}
```

Strict note spacing and proportional notation are score-level tools.
For a single tight passage use `\newSpacingSection` then overrides.

## 7. Fit-it-on-one-page recipe

Apply in order, recompiling after each step:

1. `#(set-global-staff-size 16)` (or 14 for dense scores).
2. `\paper { systems-per-page = #4  max-system-count = #4 }`.
3. Shrink margins to 12–15\mm.
4. `ragged-last-bottom = ##f`.
5. Remove empty staves: `\layout { \context { \Staff \RemoveEmptyStaves } }`.
6. Last resort: `\paper { page-breaking = #ly:minimal-breaking }`.

## 8. Instrument names and headers on parts

Long `instrumentName` before system 1, `shortInstrumentName` after —
set both in `\with` (see `voices-staves-polyphony.md` §6). Movement
titles go in score-level `\header { piece = "..." }`; the book title
stays top-level.

## 9. Gotchas

- `#(set-global-staff-size N)` must precede the music that uses it;
  mid-file changes need `\layout`-local sizing instead.
- `ragged-right = ##t` in `\layout` disables justification — scores
  look unfinished. Leave it off except for fragments.
- Spacing variables with no unit (`basic-distance = #12`) are in
  staff-spaces, not mm — small numbers, big effects.
