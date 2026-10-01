# Voices, staves, polyphony

Contents: sequential vs simultaneous · chords · one-staff polyphony ·
parallel music · staff groups · instrument names · contexts.

## 1. Sequential `{ }` vs simultaneous `<< >>`

```lilypond
{ c4 d e f }            % one after another
<< { c4 d e f } { c,2 c,} >>  % at the same time
```

`{ }` plays in sequence. `<< >>` stacks. Unbalanced closers are the
most common syntax error in generated files: every `<<` needs `>>`,
every `{` needs `}`. Indent them and count before compiling.

## 2. Chords: `< >` with duration AFTER

```lilypond
<c e g>2                % duration goes after the >
<c e g>4 <d f a>4       % restate duration per chord if needed
```

A chord is one voice playing several pitches. Several voices is
different — see §3. Do not wrap chords in `<< >>`, and do not put
voice commands inside `< >`.

## 3. Two voices, one staff

```lilypond
\new Staff <<
  \new Voice = "one" { \voiceOne \relative c' { c4 d e f | g2 r4 g | } }
  \new Voice = "two" { \voiceTwo \relative c { c4 g' b, g' | c,2 s4 c | } }
>>
```

`\voiceOne` stems up, `\voiceTwo` stems down, `\voiceThree` /
`\voiceFour` for three-plus voices, `\oneVoice` to return to single.
Name each voice when anything (lyrics, MIDI, tweaks) must find it.
Full example: `examples/08-two-voices-one-staff.ly`.
Rests in the second voice use `s` (spacer) where no rest should print.

## 4. Writing voices in parallel: \parallelMusic

Alternate bars become alternate variables. Bar checks are mandatory
and all parts of one bar system must have equal length:

```lilypond
\parallelMusic voiceA,voiceB {
  % Bar 1
  c'4 d' e' f'   |
  c4 d e f       |
}
\new StaffGroup <<
  \new Staff << \voiceA \\ \voiceB >>
>>
```

## 5. Multi-staff layouts

```lilypond
\new PianoStaff <<                    % piano: braces + shared barlines
  \new Staff = "up" { \upper }
  \new Staff = "down" { \clef bass \lower }
>>

\new StaffGroup << ... >>             % quartet: bracket, own barlines
\new ChoirStaff << ... >>             % choir: bracket, shared barlines
```

Templates: `piano-grand-staff.ly`, `string-quartet.ly`, `satb-lyrics.ly`.
Tenor staff in SATB uses `\clef "treble_8"` (sounds an octave down).

## 6. Instrument names

```lilypond
\new Staff \with { instrumentName = "Violin I" } \violinOne
\new Staff \with {
  instrumentName = "Violoncello"
  shortInstrumentName = "Vc."
} { \clef bass \cello }
```

`\with` customizes the context at creation. Long name prints before
the first system, short name before the rest.

## 7. Context hierarchy

`Score` → `StaffGroup`/`ChoirStaff`/`PianoStaff` → `Staff` →
`Voice`. Settings inherit downward: put shared key/time in each voice
(or a `\global` variable included in each), staff size in `\layout`,
page setup in `\paper`.

## 8. Gotchas

- `\\` separates voices *inside* `<< >>` on one staff; it is not a
  general separator. `\new Voice` blocks need no `\\` between them.
- Forgetting `\voiceOne`/`\voiceTwo` leaves stems colliding and rests
  doubled — always set them in polyphonic staves.
- Mixing `<c e g>` (one voice, many pitches) with `<<{c}{e}{g}>>`
  (three voices): pick one. Chords for homorhythm, voices for
  independent rhythm.
- A `\new Voice` without `\voiceOne` etc. inside a `<< >>` with
  another voice produces collisions; the fix is the voice command,
  not manual offsets.
