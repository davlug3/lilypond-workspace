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
const PUBLIC_DIR = path.join(ROOT, "public");

fssync.mkdirSync(WORKSPACE_DIR, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use(express.static(PUBLIC_DIR));

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
  if (!norm.endsWith(".ly") || norm.startsWith("..") || path.isAbsolute(norm)) return null;
  const full = path.join(WORKSPACE_DIR, norm);
  if (full !== WORKSPACE_DIR && !full.startsWith(WORKSPACE_DIR + path.sep)) return null;
  return { full, rel: norm.split(path.sep).join("/") };
}

function runLilypond(inputFile, outPrefix) {
  return new Promise((resolve) => {
    execFile(
      "lilypond",
      ["--png", "--pdf", "-o", outPrefix, inputFile],
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

  const { error, stdout, stderr } = await runLilypond(lyFile, outPrefix);
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
    const existing = await fs.readdir(PUBLIC_DIR);
    await Promise.all(
      existing
        .filter((f) => f.startsWith("preview"))
        .map((f) => fs.rm(path.join(PUBLIC_DIR, f), { force: true }))
    );
    if (result.pdf) {
      await fs.writeFile(path.join(PUBLIC_DIR, "preview.pdf"), result.pdf);
      out.pdfUrl = `/preview.pdf?t=${stamp}`;
    }
    if (result.midi) {
      await fs.writeFile(path.join(PUBLIC_DIR, "preview.midi"), result.midi);
      out.midiUrl = `/preview.midi?t=${stamp}`;
    }
    for (let i = 0; i < result.pngs.length; i++) {
      const fname = result.pngs.length === 1 ? "preview.png" : `preview-page${i + 1}.png`;
      await fs.writeFile(path.join(PUBLIC_DIR, fname), result.pngs[i].data);
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

app.get("/api/files", async (_req, res) => {
  try {
    res.json({ files: await listLyFiles() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/file", async (req, res) => {
  const target = resolveLy(req.query.name);
  if (!target) return res.status(400).json({ error: "missing ?name=*.ly (workspace-relative path)" });
  try {
    const code = await fs.readFile(target.full, "utf8");
    res.json({ name: target.rel, code });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.put("/api/file", async (req, res) => {
  const target = resolveLy(req.query.name || req.body?.name);
  if (!target) return res.status(400).json({ error: "missing ?name=*.ly (workspace-relative path)" });
  try {
    await fs.mkdir(path.dirname(target.full), { recursive: true });
    await fs.writeFile(target.full, String(req.body?.code ?? ""), "utf8");
    res.json({ ok: true, name: target.rel });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Main compile endpoint: { code, name? }
// Returns JSON with data URLs + also writes latest to public/preview.* for direct <img>/<iframe> use.
app.post("/api/compile", async (req, res) => {
  const code = String(req.body?.code ?? "");
  const name = safeName(req.body?.name || "score");
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
    if (!rel) return res.status(400).json({ error: "name must be a workspace-relative *.ly path" });
    watchedFile = rel;
  }
  console.log(`  Watch file: ${watchedFile || "(any workspace .ly)"}`);
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
    const result = await compileLilypond(code, file.replace(/\.ly$/, ""));
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
        if (rel.endsWith(".ly")) debounceAutoCompile(rel);
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
  console.log(`  Edit files in ./workspace/**/*.ly  (watch enabled, recursive)`);
  console.log(`  Watched file: ${watchedFile || "(any workspace .ly)"} — set via POST /api/watch-file or WATCH_FILE env`);
  console.log(`  Or use the browser editor with automatic preview.\n`);
});
