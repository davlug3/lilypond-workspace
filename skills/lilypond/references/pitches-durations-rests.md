# Pitches, durations, rests

Contents: absolute/relative entry · first-note rule · octave drift ·
accidentals · key/clef · transpose · durations/carry-over · rests ·
tempo · partial · ties · grace notes.

## 1. Absolute octave entry

`c'` is middle C. `'` raises one octave, `,` lowers one:

```lilypond
{ \clef bass c4 d e f g a b c' d' e' f' }
```

Bare `c`–`b` sit in the octave below middle C. State every octave by
hand — tedious for melodies, which is why `\relative` exists.

## 2. \relative and the first-note rule

```lilypond
\relative startpitch musicexpr
```

Each note lands as close as possible to the previous note (interval
smaller than a fifth, ignoring accidentals). `'`/` ,` shift an extra
octave from that computed pitch. The FIRST note is relative to
`startpitch`, given in absolute mode. Two safe habits:

```lilypond
\relative c' { c d e f g a b c' }      % startpitch = middle C
\relative c'' { c d e f }              % start an octave higher
```

Prefer `\relative c'` or `\relative c''` always — never start from the
first note's own name (`\relative gis'''` style), which hides drift.

## 3. Octave drift (the classic \relative bug)

Deleting or inserting one note re-anchors everything after it, so a
long `\relative` block silently wanders octaves. Defenses:

- Keep `\relative` blocks short (one phrase per variable).
- Re-anchor with explicit `'`/`,` after every leap of a fifth or more.
- Put a `|` bar check at every barline; a drifted octave does not trip
  the check, but short blocks make the wrong octave visible in the PNG.
- When a passage leaps widely, switch that bar to absolute pitches.

## 4. Accidentals

Default language is English/Dutch: `cis` C♯, `des` D♭, `fis` F♯,
`ges` G♭, `bes` B♭, `as` A♭, `es` E♭. Double: `cisis`, `ceses`.
Quarter tones: `cqh`/`cqb` style suffixes depend on `\language`;
English uses `qs`/`qf`/`tqs`/`tqf` families — look them up per
language, never guess. Other pitch languages:

```lilypond
\language "deutsch"   % h = B natural, b = B flat
\language "nederlands"
\language "español"
\language "français"
\language "italiano"
```

Caution accidentals print with `!` (`cis!`), reminders hide with `?`.

## 5. \key, \clef, \time, \tempo

```lilypond
\key g \major
\key es \major
\key e \minor
\key d \dorian
\clef treble
\clef "treble_8"   % tenor voice / guitar (sounds octave down)
\clef "G_8"        % guitar
\clef bass
\clef alto
\clef tenor
\time 4/4
\time 6/8
\time 3/4
\tempo "Allegro" 4 = 120
\tempo 2. = 60
```

`\key` changes spelling defaults from that point on. Time and tempo
are set like key: command, then music continues.

## 6. \transpose (argument order: FROM TO)

```lilypond
\transpose c d' { c e g }   % up a major second
```

`FROM` names the written pitch, `TO` the target. To derive a B♭
clarinet part from concert pitch: `\transpose c bes, \concertMusic`.
Full example: `examples/03-transpose.ly`.

## 7. Durations and carry-over

`1 2 4 8 16 32 64`, dots add half (`4.` `8..`). A duration persists
until changed — but RESTATE it after every rest and after switching
voices, and end every bar with `|`:

```lilypond
\time 4/4
c1 |
c2 c2 |
c4 c c c |
r1 |
r2 r4 r8 r16 r32 r64 r64 |
```

`r` pitched rest, `R1` full-measure rest, `s` invisible spacer.
Full example: `examples/04-durations-rests-tuplets.ly`.

## 8. Tuplets, scaling, ties

```lilypond
\tuplet 3/2 { c8 d e }     % triplet of eighths
\tuplet 3/2 4 { c4 d e }   % triplet of quarters
g2~ g2                     % tie: same pitch, ~ inside the first note
```

`\times 2/3 { }` is the older spelling of the same idea; prefer
`\tuplet`.

## 9. \partial (pickup)

```lilypond
\time 4/4
\partial 4 { c8 d }
e4 e e c8 d |
```

The pickup length plus bar 1 must complete one full measure together —
bar checks verify this. Full example:
`examples/05-pickup-and-barchecks.ly`.

## 10. Grace notes

```lilypond
\grace g g'1 |          % unmeasured lead-in
\acciaccatura g g'1 |   % crushed (crossed stem)
\appoggiatura g g'1 |   % takes time from the main note
```

Full example: `examples/07-graces.ly`.

## 11. Slurs vs ties vs phrasing slurs

`~` joins equal pitches (tie). `( )` slurs adjacent notes.
`\( \)` draws the longer phrasing slur. Full example:
`examples/06-ties-slurs-phrasing.ly`.

## 12. Gotchas

- Forgetting that duration carries over: after `r4`, the next note
  needs its own duration.
- Writing `\relative` with no startpitch, or starting from the first
  note's name — drift becomes invisible.
- `|` is a *check*, not a barline: it warns instead of drawing.
  `bar check failed at: 63/64` means the bar holds 63/64 of a measure.
- `\transpose` with FROM/TO swapped transposes the wrong direction;
  compile and read the first pitch of the PNG.
