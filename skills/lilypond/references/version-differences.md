# Version differences (2.18 → 2.26)

Pinned version: **2.26.0**. Sourced from `convert-ly`'s own rule table
(`share/lilypond/2.26.0/python/convertrules.py`) — the authoritative
record of every rename/removal. Run `convert-ly -e old.ly` on any file
with an older `\version` before hand-editing.

## 1. How to upgrade

```sh
convert-ly -e old.ly              # in place, to current version
convert-ly --from=2.18.2 --to=2.26.0 song.ly > song-new.ly
```

`convert-ly` performs every mechanical rename below automatically.
What stays manual: musical fixes (durations, octaves, lyric counts).

## 2. Must-not-emit table (old → current)

| Do NOT write (old) | Write instead (2.26) | Since |
|---|---|---|
| `<c-\tweak ...>` post-event tweak | `\tweak ... <c ...>` prefix | 2.19 shape |
| `keySignature` | `keyAlterations` | 2.19.7 |
| `\whiteout` | `\whiteout-box` | 2.19.22 |
| `define-music-function (parser location args)` | `define-music-function (args)` | 2.19.22 |
| `ChordNameVoice` | `ChordNames` | 2.19.22 |
| `\applyOutput #'Score` | `\applyOutput Score` | 2.19.24 |
| `\partcombine` / `\autochange` | `\partCombine` / `\autoChange` | 2.21.0 |
| `\fermataMarkup` | `\fermata` | 2.21.0 |
| `\compressFullBarRests` | `\compressEmptyMeasures` | 2.21.0 |
| `banter-chord-names`, `jazz-chord-names` | default chord names | 2.21.0 removed |
| `\rest "4."` | `\rest {4.}` | 2.23.1 |
| bar line `"S"` / `"S-|"` | `"S-||"` / `"S"` | 2.23.1 |
| `glyph-name-alist` | `alteration-glyph-name-alist` | 2.23.3 |
| `\on-the-fly #proc` | `\if \cond` | 2.23.4 |
| `defaultBarType` | `measureBarType` | 2.23.6 |
| `markFormatter` | `rehearsalMarkFormatter` | 2.23.6 |
| `startRepeatType` etc. | `startRepeatBarType` etc. | 2.23.6 |
| `automaticBars = ##f` | `measureBarType = #'()` | 2.23.10 |
| `\bar "-"` | `\bar ""` | 2.23.10 |
| `\featherDurations #(ly:make-moment x/y)` | `\featherDurations x/y` | 2.23.10 |
| `barAlways = ##t` | `forbidBreakBetweenBarLines = ##f` | 2.23.12 |
| `\roman` | `\serif` | 2.25.5 |
| `font-family = #'roman` | `font-family = #'serif` | 2.25.5 |
| `\text` (markup) | `\serif`, `\sans`, or `\typewriter` | 2.25.6 |
| `single-digit` | `single-number` | 2.25.12 |
| `\compoundMeter` | `\timeAbbrev` | 2.25.33 |
| `\%` shorthand | `\repeat percent ...` | 2.25.35 removed |
| `\*` shorthand | `\repeat unfold ...` | 2.25.35 removed |
| `\semiGermanChords` | `\norwegianChords` | 2.25.35 |
| `\norwegianChords` | `\semiGermanChords` | 2.25.80 (swapped back) |
| `scripts.upbow` / `scripts.downbow` | `scripts.uupbow` / `scripts.udownbow` | 2.25.18 |
| `timeSignatureFraction` | `timeSignature` | 2.25.28 |
| `TimeSignature.fraction` | `TimeSignature.time-signature` | 2.25.30 |
| `enablePolymeter` | `enablePerStaffTiming` | 2.25.30 |
| `ellipsis-direction` | `passage-direction` | 2.25.25 |
| `bottom-space` | `bottom-padding` | 2.25.32 |
| `csharp` (glyph context) | `c-sharp` | 2.19.16 |
| `implicitTimeSignatureVisibility` | `initialTimeSignatureVisibility` | 2.19.16 |
| `thin-kern` | `segno-kern` | 2.19.11 |
| `instrument` / `instr` | `instrumentName` / `shortInstrumentName` | 2.9.13 |

## 3. Behavior changes (no rename, different result)

- `\fine` no longer stops `\repeat` iteration (2.23.12) — endings after
  `\fine` still unfold in MIDI.
- Melody_engraver + `Stem.neutral-direction` changed meaning (2.23.2) —
  middle-line stems may flip; set direction explicitly.
- Partcombine music types changed (2.25.24) — old `\partCombine`
  sources need re-checking, not just renaming.
- `\rtoe \rheel \ltoe \lheel` with direction modifiers warn (2.25.31).
- `all-bar-numbers-visible` + `BarNumber.break-visibility` + missing
  `\bar ""` now warns (2.23.7).

## 4. Removed engravers/contexts

`Note_swallow_translator`, `Rest_swallow_translator`,
`Default_bar_line_engraver` are gone — `\consists`/`\remove` lines
naming them error out. `Mark_tracking_translator` prints a manual-fix
warning under `convert-ly`.

## 5. Gotchas

- A file with `\version "2.18.2"` + new syntax may compile yet
  misbehave: always bump `\version` to `"2.26.0"` after converting.
- `convert-ly` never fixes music: durations, octaves, lyric syllable
  counts stay wrong after a clean conversion. Recompile and re-read.
- When a forum snippet fails, check its `\version` first — 2.16-era
  `\tweak`/`\roman`/`\%` snippets are the usual suspects.
