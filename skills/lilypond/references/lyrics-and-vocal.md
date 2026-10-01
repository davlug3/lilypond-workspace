# Lyrics and vocal music

Contents: lyricmode · addlyrics vs lyricsto · hyphens/extenders ·
melisma · stanzas · lead sheets · SATB · hymns.

## 1. Lyric input mode

```lilypond
wordsOne = \lyricmode {
  Three4 blind mice,2 three4 blind mice2
}
```

Syllables take durations like notes. `4` one note, `2` two notes
(melisma), quotes for punctuation: `"I" am so lone -- "ly,"`.
Never name the variable `lyrics` — it is a reserved word.

## 2. Attach with \lyricsto, not \addlyrics

```lilypond
\score {
  <<
    \new Voice = "mel" { \melody }
    \new Lyrics \lyricsto "mel" \wordsOne
  >>
}
```

`\lyricsto "mel"` binds lyrics to the named voice's rhythm exactly.
`\addlyrics` attaches to whatever precedes it and misaligns the moment
the music changes — prefer `\lyricsto` in every generated file.
Full example: `examples/10-lyrics-align.ly`.

## 3. Hyphens and extenders

```lilypond
\lyricmode {
  This is the mel -- o -- dy __ test.
}
```

`--` between syllables draws a hyphen. `__` after a word draws an
extender line across the melisma. One `--` per syllable break;
hyphens need spaces around them.

## 4. Melisma (several notes, one syllable)

Automatic durations handle it: `dy2` stretches `dy` over two notes.
When the word has fewer syllables than the melody has notes, skip with
`_`:

```lilypond
\lyricmode { glo -- _ ri -- a }
```

Each `_` consumes one extra note. Count syllables against notes
exactly — a mismatch shifts every following word.

## 5. Several stanzas

One Lyrics context per stanza, all bound to the same voice:

```lilypond
\new Lyrics \lyricsto "mel" \verseOne
\new Lyrics \lyricsto "mel" \verseTwo
```

Stanza numbers go in the variable or a `\set stanza = "1."` on the
Lyrics context.

## 6. Lead sheets

Melody voice + ChordNames + Lyrics, in that order:

```lilypond
<<
  \new ChordNames \harmony
  \new Voice = "mel" { \melody }
  \new Lyrics \lyricsto "mel" \wordsOne
>>
```

Template: `templates/lead-sheet.ly`.

## 7. SATB and choral scores

Soprano/alto share a staff with `\voiceOne`/`\voiceTwo`, tenor/bass
share another with `\clef "treble_8"` on top:

```lilypond
\new ChoirStaff <<
  \new Staff = "sa" <<
    \new Voice = "soprano" { \voiceOne \global \soprano }
    \new Voice = "alto"    { \voiceTwo \global \alto }
  >>
  \new Lyrics \lyricsto "soprano" \sopranoWords
  \new Lyrics \lyricsto "alto" \altoWords
  \new Staff = "tb" <<
    \clef "treble_8"
    \new Voice = "tenor" { \voiceOne \global \tenor }
    \new Voice = "bass"  { \voiceTwo \global \bass }
  >>
  \new Lyrics \lyricsto "tenor" \tenorWords
  \new Lyrics \lyricsto "bass" \bassWords
>>
```

Template: `templates/satb-lyrics.ly`.

## 8. Hymns, chants, psalms

Phrase bar lines (`\bar "|"`) and partial measures (`\partial`) shape
hymn tunes; chant uses unmetered music with `\cadenzaOn` and division
marks. Keep one template per genre and adapt.

## 9. Gotchas

- Lyrics drifting one note late: count `_` skips and `--` hyphens;
  recompile after every verse edit.
- `\addlyrics` after a `<< >>` block attaches to the wrong voice —
  use `\lyricsto` with a named voice.
- Punctuation glued to a syllable (`ly,"`) changes hyphenation —
  quote it: `"ly,"`.
