# Command line and tools

Contents: lilypond flags · output formats · error format/exit codes ·
convert-ly · lilypond-book · check scripts.

## 1. lilypond invocation (2.26.0, verified via --help)

```sh
lilypond song.ly                  # PDF next to the input (default)
lilypond -o out song.ly           # write to out.pdf / out.midi
lilypond --pdf song.ly            # explicit PDF
lilypond --png song.ly            # PNG pages
lilypond --svg song.ly            # SVG
lilypond -E song.ly               # encapsulated PostScript
```

Key flags:

| Flag | Effect |
|---|---|
| `-o FILE` | output basename (suffix added automatically) |
| `--pdf/--png/--svg/--ps/-E` | output format |
| `-dpreview` | cropped preview images (first systems) |
| `-dno-point-and-click` | no clickable source links in PDF |
| `-dcrop` | crop output to the music |
| `-dresolution=90` | PNG resolution |
| `-I DIR` | add include search path |
| `-e EXPR` | evaluate Scheme expression |
| `-H FIELD` | dump `\header` field to file |
| `-l LOGLEVEL` | NONE ERROR WARN BASIC PROGRESS INFO DEBUG |
| `-s` | silent (errors only) |
| `-V` | verbose |
| `-v` | version |
| `-dOPTION=VAL` | any Scheme backend option (`-dhelp` lists them) |

## 2. Error and warning format

```
song.ly:33:33: error: syntax error, unexpected \lyrics
song.ly:14:44: warning: bar check failed at: 1/4
```

`file:line:column: severity: message`. Parse errors stop the run
(exit nonzero, `fatal error: failed files`). Warnings still produce
output — but this skill treats warnings as failures (see
`error-catalog.md`). `-s` shows errors only; `-l WARN` shows warnings
without progress chatter.

## 3. convert-ly (syntax upgrades)

```sh
convert-ly -e old.ly              # upgrade in place to current version
convert-ly --from=2.18.2 --to=2.26.0 song.ly > song-new.ly
convert-ly -n --from=2.0.0 -      # no \version stamp, stdin
```

Run it on any file whose `\version` predates 2.26 before editing by
hand. It handles mechanical renames; musical fixes stay manual.

## 4. lilypond-book (snippets inside documents)

```sh
lilypond-book --format=latex --pdf doc.tex
lilypond-book --process='lilypond -I include' doc.html
```

Snippets live in `\begin{lilypond}...\end{lilypond}` blocks; `-F` pipes
them through a filter (`convert-ly -n -` by default). Formats: texi
(default), texi-html, latex, html, docbook.

## 5. Skill scripts

```sh
./scripts/check_ly.sh song.ly          # compile, print log, verdict
./scripts/check_ly.sh -o out song.ly  # flags pass through
./scripts/render_preview.sh song.ly    # page-1 PNG + PDF (+ MIDI)
./scripts/render_preview.sh -d crop song.ly
```

`check_ly.sh` exits 0 (clean), 1 (warnings — fix them), 2 (errors).
`render_preview.sh` uses `-dpreview -dresolution=90
-dno-point-and-click` so a model can inspect a compact page-1 PNG.
Both scripts are POSIX `sh` (no bashisms) and honor `$LILYPOND` when
lilypond is off PATH.
