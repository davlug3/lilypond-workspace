# Music fundamentals (theory → code)

Contents: staff/clefs · middle C · pitch spelling · intervals · values/rests ·
keys · meters · articulations vs dynamics · chords · transposing instruments.

Read this when the request uses musical terms. Each item maps the term to
the exact LilyPond command. For syntax detail follow the pointer to the
coding reference.

## 1. Staff and clefs

Five lines, four spaces. The clef fixes which line is which pitch:

| Clef | Meaning | LilyPond |
|---|---|---|
| Treble (G) | 2nd line = G4 | `\clef treble` |
| Bass (F) | 4th line = F3 | `\clef bass` |
| Alto (C) | middle line = C4 | `\clef alto` |
| Tenor (C) | 4th line = C4 | `\clef tenor` |
| Soprano (C) | 1st line = C4 | `\clef soprano` |
| Octave treble (guitar/tenor voice) | sounds octave below written | `\clef "G_8"` |
| Octave treble (tenor voice in SATB) | sounds octave below written | `\clef "treble_8"` |
| Percussion | unpitched | `\clef percussion` |
| Tab | tablature | automatic in `\new TabStaff` |

Ledger lines above/below are automatic. → `pitches-durations-rests.md`.

## 2. Middle C is `c'`

Absolute mode: `c'` is middle C (MIDI 60). `'` raises an octave,
`,` lowers one: `c` = C3, `c''` = C5. Anchor every part from this.

## 3. Pitch spelling (English/Dutch names are the default)

Sharps add `is`, flats add `es`: `cis` C♯, `des` D♭, `fis` F♯,
`ges` G♭, `bes` B♭. Exceptions: `as` (A♭), `es` (E♭).
Double accidentals double the suffix: `cisis`, `ceses`.
Write `ges`, never invent `gess`; write `bes`, never `bflat`.
Other languages: `\language "deutsch"` (then `h` = B♮, `b` = B♭),
`\language "nederlands"`, `"español"`, `"italiano"`, `"français"`.
→ `pitches-durations-rests.md`.

## 4. Intervals (semitones)

Unison 0 · m2 1 · M2 2 · m3 3 · M3 4 · P4 5 · tritone 6 · P5 7 ·
m6 8 · M6 9 · m7 10 · M7 11 · octave 12.
Transpose diatonically in code, not by hand: `\transpose c d' { ... }`
moves everything up a major second, spelling included.
→ `pitches-durations-rests.md`, example `03-transpose.ly`.

## 5. Note values and rests

`1` whole · `2` half · `4` quarter · `8` eighth · `16 32 64`.
Dot adds half: `4.` dotted quarter. Rests: `r` (pitched-position rest),
`R1` (full-measure rest), `s` (invisible spacer — keeps time, prints
nothing). Durations carry over until changed; restate after any rest.
→ `pitches-durations-rests.md`, example `04-durations-rests-tuplets.ly`.

## 6. Key signatures

Major/minor pairs share a signature (relative minor = down a minor 3rd:
C major / A minor). `\key g \major` (1♯), `\key bes \major`,
`\key e \minor`. Modes: `\key d \dorian`. The `\key` sets spelling
defaults; accidentals still print per bar as needed.

## 7. Meters

Simple (beat divides in 2): 2/4 3/4 4/4 2/2. Compound (beat divides in
3): 6/8 9/8 12/8 — in 6/8 beam in two groups of three eighths, not
three groups of two. Pickup: `\partial 4 { ... }`.
→ `repeats-beaming-timing.md`, example `05-pickup-and-barchecks.ly`.

## 8. Articulation vs dynamics vs ornament

Three different mechanisms — do not mix them up:

- Articulation (how one note starts/ends): `-. -^ -_ -! --- --+`
  attached after the note.
- Dynamics (how loud): `\p \mp \mf \f`, hairpins `\< \> \!`.
- Ornament/curve (spans notes): slur `( )`, phrasing slur `\( \)`,
  `\trill`, `\glissando`, `\arpeggio`.
  → `articulation-dynamics-markup.md`.

## 9. Chords and inversions

Triad = root + 3rd + 5th (C–E–G). Seventh adds the 7th (C–E–G–B).
First inversion puts the 3rd in the bass (`c/e`), second the 5th.
In code: spelled notes `<c e g>`, symbols `\chordmode { c1 e:7 }`.
→ `chords-and-chordnames.md`.

## 10. Transposing instruments

Written pitch ≠ sounding pitch for B♭ clarinet/trumpet (down M2),
F horn (down P5), E♭ alto sax (down M6). Write the *sounding* music
once, derive parts with `\transpose`:

```lilypond
concertPitch = \relative c'' { c d e f }
clarinetPart = \transpose c bes, \concertPitch
```

Check direction by compiling and reading the first pitch.
→ example `03-transpose.ly`.
