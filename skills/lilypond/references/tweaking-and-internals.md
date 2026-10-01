# Tweaking and internals

Contents: set/unset · override/revert · once · tweak/single ·
offset · overrideProperty · set-vs-override rule · finding properties ·
commonly tweaked table.

## 1. \set and \unset (context properties)

```lilypond
\set Staff.instrumentName = "Violin"
\set Score.barNumberVisibility = #all-bar-numbers-visible
\unset Staff.instrumentName
```

`\set Context.property = value` changes translation-time state:
instrument names, clef behavior, timing, MIDI. Context name required
(`Staff.`, `Voice.`, `Score.`). `\unset` restores the default.

## 2. \override and \revert (grob properties)

```lilypond
\override NoteHead.color = #red
d4 e
\revert NoteHead.color
f4 g
```

`\override Grob.property = value` changes engraving appearance.
Grob name required (`NoteHead.`, `Stem.`, `Beam.`, `Slur.`).
`\revert Grob.property` restores the default. Full example:
`examples/13-tweaks-overrides.ly`.

## 3. The set-vs-override decision rule

- Timing, naming, counting, MIDI → `\set` (context property).
- Color, size, padding, shape, visibility → `\override` (grob property).
- Wrong tool, exact errors (all observed by compiling):
  - `\override` on a context-only property: LilyPond ignores it or
    warns `cannot override ...`; nothing changes in the output.
  - `\set` on a grob-only property: `error: not a context property`
    style failure — the run stops.
- When the error names the property, switch tools and recompile.

## 4. \once (next object only)

```lilypond
\once \override NoteHead.font-size = #+3
g2
```

`\once` prefixes either `\set` or `\override` and expires after one
musical object. No `\revert` needed.

## 5. \tweak and \single (one object, inline)

2.26 syntax — prefix form, unquoted property, before the music:

```lilypond
\tweak color #blue <c e g c>1
\tweak Stem.color #(universal-color 'orange) c''8
```

`\tweak` modifies one grob created by the following expression.
`\single` converts overrides into single-shot form inside chords:

```lilypond
<\single \easyHeadsOn c' g'>2
```

The old post-event form `<c-\tweak ...>` is a hard error in 2.26:
`error: post-event expected`. See `version-differences.md`.

## 6. \offset (nudge a default)

```lilypond
\offset Y-offset 2.5 NoteHead
```

Adds to the property's default instead of replacing it. Arguments:
property, offsets, grob — in that order.

## 7. \overrideProperty (surgical)

```lilypond
\overrideProperty "Score.NonMusicalPaperColumn" ...
```

Exists in 2.26 (`music-functions-init.ly`) for grobs addressed by
path rather than by music position. Reach for it only when `\override`
cannot see the object; copy the call shape from the Internals
Reference example, never from memory.

## 8. How to find the right property (internals recipe)

1. Name the drawn object (stem? beam? slur? hyphen?).
2. Open the Internals Reference grob list; each grob page says
   "created by ..." (which engraver) and "accepts the following
   properties".
3. Read its layout interfaces (`side-position-interface`,
   `self-alignment-interface`, `spanner-interface`) for placement
   knobs (`padding`, `direction`, `X-offset`, `Y-offset`).
4. Check the property's type: number, boolean (`##t`/`##f`), symbol
   (`#'dashed-line`), pair, color.
5. Write `\override Grob.property = value` with the context name,
   compile, inspect the PNG.

Never invent a property name. A wrong name either warns or silently
does nothing — both mean "look it up, don't guess".

## 9. Commonly tweaked items (all exist in 2.26)

| Object | Property | Typical use |
|---|---|---|
| `NoteHead` | `color`, `font-size`, `style`, `transparent` | highlight, cue notes |
| `Stem` | `length`, `thickness`, `color`, `direction` | longer stems, stems down |
| `Beam` | `thickness`, `beam-thickness`, `gap`, `positions` | fat beams, level beams |
| `Slur` | `thickness`, `ratio`, `eccentricity` | heavier slurs |
| `Hairpin` | `thickness` | heavier crescendi |
| `StaffSymbol` | `line-count`, `thickness` | 1-line percussion staff |
| `BarLine` | `glyph-name` | custom barlines |
| `TimeSignature` | `stencil = ##f`, `style` | hide time sig |
| `KeySignature` | `stencil = ##f` | hide key sig |
| `TextScript` | `padding`, `direction`, `color` | move text off slurs |
| `LyricText` | `font-size`, `color` | stanza sizing |
| `LyricHyphen` | `minimum-distance`, `padding` | lyric spacing |
| `ChordName` | `font-size`, `X-offset` | chord symbol fit |
| `MetronomeMark` | `padding` | tempo mark clearance |
| `SpacingSpanner` | `uniform-stretching` | even spacing |
| `VerticalAxisGroup` | `remove-empty` | hide empty staves |
| `Script` | `padding`, `direction` | articulation clearance |
| `Fingering` | `padding`, `font-size` | finger numbers |
| `TrillSpanner` | `thickness` | trill line weight |
| `Glissando` | `thickness`, `style` | gliss line |
| `Arpeggio` | `positions` | arpeggio span |
| `TupletBracket` | `bracket-visibility`, `direction` | tuplet look |
| `VoltaBracket` | `thickness` | repeat bracket |
| `SystemStartBracket` | `collapse-height` | bracket collapse |

Hiding anything: `\omit Grob` or `\override Grob.stencil = ##f`;
whiting out: `\override Grob.color = #white`; transparency:
`\override Grob.transparent = ##t`.

## 10. Gotchas

- `\override` without a context name inside `\layout` applies
  everywhere — inside music it applies from that point on. Scope with
  `\once` or `\revert`.
- `\revert` needs the exact `Grob.property` pair used in `\override`.
- `\tweak` cannot touch clefs or time signatures — restructure instead.
- `\temporary` is NOT a music command in 2.26 (only backend temp-file
  helpers share the name). Do not emit it.
