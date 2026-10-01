# Validation report — lilypond skill (2.26.0)

Pinned version: 2.26.0 (local install, `lilypond --version`).
Corpus: `.cache/lilypond-docs/` — 950 pages fetched once, never re-fetched.
Authority for existence: `/usr/share/lilypond/2.26.0/{ly,scm}` + `convert-ly`
rule table + compiling every snippet.

## Chapters covered vs skipped

Covered: Learning (file anatomy, relative/absolute, bar checks, variables),
Notation ch.1–8 (pitches, rhythms, expressive, repeats, simultaneous, staff,
editorial, text), ch.9 vocal/choral/songs, ch.10–14 keyboard/strings/fretted/
percussion/winds, ch.15 chords/figured bass, ch.16–18 contemporary/ancient/
world (contexts named, detail deferred to manual), ch.19–25 input modes,
structure, titles, include/tags/functions, output, MIDI, ch.26–31 paper/layout/
breaks/spacing, ch.32–36 tuning/contexts/internals/properties, appendices
(markup commands, tables, cheat sheet), Usage (CLI, convert-ly, lilypond-book,
error format), Extending (music/scheme/event functions, markup commands),
Changes 2.24→2.26 + convert-ly rules back to 1.0 (version-differences),
Glossary/Essay (music-fundamentals theory primer).
Skipped (by design): Internals Reference body — only the how-to-read recipe
is extracted; full grob/engraver tables stay in the docs.

## Files created

SKILL.md (129 lines), NOTICE, 15 references, 7 templates, 16 examples,
2 scripts. All 23 .ly files compile with zero errors AND zero warnings.

## Test results (generate-with-skill → compile)

| # | Prompt | Result | Notes |
|---|---|---|---|
| 1 | lead sheet with chord symbols and lyrics (g minor) | PASS first try | `g:m7`, `--` hyphens clean |
| 2 | piano grand staff with dynamics and pedal | PASS first try | `\sustainOn/Off`, `\<...\!` clean |
| 3 | two voices one staff, different rhythms (triplet vs duple) | FAIL→PASS | bar check caught voice-b `c2 c` (3 beats); fixed to `c2 c2` |
| 4 | SATB hymn (F major, 4 lyrics) | PASS first try | ChoirStaff + 4×`\lyricsto` clean |
| 5 | guitar tab with bends (+slides, string numbers) | PASS first try | `\bendAfter #4`, `\stringTuning` clean |
| 6 | drum groove | PASS first try | `\drummode` names clean |
| 7 | fix broken file (no layout, no bar checks) | PASS | diagnosed; also found 2.26 auto-wraps bare music (doc corrected) |
| 8 | font/staff-size change, fit on one page | PASS first try | 14pt + a5 + systems-per-page → "Fitting music on 1 page" |

8/8 pass (7 first-try, 1 fixed via the skill's own bar-check loop).

## Known gaps

- Ancient/world chapters: context names + entry pattern only; rare
  requests should read the manual chapter end-to-end (said in special-staves.md).
- Internals: recipe + 25-item table, not the full grob catalog.
- `render_preview.sh` PNG inspection is manual (no image tool in this env);
  PNGs were verified to generate, not visually reviewed.
- Subagent extraction (8 workers) failed on rate limits; references were
  written directly from the cached corpus + compile probes instead.
