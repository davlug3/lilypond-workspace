# LilyPond Workspace (Express + automatic PNG / PDF / MIDI preview)

Simple workspace: edit LilyPond code in the browser **or** in `workspace/` (recursive) with your own editor, get automatic score preview.

## Quick start

```bash
npm install
npm run dev     # or: npm start
# open http://localhost:3000
```

Requires `lilypond` on PATH (you have 2.22.2). Check: `lilypond --version`.

## How it works

- `server.js` — Express static server + API:
  - `POST /api/compile { code, name? }` → runs `lilypond --png --pdf`, returns
    `{ success, log, pngs[], pdf, midi, urls }` as data URLs, and mirrors the
    latest good output to `public/preview.png`, `public/preview.pdf`, `public/preview.midi`.
  - `GET /api/files`, `GET /api/file?name=x.ly`, `PUT /api/file?name=x.ly` — workspace file CRUD.
  - `GET /api/version` — lilypond version string.
  - `GET /api/watch` — SSE stream; pushes `auto-compiled` events (with static
    `pngUrls`/`pdfUrl`/`midiUrl`, log, page count) whenever a workspace file is saved.
  - `GET /api/watch-file`, `POST /api/watch-file { name | null }` — pin the
    watched file (default: any workspace `.ly`, watched recursively; `WATCH_FILE` env sets the initial pin).
    The server debounces saves (~300 ms), recompiles server-side, republishes
    `public/preview.*`, and broadcasts the result. Latest save wins. (Native
    `fs.watch`; no extra watcher dependency.)
- `public/index.html|app.js|sf2-player.js|style.css` — editor + preview UI:
  - textarea editor, debounced (800 ms) auto-compile when `auto-preview` is on.
  - Tabs: **PNG score** (`<img>`), **PDF** (`<iframe>`), **MIDI audio**
    (`<midi-player>` + `<midi-visualizer>` from `html-midi-player`, Tone.js soundfont — no server audio conversion needed).
    The selected tab is remembered in the URL hash (`#png` / `#pdf` / `#midi`),
    so it survives reloads and can be shared/bookmarked.
  - **Resizable panels**: drag the divider between editor and preview (15–85%
    range, double-click to reset 50/50, arrow keys when focused). Position
    persists in `localStorage`. On narrow screens the panes stack and the
    divider hides.
  - **Playback engines + soundfonts**: the MIDI tab offers two engines (choice
    persists in `localStorage`).
    - *Magenta* (default): General MIDI (all instruments), Salamander grand
      piano (piano-only), Jazz Kit drums (drums-only), and an offline simple
      synth. Small streamed samples, no download wait.
    - *SF2 (SpessaSynth)*: full SoundFont banks — bundled GeneralUser GS
      (~8 MB, all instruments), any uploaded `.sf2`/`.sf3`/`.dls` file, or a
      custom bank URL. Banks are downloaded once, then cached. Play / Pause /
      Stop + seek bar included. Add more built-in banks with one line each in
      `SF2_BANKS` (`public/sf2-player.js`).
    Switching engines stops the other so they never overlap; autoplay-on-save
    follows the active engine.
  - **Theme**: clean light studio (neutral grays, single blue accent, system
    type), dark mode follows the OS. All text pairs contrast-checked ≥4.5:1
    in both themes (computed), score/PDF stay on paper white, error banner
    uses `role="alert"`, focus rings are visible, and `prefers-reduced-motion`
    disables transitions.
  - **Opacity controls**: each of the PNG and PDF tabs has an opacity slider
    (0–1, 0.01 steps), persisted in `localStorage` so it survives reloads.
    The URL hash carries only the tab (`#png` / `#pdf` / `#midi`).
  - **Follow file** (on by default): pins the selected file as the watched file.
    When it is saved — from your own editor, or the browser Save button — the
    server recompiles and the page auto-reloads score + log. In follow mode the
    disk file wins and the editor syncs to it. Saving a file you're *not*
    following shows a "not followed — Follow it" notice instead of silently
    doing nothing. If the live feed drops, the status pill says so (Compile
    still works; reload the page to reconnect).
  - **Failure UI**: a failed compile shows a red banner above the preview tabs
    with the extracted `error:` lines (full output stays in the Compiler log),
    and a "showing last good version" chip while the panes display outdated
    output. Both clear on the next successful compile.
  - **Auto-play MIDI on save** (on by default): the new MIDI is fetched fully in
    the background, then cuts in immediately — current audio stops and the new
    version starts. PNGs preload off-screen first, so the score never flickers
    either.
    Note: browsers block audio before the first click/keypress on the page —
    click anywhere once to unlock, then saves will play audibly.
  - Download links for each format. Compiler log shown verbatim.

## MIDI preview notes

Browsers can't play `.mid` natively, so the page uses the `html-midi-player`
web component (CDN) for the Magenta engine and `spessasynth_lib` (CDN,
pinned in the `importmap` in `public/index.html`) for the SF2 engine.
For MIDI output you need a `\midi { }` block in your `\score`,
e.g. `workspace/scale-midi.ly`. Without it, the MIDI tab shows "No MIDI yet" — expected.

## Project layout

```
server.js            Express + lilypond compile + watcher
public/              index.html, app.js, style.css, preview.* (generated)
workspace/           hello.ly, scale-midi.ly — edit/add your .ly files here
                   (subfolders ok: listed + watched recursively)
package.json
```
