# Repeats, beaming, timing

Contents: volta/unfold · alternatives · segno/fine · percent/tremolo ·
beams manual/auto · barlines · cadenzas · polymeter.

## 1. Volta repeats with alternative endings

```lilypond
music = \relative c' {
  \repeat volta 2 {
    c4 d e f
  }
  \alternative {
    { g2 a }
    { c,1 }
  }
  \bar "|."
}
```

`\repeat volta 2` brackets the repeated body; `\alternative` holds one
block per ending. Full example: `examples/14-repeats-volta.ly`.

## 2. Unfold (written-out) repeats

```lilypond
\repeat unfold 4 { c4 d e f | }
```

Prints every iteration. Use for MIDI practice tracks and for lyrics
that differ per verse (each copy gets its own `\lyricsto` line).

## 3. Segno, fine, dal segno

```lilypond
c4 d e f |
\mark \markup { \musicglyph #"scripts.segno" }
g4 a b c' |
\bar "|."
```

`\mark` numbers rehearsal marks automatically; segno/coda glyphs come
from `\musicglyph`. D.C./D.S. text is `\markup { \italic "D.C. al Fine" }`.
Al-fine structures need manual `\bar` placement — sketch the barline
map on paper first, then encode.

## 4. Percent and tremolo repeats

```lilypond
\repeat percent 4 { c8 d e f | }
\repeat tremolo 8 { c32 d }      % measured tremolo
c4:32                            % single-note tremolo shorthand
```

Percent compresses identical bars; tremolo subdivides. Both need the
repeated music to fill whole bars.

## 5. Beaming: automatic first, manual second

```lilypond
\time 3/4
c8[ c] d[ d] e[ e] |
c16[ d e f] g[ a b c] d[ e f g] |
c4 \autoBeamOff c8. e16 \autoBeamOn g4 |
```

`[ ]` forces one beam. `\autoBeamOff`/`\autoBeamOn` suspend the
time-signature rules locally. In 6/8 check the PNG: two groups of
three, not three of two. Full example:
`examples/15-beaming-control.ly`.

## 6. Barlines and checks

```lilypond
\bar "|."     % final
\bar ".|:"    % repeat start
\bar ":|."    % repeat end
\bar ":|.:"   % repeat both
\bar "||"     % double bar
\bar "|."     % thin-thick
|             % bar CHECK (warns, draws nothing)
```

`|` verifies the bar is full; `\bar` draws. Use both: `... g2 | \bar "|."`.

## 7. Cadenzas and unmetered music

```lilypond
\cadenzaOn
c4 d e f g a b c'
\cadenzaOff
\bar "|"
```

No barlines are drawn or checked inside; close with `\cadenzaOff`
and an explicit `\bar` or the following music mis-times.

## 8. Polymeter

Separate staves may carry separate `\time` signatures; LilyPond aligns
by absolute time, not barlines. Bar checks inside polymeter staves
refer to each staff's own meter — keep a calculator handy and verify
in the PNG.

## 9. Gotchas

- `\alternative` with the wrong number of blocks: the extra ending
  prints but never plays in MIDI.
- `\repeat percent` over a partial bar: error — fill or `\partial` it.
- Manual `[ ]` across a barline: illegal — beam within the bar.
- Forgetting `\cadenzaOff`: all following bar checks fail.
