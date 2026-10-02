# Handoff — LilyPond workspace refactor

Last session checkpoint: Fri Oct 02 2026. This document captures where the
refactor stands, what has shipped, what is open, and what the next agent should
pick up. Treat it as the authoritative summary; the conversation checkpoints
are historical.

## Goal

Refactor the legacy server-rendered LilyPond workspace into a **React + Vite +
Monaco** editor, while keeping the server-side preview/compile endpoints
unchanged. The UI must be mobile-first, themeable (light/dark), with resizable
panels, persistent opacity, a file tree, and a LilyPond language for Monaco.

## Repository layout (current)

```
server.js                      Express server: compile/watch/presets/soundfonts
client/                        React + Vite + TS + Tailwind v4 + shadcn/ui
  src/
    App.tsx                      App shell: header, tree, editor, preview tabs, mixer
    main.tsx
    index.css
    components/
      theme-provider.tsx          Light/Dark/O3 OS-following theme
      ui/*                       shadcn/ui components (button, badge, ...)
    lib/
      lilypondLanguage.ts        Monaco LilyPond language (tokenizer + completions)
  public/
    index.html
    midi-tools.js                legacy audio engine (kept, injected after mount)
    sf2-player.js                legacy audio engine (kept, injected after mount)
    lilypond-syntax.js           legacy syntax (kept, NOT injected by new App)
    palette.js / mobile-keyboard.js  legacy (kept, NOT injected by new App)
presets/                         Source-of-truth example projects (immutable at runtime)
  rock-band-2/                   "Midnight Wire" example (see Todos)
public/soundfonts/               Writable server-side soundfonts (still served)
workspace/                       Gitignored; user projects copied here from presets
client/dist                      Build output served by Express
```

## Completed

- **`client/` scaffolding** done.
  - Vite + React 19 + TS + Tailwind v4 + shadcn/ui components (`button`, `badge`)
  - builds clean: `cd client && npm run build`
- **`server.js`** updated:
  - Serves `client/dist`; writes previews there.
  - `/soundfonts` route retained.
  - `includeDirsFor(name)` per-score include path (score dir on `-I`).
  - `.ily` support: server compiles sibling `.ly` wrapper when compiling an `.ily`.
- **App shell** ported to `src/App.tsx`:
  - Header, status bar, file select, presets list, workspace tree,
    Monaco editor, compile log, error banner, preview tabs (PNG/PDF/MIDI),
    SF2 controls, section/loop mixer.
- **Theme**: Light/Dark toggle, OS-following, stored in `theme-provider.tsx`;
  dark colors in a `prefers-color-scheme: dark` block.
- **Opacity sliders** (PNG/PDF) persist via `localStorage`.
- **Resizable panes** (desktop splitter) + mobile-first stacking (`lg:` breakpoints).
- **Monaco LilyPond language** in `src/lib/lilypondLanguage.ts`:
  - Tokenizer: comments (`%`, `#`), strings, `\\command` keywords,
    numbers, delimiters/operators.
  - Completion provider registered with `triggerCharacters`.
- **Mobile keyboard host removed**; legacy `palette.js`/`mobile-keyboard.js`
  disabled (not injected by the new App).
- **`workspace/` gitignored** and cleared; presets immutable in `presets/`.
- Commits through `6227de8` pushed to GitHub.

## Active

- *(none)*

## In-progress / verification

- **`triggerCharacters` fix** for `\` completion trigger:
  - Root cause: source had `["\\\\"]` → runtime string of 2 chars, never matched
    the single backslash typed by the user.
  - Fix: `triggerCharacters: ["\\"]` (one backslash at runtime).
  - Status: applied locally, `tsc --noEmit` passes, `npm run build` passes.
  - **Committed** in `67bb328` on top of the handoff commit `570a8fd`.

## Next move (agreed)

1. Refine the Monaco tokenizer so LilyPond command groups (`\header`,
   `\score`, `\new Staff`, `\include`, `\relative`, …) color differently
   instead of all as "keyword".
2. Add snippet completions for common commands (e.g. insert
   `\relative c' { }` with cursor positioned).
3. (Optional) wire the workspace tree into Monaco tab/file-switch behavior.
4. (Optional) add drag-to-install SF2 onto the browser UI.

## New task in progress — `rock-band-2` file structure

User wants `presets/rock-band-2` reorganized to a tokenized section layout:

```
rock-band-2
├── full-band.ly          <-- stitches all sections together (canonical render)
└── sections
    ├── intro
    │   ├── guitar.ily
    │   ├── keys.ily
    │   ├── drums.ily
    │   ├── bass.ily
    │   ├── vocals.ily
    │   ├── backing.ily
    │   └── rhythm.ily
    ├── verse
    │   ├── guitar.ily
    │   ├── keys.ily
    │   ├── drums.ily
    │   ├── bass.ily
    │   ├── vocals.ily
    │   ├── backing.ily
    │   └── rhythm.ily
    └── chorus
        └── ... (same token set)
```

Design decisions for the token mapping (existing content → new files):

| Token file     | Source                  | Variables carried in          |
|----------------|-------------------------|-------------------------------|
| `guitar.ily`   | `guitar1/guitar1.ily`   | `guitarVerse`, `guitarChorus`|
| `rhythm.ily`   | `guitar2/guitar2.ily`   | `rhythmVerse`/`rhythmChorus*`|
| `keys.ily`     | `piano/piano.ily`       | `pianoVerseRH/LH`, `pianoChorusRH/LH` |
| `bass.ily`     | `bass/bass.ily`         | `bassVerse`, `bassChorus`     |
| `drums.ily`    | `drums/drums.ily`       | `drumGlobal`, `*Verse*`, `*Chorus*` |
| `vocals.ily`   | `vocals-lead/lead.ily`  | `leadVerse*`, `leadWordsVerse/Chorus` |
| `backing.ily`  | `vocals-backing/backing.ily` | `backingVerse/Chorus`, words |
| `intro/*`      | —                       | Scaffolds only (placeholders) |

`full-band.ly` will:
- `\include "shared/shared.ily"` (kept)
- `\include "sections/intro/<token>.ily"` (placeholders)
- `\include "sections/verse/<token>.ily"`
- `\include "sections/chorus/<token>.ily"`
- define stitched full variables: `leadFull`, `leadWordsFull`,
  `backingFull`, `pianoFullRH/LH`, `guitarFull`, `rhythmFull`, `bassFull`,
  `drumFullHands/Feet`
- carry the existing `% score { << ... >> }` block from the old `08-full-band.ly`.

Old files to be removed: `08/09/10-*-band.ly` top-level wrappers and the
per-instrument `guitar1/ guitar2/ piano/ bass/ drums/ vocals-lead/
vocals-backing/` directories (content moved into `sections/`).

**State:** Done (Oct 02 2026). `presets/rock-band-2/` restructured to
`full-band.ly` + `shared/` + `sections/{intro,verse,chorus}/*.ily`; old
`08/09/10-*.ly` wrappers and per-instrument dirs removed. Compiles clean;
`full-band.midi` is byte-identical to the old `08-full-band.ly` render.

## Todos

### High priority (next session)
- [x] `chmod -R u+w presets/rock-band-2`
- [x] Implement the `sections/{intro,verse,chorus}` split (files above).
- [x] Create `full-band.ly` stitching includes + combined variables + score block.
- [x] Remove old `08/09/10-*.ly` and old instrument directories.
- [x] Commit `client/src/lib/lilypondLanguage.ts` trigger fix (`67bb328`).
- [x] Compile `full-band.ly` locally to verify LilyPond syntax; MIDI output
      verified byte-identical to old `08-full-band.ly`.

### Medium priority
- [x] Tokenize LilyPond command groups in `lilypondLanguage.ts`
      (structural=`keyword`, \new/\context/\with=`type`, music setters=`function`,
      mode switches=`constant`, dynamics/voices=`variable`).
- [x] Add snippet completions for common commands.
- [x] Wire workspace tree → Monaco tab/file switch (recursive tree,
      click a node opens it in the editor, selected file highlighted).
- [x] Add/delete sections + instruments for band projects (`/api/band/*`
      endpoints + "Sections & instruments" panel in `App.tsx`; restitches
      `full-band.ly`, scaffolds placeholders, tags custom staves).
- [x] Update `README.md` (project layout, rock-band-2 restructure, band API).

### Low priority
- [ ] Drag-to-install SF2 onto the browser UI.
- [ ] Mobile keyboard host removed already; confirm no stray references.
- [ ] Consider migrating `client/public` legacy scripts to the React bundle.

## Architecture notes

- Server: CommonJS Express. Client: ESM (TSX). Client has its own `package.json`.
- Monaco via `@monaco-editor/react`.
- Runtime audio: CDN Tone.js + Magenta + SpessaSynth JS, loaded after mount.
- Presets are immutable at runtime (server `/api/presets/use` always copies and
  `chmod -R u+w` the destination). `workspace/` is gitignored.

## How to run / verify

```bash
# server (from repo root)
node server.js                  # http://localhost:3000

# client dev / build
cd client
npm run dev                     # vite dev on /src
npm run build                   # -> client/dist (served by Express)

# typecheck client
cd client && npx tsc --noEmit

# quick syntax re-lint of client
cd client && npx eslint src --max-warnings 0
```

### Verification status (last session)
- `client/src/lib/lilypondLanguage.ts` trigger fix: `tsc` ✓, `npm run build` ✓.
- `rock-band-2` restructure: `lilypond full-band.ly` ✓, MIDI identical to old render ✓.
- Command-group tokenizer + snippet completions + recursive tree:
  `tsc -b` ✓, `vite build` ✓, oxlint (no errors) ✓.
  (Note: npm bin shims in `client/node_modules/.bin` don't execute on this
  Termux shell; run `node node_modules/typescript/bin/tsc -b` and
  `node node_modules/vite/bin/vite.js build` instead.)
- Band add/delete (sections + instruments): exercised end-to-end on a scratch
  workspace copy — add section, add token, delete managed token, delete legacy
  token, delete section all `lilypond`-compile ✓; add+delete round-trips to a
  wrapper identical apart from stitch-def ordering (token order); validation
  (reserved token, bad name, last-section guard) returns proper errors ✓.
  Audit follow-up (uncommitted fixes now in): legacy PianoStaff delete
  corrupted the score (brace-matching from nested braceless Staff lines) —
  now restricted to top-level 4-space blocks; new-token names colliding on
  variable prefix (e.g. `lead` vs `vocals`) are rejected; score insertion
  point is validated before any files are written.
  Note: `workspace/<project>` copies are snapshots — preset updates don't
  propagate; delete the workspace copy and re-Use the preset to refresh.

## Contact / context

- Working dir: `/data/data/com.termux/files/home/lilypond-workspace`
- Branch: `main`
- Latest commits: `aa2ed2e` (tokenizer/snippets/tree), `cf46daf` (rock-band-2 restructure), built on `c75b4da`.
- This handoff is kept up to date as items ship.
