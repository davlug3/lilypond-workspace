const { execFile } = require("child_process");
const fs = require("fs/promises");
const fssync = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const WORKSPACE_DIR = path.join(ROOT, "workspace");
const PRESETS_DIR = path.join(ROOT, "presets");
const DIST_DIR = path.join(ROOT, "client", "dist");
const SOUNDFONTS_DIR = path.join(ROOT, "public", "soundfonts");
const SF_EXTS = new Set([".sf2", ".sf3", ".dls", ".sfogg"]);

fssync.mkdirSync(WORKSPACE_DIR, { recursive: true });
fssync.mkdirSync(SOUNDFONTS_DIR, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use(express.static(DIST_DIR));
app.use("/soundfonts", express.static(SOUNDFONTS_DIR));

function safeSoundfontName(name) {
  const base = path.basename(String(name || "")).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const ext = path.extname(base).toLowerCase();
  if (!base || !SF_EXTS.has(ext)) return null;
  return base;
}

function safeName(name) {
  return (name || "score").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60) || "score";
}

// ---- Workspace .ly files (recursive) ----
// Paths are workspace-relative with forward slashes, e.g. "hello.ly", "bach/prelude.ly".

async function listLyFiles() {
  const out = [];
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(path.join(dir, e.name), r);
      else if (e.isFile() && e.name.endsWith(".ly")) out.push(r);
    }
  }
  await walk(WORKSPACE_DIR, "");
  return out.sort();
}

// Resolve a client-supplied relative path safely inside the workspace.
// Returns { full, rel } or null when invalid.
function resolveLy(raw) {
  const norm = path.normalize(String(raw || ""));
  if (!/\.(ly|ily)$/i.test(norm) || norm.startsWith("..") || path.isAbsolute(norm)) return null;
  const full = path.join(WORKSPACE_DIR, norm);
  if (full !== WORKSPACE_DIR && !full.startsWith(WORKSPACE_DIR + path.sep)) return null;
  return { full, rel: norm.split(path.sep).join("/") };
}

function includeDirsFor(name) {
  // Files like "rock-band-2/08-full-band.ly" include sibling paths such as
  // "shared/shared.ily", which only resolve if LilyPond is run with the
  // score's own directory on its include path.
  const dirs = [WORKSPACE_DIR, path.join(WORKSPACE_DIR, "rock-band")];
  const rel = String(name || "");
  const idx = rel.lastIndexOf("/");
  if (idx > 0) {
    const relDir = rel.slice(0, idx);
    const norm = path.normalize(relDir);
    if (!norm.startsWith("..") && !path.isAbsolute(norm)) {
      dirs.push(path.join(WORKSPACE_DIR, norm));
    }
  }
  return [...new Set(dirs)];
}

function runLilypond(inputFile, outPrefix, dirs) {
  return new Promise((resolve) => {
    const args = ["--png", "--pdf", "-o", outPrefix];
    for (const d of dirs || includeDirsFor("")) args.push("-I", d);
    args.push(inputFile);
    execFile(
      "lilypond",
      args,
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        resolve({ error, stdout: String(stdout || ""), stderr: String(stderr || "") });
      }
    );
  });
}

async function compileLilypond(code, name = "score") {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lily-"));
  const base = safeName(name);
  const lyFile = path.join(tmpDir, `${base}.ly`);
  const outPrefix = path.join(tmpDir, "output");
  await fs.writeFile(lyFile, code, "utf8");

  const { error, stdout, stderr } = await runLilypond(lyFile, outPrefix, includeDirsFor(name));
  const log = `${stdout}\n${stderr}`.trim();
  const success = !error || /Success: compilation successfully completed/.test(log);

  let pdf = null;
  let midi = null;
  let pngs = [];

  try {
    const files = await fs.readdir(tmpDir);
    // lilypond emits output.pdf / output.midi / output.png (or output-page1.png, output-1.png for multi-page)
    for (const f of files) {
      const full = path.join(tmpDir, f);
      if (f === "output.pdf") pdf = await fs.readFile(full);
      else if (f === "output.midi") midi = await fs.readFile(full);
      else if (/^output.*\.png$/i.test(f)) {
        pngs.push({ name: f, data: await fs.readFile(full) });
      }
    }
    pngs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  } catch (e) {
    return { success: false, log: log + `\nRead error: ${e.message}`, pdf: null, midi: null, pngs: [] };
  } finally {
    // cleanup tmp, best effort
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  // No PDF/PNG at all => failed even if exit code was 0
  const ok = Boolean(success) && Boolean(pdf || pngs.length > 0);
  return { success: ok, log, pdf, midi, pngs };
}

function toDataUrl(buf, mime) {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// Mirror latest outputs to public/ for direct <img>/<iframe>/<midi-player> use.
// Returns cache-busted static URLs (small payload, suitable for SSE push).
async function publishPreview(result) {
  const stamp = Date.now();
  const out = { pngUrls: [], pdfUrl: null, midiUrl: null };
  try {
    const existing = await fs.readdir(DIST_DIR);
    await Promise.all(
      existing
        .filter((f) => f.startsWith("preview"))
        .map((f) => fs.rm(path.join(DIST_DIR, f), { force: true }))
    );
    if (result.pdf) {
      await fs.writeFile(path.join(DIST_DIR, "preview.pdf"), result.pdf);
      out.pdfUrl = `/preview.pdf?t=${stamp}`;
    }
    if (result.midi) {
      await fs.writeFile(path.join(DIST_DIR, "preview.midi"), result.midi);
      out.midiUrl = `/preview.midi?t=${stamp}`;
    }
    for (let i = 0; i < result.pngs.length; i++) {
      const fname = result.pngs.length === 1 ? "preview.png" : `preview-page${i + 1}.png`;
      await fs.writeFile(path.join(DIST_DIR, fname), result.pngs[i].data);
      out.pngUrls.push(`/${fname}?t=${stamp}`);
    }
  } catch (_) {
    // non-fatal
  }
  return out;
}

// ---- API ----

app.get("/api/version", (_req, res) => {
  execFile("lilypond", ["--version"], { timeout: 5000 }, (err, stdout, stderr) => {
    res.json({ version: String(stdout || stderr || err?.message || "unknown").split("\n")[0] });
  });
});

// ---- Presets (read-only, never written through the server) ----
// A preset is a top-level entry in ./presets: a directory (project with
// parts/) or a single .ly file. Selecting one copies it into ./workspace.

async function listPresetFiles(dir, rel = "") {
  const out = [];
  async function walk(d, r) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const rr = r ? `${r}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(path.join(d, e.name), rr);
      else if (e.isFile() && /\.(ly|ily)$/i.test(e.name)) out.push(rr);
    }
  }
  await walk(dir, rel);
  return out.sort();
}

async function listPresets() {
  let entries;
  try { entries = await fs.readdir(PRESETS_DIR, { withFileTypes: true }); } catch (_) { return []; }
  const presets = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(PRESETS_DIR, e.name);
    if (e.isDirectory()) {
      const files = await listPresetFiles(full, e.name);
      if (files.length) presets.push({ name: e.name, kind: "directory", files });
    } else if (e.isFile() && /\.(ly|ily)$/i.test(e.name)) {
      presets.push({ name: e.name, kind: "file", files: [e.name] });
    }
  }
  return presets.sort((a, b) => a.name.localeCompare(b.name));
}

// Workspace tree: directories containing .ly/.ily files, nested.
async function workspaceTree() {
  async function walk(dir, rel) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch (_) { return null; }
    const dirs = [];
    const files = [];
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        const sub = await walk(path.join(dir, e.name), r);
        if (sub && (sub.files.length || sub.dirs.length)) dirs.push(sub);
      } else if (e.isFile() && /\.(ly|ily)$/i.test(e.name)) {
        files.push({ name: e.name, path: r });
      }
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    return { name: rel ? rel.split("/").pop() : "workspace", path: rel, dirs, files };
  }
  return (await walk(WORKSPACE_DIR, "")) || { name: "workspace", path: "", dirs: [], files: [] };
}

// Resolve a preset name safely inside PRESETS_DIR.
function resolvePreset(raw) {
  const norm = path.normalize(String(raw || ""));
  if (!norm || norm.startsWith("..") || path.isAbsolute(norm)) return null;
  const full = path.join(PRESETS_DIR, norm);
  if (full !== PRESETS_DIR && !full.startsWith(PRESETS_DIR + path.sep)) return null;
  return { full, name: norm.split(path.sep)[0] };
}

app.get("/api/presets", async (_req, res) => {
  try { res.json({ presets: await listPresets() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/tree", async (_req, res) => {
  try { res.json({ tree: await workspaceTree() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/presets/use", async (req, res) => {
  const target = resolvePreset(req.body?.name);
  if (!target) return res.status(400).json({ error: "missing or invalid preset name" });
  try {
    const stat = await fs.stat(target.full);
    const dest = path.join(WORKSPACE_DIR, target.name);
    // Refuse to clobber an existing workspace entry of the same name.
    try { await fs.lstat(dest); return res.status(409).json({ error: `workspace already contains "${target.name}"; delete it first` }); }
    catch (_) { /* does not exist yet */ }
    const mode = req.body?.mode === "move" ? "move" : "copy";
    if (mode === "move") {
      // Move is not allowed: presets must stay immutable. Always copy.
    }
    await fs.cp(target.full, dest, { recursive: true });
    // Copied files must be writable in the workspace.
    const { execFile: ef } = require("child_process");
    ef("chmod", ["-R", "u+w", dest], () => {});
    const files = stat.isDirectory() ? await listPresetFiles(dest, target.name) : [target.name];
    res.json({ ok: true, name: target.name, kind: stat.isDirectory() ? "directory" : "file", files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/files", async (_req, res) => {
  try {
    res.json({ files: await listLyFiles() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/file", async (req, res) => {
  const target = resolveLy(req.query.name);
  if (!target) return res.status(400).json({ error: "missing ?name=*.ly/*.ily (workspace-relative path)" });
  try {
    const code = await fs.readFile(target.full, "utf8");
    res.json({ name: target.rel, code });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.put("/api/file", async (req, res) => {
  const target = resolveLy(req.query.name || req.body?.name);
  if (!target) return res.status(400).json({ error: "missing ?name=*.ly/*.ily (workspace-relative path)" });
  try {
    await fs.mkdir(path.dirname(target.full), { recursive: true });
    await fs.writeFile(target.full, String(req.body?.code ?? ""), "utf8");
    res.json({ ok: true, name: target.rel });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/file", async (req, res) => {
  const target = resolveLy(req.query.name || req.body?.name);
  if (!target) return res.status(400).json({ error: "missing ?name=*.ly/*.ily (workspace-relative path)" });
  try {
    await fs.rm(target.full, { recursive: true, force: true });
    res.json({ ok: true, name: target.rel });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/tree-entry", async (req, res) => {
  // Remove a top-level workspace entry (e.g. a copied preset directory).
  const raw = String(req.query.name || req.body?.name || "");
  const norm = path.normalize(raw);
  if (!norm || norm === "." || norm.startsWith("..") || path.isAbsolute(norm) || norm.includes(path.sep)) {
    return res.status(400).json({ error: "name must be a top-level workspace entry" });
  }
  const full = path.join(WORKSPACE_DIR, norm);
  if (!full.startsWith(WORKSPACE_DIR + path.sep)) return res.status(400).json({ error: "invalid name" });
  try {
    await fs.rm(full, { recursive: true, force: true });
    res.json({ ok: true, name: norm });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Server-persisted SoundFonts (public/soundfonts/*) ----
// List: GET /api/soundfonts -> { files: [{ name, url, size }] }
// Upload: POST /api/soundfonts with Content-Type: application/octet-stream,
//   filename via X-Filename header or ?name=, body is raw .sf2/.sf3/.dls bytes.
// Delete: DELETE /api/soundfonts/:name
app.get("/api/soundfonts", async (_req, res) => {
  try {
    const entries = await fs.readdir(SOUNDFONTS_DIR, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!SF_EXTS.has(path.extname(e.name).toLowerCase())) continue;
      let size = 0;
      try {
        size = (await fs.stat(path.join(SOUNDFONTS_DIR, e.name))).size;
      } catch (_) {}
      files.push({ name: e.name, url: `/soundfonts/${encodeURIComponent(e.name)}`, size });
    }
    files.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  "/api/soundfonts",
  express.raw({ type: "application/octet-stream", limit: "300mb" }),
  async (req, res) => {
    const rawName = req.get("X-Filename") || req.query.name || "";
    const name = safeSoundfontName(rawName);
    if (!name) return res.status(400).json({ error: "filename must end in .sf2/.sf3/.dls/.sfogg (use X-Filename header or ?name=)" });
    if (!req.body || !req.body.length) return res.status(400).json({ error: "empty upload body" });
    try {
      await fs.writeFile(path.join(SOUNDFONTS_DIR, name), req.body);
      const size = req.body.length;
      res.json({ ok: true, name, url: `/soundfonts/${encodeURIComponent(name)}`, size });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

app.delete("/api/soundfonts/:name", async (req, res) => {
  const name = safeSoundfontName(req.params.name);
  if (!name) return res.status(400).json({ error: "unknown soundfont" });
  try {
    await fs.rm(path.join(SOUNDFONTS_DIR, name), { force: true });
    res.json({ ok: true, name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Main compile endpoint: { code, name? }
// Returns JSON with data URLs + also writes latest to public/preview.* for direct <img>/<iframe> use.
app.post("/api/compile", async (req, res) => {
  const code = String(req.body?.code ?? "");
  const name = String(req.body?.name || "score");
  if (!code.trim()) return res.status(400).json({ success: false, log: "Empty score." });
  try {
    const result = await compileLilypond(code, name);
    const urls = await publishPreview(result);

    res.json({
      success: result.success,
      log: result.log,
      pdf: result.pdf ? toDataUrl(result.pdf, "application/pdf") : null,
      midi: result.midi ? toDataUrl(result.midi, "audio/midi") : null,
      pngs: result.pngs.map((p) => toDataUrl(p.data, "image/png")),
      pages: result.pngs.length,
      hasMidi: !!result.midi,
      // cache-busted static URLs as fallback
      urls: {
        pdf: urls.pdfUrl,
        midi: urls.midiUrl,
        png: urls.pngUrls[0] || null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, log: String(e?.message || e) });
  }
});

// ---- Server-side file watch: compile on save, push result via SSE ----
// Optional pin: only auto-compile this workspace-relative file, e.g. "hello.ly" or "bach/prelude.ly".
// null = auto-compile whichever workspace .ly file was saved (all are watched, recursively).
function normalizeWatchName(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  return resolveLy(raw)?.rel || null;
}
let watchedFile = normalizeWatchName(process.env.WATCH_FILE);

app.get("/api/watch-file", (_req, res) => {
  res.json({ watchedFile });
});

app.post("/api/watch-file", (req, res) => {
  const raw = req.body?.name;
  if (raw === null || raw === undefined || raw === "") {
    watchedFile = null;
  } else {
    const rel = normalizeWatchName(raw);
    if (!rel) return res.status(400).json({ error: "name must be a workspace-relative *.ly/*.ily path" });
    watchedFile = rel;
  }
  console.log(`  Watch file: ${watchedFile || "(any workspace .ly/.ily)"}`);
  res.json({ watchedFile });
});

// Serialize auto-compiles: latest save wins.
let autoCompiling = false;
let autoPending = null;

async function autoCompileFile(file) {
  if (watchedFile && file !== watchedFile) {
    // Still tell browsers so the UI can offer to switch — never silently ignore a save.
    broadcast({ type: "file-saved", file, at: Date.now() });
    return;
  }
  const target = resolveLy(file);
  if (!target) return;
  if (autoCompiling) {
    autoPending = file;
    return;
  }
  autoCompiling = true;
  try {
    let code;
    try {
      code = await fs.readFile(target.full, "utf8");
    } catch (e) {
      broadcast({ type: "auto-compiled", file, success: false, log: `Read error: ${e.message}`, at: Date.now() });
      return;
    }
    console.log(`  Auto-compiling ${file}…`);
    const result = await compileLilypond(code, file);
    const urls = await publishPreview(result);
    broadcast({
      type: "auto-compiled",
      file,
      success: result.success,
      log: result.log,
      pngUrls: urls.pngUrls,
      pdfUrl: urls.pdfUrl,
      midiUrl: urls.midiUrl,
      pages: result.pngs.length,
      hasMidi: !!result.midi,
      at: Date.now(),
    });
    console.log(`  Auto-compiled ${file}: ${result.success ? "ok" : "ERROR"}`);
  } finally {
    autoCompiling = false;
    if (autoPending) {
      const next = autoPending;
      autoPending = null;
      autoCompileFile(next);
    }
  }
}

function debounceAutoCompile(file) {
  clearTimeout(debounceAutoCompile.timers?.[file]);
  debounceAutoCompile.timers = debounceAutoCompile.timers || {};
  debounceAutoCompile.timers[file] = setTimeout(() => autoCompileFile(file), 300);
}
const sseClients = new Set();
app.get("/api/watch", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

function broadcast(msg) {
  for (const res of sseClients) {
    try {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    } catch (_) {}
  }
}

// Native fs.watch is non-recursive on Linux, so watch every workspace
// subdirectory (chokidar v4 misses events on some filesystems — native is reliable here).
const dirWatchers = new Map(); // abs dir -> FSWatcher

async function listDirs() {
  const out = [WORKSPACE_DIR];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      if (e.isDirectory()) {
        const full = path.join(dir, e.name);
        out.push(full);
        await walk(full);
      }
    }
  }
  await walk(WORKSPACE_DIR);
  return out;
}

function watchDir(dir) {
  if (dirWatchers.has(dir)) return;
  try {
    const w = fssync.watch(dir, (eventType, filename) => {
      if (filename) {
        const rel = path.relative(WORKSPACE_DIR, path.join(dir, filename)).split(path.sep).join("/");
        if (/\.(ly|ily)$/i.test(rel)) debounceAutoCompile(rel);
      }
      // New subdirectory may have appeared — pick it up.
      if (eventType === "rename") ensureDirWatchers();
    });
    w.on("error", (e) => console.warn("watcher error:", e.message));
    dirWatchers.set(dir, w);
  } catch (e) {
    console.warn("watcher disabled:", e.message);
  }
}

async function ensureDirWatchers() {
  for (const dir of await listDirs()) watchDir(dir);
}

ensureDirWatchers();
setInterval(ensureDirWatchers, 15000).unref?.();

app.listen(PORT, () => {
  console.log(`\n  LilyPond workspace: http://localhost:${PORT}`);
  console.log(`  Edit files in ./workspace/**/*.{ly,ily}  (watch enabled, recursive)`);
  console.log(`  Watched file: ${watchedFile || "(any workspace .ly)"} — set via POST /api/watch-file or WATCH_FILE env`);
  console.log(`  Or use the browser editor with automatic preview.\n`);
});
