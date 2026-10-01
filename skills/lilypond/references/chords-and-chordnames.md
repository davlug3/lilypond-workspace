# Chords and chord names

Contents: chordmode entry · common/altered chords · inversions ·
ChordNames · custom symbols · chord grids · figured bass.

## 1. \chordmode is a separate input mode

```lilypond
harmony = \chordmode {
  c1 | g:7 | a:m7 | f:maj7 |
}
```

No angle brackets. Durations work as in note mode. `~` holds a chord
across the barline. A chord lasts until the next chord symbol; restate
durations after rests.

## 2. Common chord spellings

`c` major · `c:m` minor · `c:7` dominant 7th · `c:maj7` major 7th ·
`c:m7` minor 7th · `c:dim` diminished · `c:aug` augmented ·
`c:sus4` suspended 4th · `c:6` sixth · `c:9` ninth ·
`c:m7.5-` half-diminished. Alterations append: `c:7.9-`,
`c:9+.5+`. When unsure of a spelling, compile and read the printed
symbol — ChordNames echoes exactly what it understood.

## 3. Inversions and voicings

```lilypond
\chordmode { c1 | c/e | c/g | }
```

`/e` puts E in the bass. The symbol prints the slash chord.

## 4. Printing chord names

```lilypond
\new ChordNames \harmony
```

ChordNames is its own context above the staff:

```lilypond
\score {
  <<
    \new ChordNames \harmony
    \new Staff { \melody }
  >>
  \layout { }
}
```

Full example: `examples/09-chords-and-chordnames.ly`.
Template: `templates/lead-sheet.ly`.

## 5. Customizing symbols

```lilypond
\new ChordNames \with {
  majorSevenSymbol = "M7"
} \harmony
```

Other tunables: `chordChanges` (hide repeated symbols),
`chordNameSeparator`, `minorChordSymbol`. Set them in the `\with`
block so they stay with the context.

## 6. Chord grids (rhythm slashes)

Chord grids use `< >` *inside* `\chordmode` to print slash patterns:

```lilypond
\chordmode { <c e g>1 }
```

One grid event per chord. Keep grids in their own staff.

## 7. Figured bass

```lilypond
\new FiguredBass {
  \figuremode {
    <6 4>4 <7 3> <6> <_!>
  }
}
```

Figures are numbers: `<6 4>` sixth-fourth, `<7 3>` seventh.
`_` holds, `!` adds the accidental, `-`/`+` alter. Place the
FiguredBass context below the bass staff.

## 8. Gotchas

- Typing note-mode `<c e g>` inside `\chordmode`: error. Chordmode
  takes bare symbols.
- Typing `c:7` in note mode: prints nothing useful. Modes do not mix.
- Forgetting `\new ChordNames` and putting `\chordmode` music directly
  in a Staff prints notes, not symbols.
