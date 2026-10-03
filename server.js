const { execFile } = require("child_process");
const fs = require("fs/promises");
const fssync = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
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
  // Files like "rock-band-2/full-band.ly" include sibling paths such as
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

// Walk workspace .ly/.ily files and build rel-path -> content map.
async function listSourceFiles() {
  const out = [];
  async function walk(dir, rel) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(path.join(dir, e.name), r);
      else if (e.isFile() && /\.(ly|ily)$/i.test(e.name)) out.push(r);
    }
  }
  await walk(WORKSPACE_DIR, "");
  return out;
}

// Find a compilable .ly wrapper for an .ily fragment.
// 1) sibling .ly in the same directory (legacy behavior)
// 2) any .ly whose \include graph references the .ily (prefer "full", then
//    shallower paths, then alphabetical)
// Returns workspace-relative path or null.
async function resolveIlyWrapper(file) {
  const rel = String(file || "").split(path.sep).join("/");
  if (!/\.ily$/i.test(rel)) return null;
  const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
  const sources = await listSourceFiles();
  const sibling = sources.find((f) => f.toLowerCase().endsWith(".ly") && (dir ? f.startsWith(dir + "/") && !f.slice(dir.length + 1).includes("/") : !f.includes("/")));
  try {
    const ilyFull = path.join(WORKSPACE_DIR, rel);
    const matches = [];
    for (const f of sources) {
      if (!f.toLowerCase().endsWith(".ly")) continue;
      let content;
      try { content = await fs.readFile(path.join(WORKSPACE_DIR, f), "utf8"); } catch (_) { continue; }
      const re = /\\include\s+"([^"]+)"/g;
      let m;
      while ((m = re.exec(content))) {
        const target = path.normalize(path.join(path.dirname(f), m[1])).split(path.sep).join("/");
        if (target === rel) { matches.push(f); break; }
      }
    }
    if (matches.length) {
      matches.sort((a, b) => {
        const fa = /full/i.test(a) ? 0 : 1;
        const fb = /full/i.test(b) ? 0 : 1;
        if (fa !== fb) return fa - fb;
        const da = a.split("/").length, db = b.split("/").length;
        if (da !== db) return da - db;
        return a.localeCompare(b);
      });
      return matches[0];
    }
  } catch (_) { /* fall through */ }
  return sibling || null;
}

// Playback must always be possible: if the submitted code has a \score but
// no \midi block, append an empty one inside the first \score's braces so
// every successful compile yields a playable MIDI. Comments are ignored
// when checking; insertion is brace-matched, not regex-guessed.
function ensureMidiBlock(code) {
  const src = String(code || "");
  const stripped = src.replace(/%[^\n]*/g, "");
  if (!/\\score\b/.test(stripped) || /\\midi\b/.test(stripped)) return src;
  const m = /\\score\s*\{/.exec(src);
  if (!m) return src;
  let depth = 0;
  for (let i = m.index + m[0].length - 1; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return `${src.slice(0, i)}\n  \\midi { }\n${src.slice(i)}`;
    }
  }
  return src;
}

// Crop a PNG buffer to the bounding box of its non-background content
// (LilyPond renders full pages; the UI wants just the music). Pure JS:
// parses IHDR/IDAT, un-filters scanlines, re-encodes the crop. Only
// 8-bit non-interlaced gray/RGB/RGBA; anything else (or any failure)
// returns the input untouched — never let trimming break a compile.
const PNG_CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  let crc = -1;
  for (let i = 0; i < body.length; i++) crc = PNG_CRC_TABLE[(crc ^ body[i]) & 0xff] ^ (crc >>> 8);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE((crc ^ -1) >>> 0);
  return Buffer.concat([len, body, tail]);
}

function trimPngMargins(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const keep = () => buf;
  try {
    if (buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47) return keep();
    let pos = 8, width = 0, height = 0, depth = 0, color = 0, idat = [];
    while (pos + 8 <= buf.length) {
      const len = buf.readUInt32BE(pos), type = buf.toString("latin1", pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === "IHDR") {
        width = data.readUInt32BE(0); height = data.readUInt32BE(4);
        depth = data[8]; color = data[9];
        if (data[12] !== 0) return keep(); // interlaced: bail
      } else if (type === "IDAT") {
        idat.push(data);
      } else if (type === "IEND") {
        break;
      }
      pos += 12 + len;
    }
    if (depth !== 8 || width <= 0 || height <= 0 || !idat.length) return keep();
    const bpp = color === 0 ? 1 : color === 2 ? 3 : color === 6 ? 4 : 0;
    if (!bpp) return keep();
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = width * bpp;
    if (raw.length < (stride + 1) * height) return keep();
    // Un-filter scanlines in place.
    const px = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) {
      const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
      const prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
      const out = px.subarray(y * stride, (y + 1) * stride);
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? out[x - bpp] : 0;
        const b = prev ? prev[x] : 0;
        const c = prev && x >= bpp ? prev[x - bpp] : 0;
        let v = row[x];
        if (f === 1) v += a;
        else if (f === 2) v += b;
        else if (f === 3) v += (a + b) >> 1;
        else if (f === 4) {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        out[x] = v & 0xff;
      }
    }
    // Background = most common corner color; content = anything else.
    const at = (x, y) => px.subarray((y * width + x) * bpp, (y * width + x) * bpp + bpp).join(",");
    const votes = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
    const bg = votes.sort((a, b) =>
      votes.filter((v) => v === a).length - votes.filter((v) => v === b).length).pop();
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (at(x, y) === bg) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return keep(); // blank page
    const pad = 6;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(width - 1, x1 + pad); y1 = Math.min(height - 1, y1 + pad);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    if (cw >= width && ch >= height) return keep();
    const out = Buffer.alloc((cw * bpp + 1) * ch);
    for (let y = 0; y < ch; y++) {
      out[y * (cw * bpp + 1)] = 0;
      px.copy(out, y * (cw * bpp + 1) + 1, ((y0 + y) * width + x0) * bpp, ((y0 + y) * width + x0) * bpp + cw * bpp);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(cw, 0); ihdr.writeUInt32BE(ch, 4);
    ihdr[8] = 8; ihdr[9] = color;
    // Split IDAT into 8KB chunks (as LilyPond does): some decoders balk at
    // one giant IDAT.
    const deflated = zlib.deflateSync(out);
    const idats = [];
    for (let i = 0; i < deflated.length; i += 8192) {
      idats.push(pngChunk("IDAT", deflated.subarray(i, i + 8192)));
    }
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk("IHDR", ihdr),
      ...idats,
      pngChunk("IEND", Buffer.alloc(0)),
    ]);
  } catch (_) {
    return keep();
  }
}

async function compileLilypond(code, name = "score") {
  code = ensureMidiBlock(code);
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
    // Crop each page to the music extents (full-page margins trimmed).
    for (const p of pngs) {
      try { p.data = trimPngMargins(p.data); } catch (_) { /* keep original */ }
    }
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
        // Keep empty folders too: folder CRUD needs them visible.
        if (sub) dirs.push(sub);
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

// ---- Generic workspace entries (folder CRUD backing) ----
// Any-depth, files or folders; always contained in the workspace.
function resolveEntry(raw) {
  const norm = path.normalize(String(raw || ""));
  if (!norm || norm === "." || norm.startsWith("..") || path.isAbsolute(norm)) return null;
  const full = path.join(WORKSPACE_DIR, norm);
  if (full !== WORKSPACE_DIR && !full.startsWith(WORKSPACE_DIR + path.sep)) return null;
  return { full, rel: norm.split(path.sep).join("/") };
}

// Section/token names inside sections/ become LilyPond variable names
// (<prefix><SectionCap>), and LilyPond command names end at the first
// digit — \leadV1A parses as \leadV + "1A". Refuse such names at the tree
// boundary so a rename can never silently (or loudly) break the song.
// (The band API's validBandWord still permits digits: pre-existing hole.)
function bandSectionsNameError(rel) {
  const m = String(rel || "").match(/^[^/]+\/sections\/([^/]+)(?:\/([^/]+))?$/);
  if (!m) return null;
  if (!/^[A-Za-z]+$/.test(m[1])) return `section names must be letters only ("${m[1]}" would break variable references)`;
  if (m[2] && (!m[2].endsWith(".ily") || !/^[A-Za-z]+\.ily$/.test(m[2]))) {
    return `token files must be letters-only .ily names ("${m[2]}" would break variable references)`;
  }
  return null;
}

// Create a folder (parents included).
app.post("/api/folder", async (req, res) => {
  const target = resolveEntry(req.body?.path || req.query.path);
  if (!target) return res.status(400).json({ error: "invalid path (workspace-relative)" });
  const nameErr = bandSectionsNameError(target.rel);
  if (nameErr) return res.status(400).json({ error: nameErr });
  try {
    await fs.mkdir(target.full, { recursive: true });
    const reconciled = await reconcileOwners([target.rel]);
    res.json({ ok: true, path: target.rel, reconciled });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rename / move an entry within the workspace.
app.post("/api/move", async (req, res) => {
  const from = resolveEntry(req.body?.from);
  const to = resolveEntry(req.body?.to);
  if (!from || !to) return res.status(400).json({ error: "invalid from/to (workspace-relative)" });
  if (from.rel === to.rel) return res.status(400).json({ error: "source and destination are the same" });
  if (to.rel === from.rel || to.rel.startsWith(from.rel + "/")) {
    return res.status(400).json({ error: "cannot move an entry into itself" });
  }
  // Destinations inside sections/ become variable names: refuse names that
  // would break LilyPond references. (Renaming away from such a name heals.)
  const toErr = bandSectionsNameError(to.rel);
  if (toErr) return res.status(400).json({ error: toErr });
  try {
    await fs.stat(from.full);
  } catch (_) {
    return res.status(404).json({ error: `not found: ${from.rel}` });
  }
  try {
    await fs.lstat(to.full);
    return res.status(409).json({ error: `already exists: ${to.rel}` });
  } catch (_) { /* free */ }
  try {
    await fs.mkdir(path.dirname(to.full), { recursive: true });
    await fs.rename(from.full, to.full);
    const varsFixed = await bandFixMovedVars(from.rel, to.rel);
    const reconciled = await reconcileOwners([from.rel, to.rel]);
    res.json({ ok: true, from: from.rel, to: to.rel, varsFixed, reconciled });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete an entry at any depth (files or folders, recursive).
app.delete("/api/entry", async (req, res) => {
  const target = resolveEntry(req.query.name || req.body?.name);
  if (!target) return res.status(400).json({ error: "invalid name (workspace-relative)" });
  try {
    await fs.rm(target.full, { recursive: true, force: true });
    const reconciled = await reconcileOwners([target.rel]);
    res.json({ ok: true, name: target.rel, reconciled });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Band projects: sections/<section>/<token>.ily + full-band.ly stitch ----
// A band project is a workspace entry with sections/<section>/*.ily token
// files and a full-band.ly wrapper that \includes them and stitches
// <x>Full variables. The wrapper's include order is the section/token order
// source of truth; rewrites preserve it and append new entries at the end.

function validBandWord(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,23}$/.test(s)) return null;
  if (s === "shared" || s === "sections") return null;
  return s;
}

function bandPaths(project) {
  const norm = path.normalize(String(project || ""));
  if (!norm || norm === "." || norm.startsWith("..") || path.isAbsolute(norm) || norm.includes(path.sep)) return null;
  const root = path.join(WORKSPACE_DIR, norm);
  if (root !== WORKSPACE_DIR && !root.startsWith(WORKSPACE_DIR + path.sep)) return null;
  return { name: norm, root, wrapper: path.join(root, "full-band.ly"), sectionsDir: path.join(root, "sections") };
}

function lilyCap(s) {
  const t = String(s || "").replace(/[^A-Za-z0-9]/g, "");
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

// Canonical variable prefix per token file. New (custom) tokens use their own
// name as prefix, so horns.ily defines hornsVerse/hornsChorus/hornsFull.
const BAND_TOKEN_PREFIX = { guitar: "guitar", keys: "piano", drums: "drum", bass: "bass", vocals: "lead", backing: "backing", rhythm: "rhythm" };
function bandPrefixFor(token) { return BAND_TOKEN_PREFIX[token] || token; }

// Stitch definitions per token: [{ full, words, ref(sectionCap) }].
function bandStitchDefs(token) {
  if (token === "keys") return [
    { full: "pianoFullRH", ref: (c) => `piano${c}RH` },
    { full: "pianoFullLH", ref: (c) => `piano${c}LH` },
  ];
  if (token === "drums") return [
    { full: "drumFullHands", ref: (c) => `drum${c}Hands` },
    { full: "drumFullFeet", ref: (c) => `drum${c}Feet` },
  ];
  if (token === "vocals") return [
    { full: "leadFull", ref: (c) => `lead${c}` },
    { full: "leadWordsFull", words: true, ref: (c) => `leadWords${c}` },
  ];
  if (token === "backing") return [
    { full: "backingFull", ref: (c) => `backing${c}` },
    { full: "backingWordsFull", words: true, ref: (c) => `backingWords${c}` },
  ];
  const p = bandPrefixFor(token);
  return [{ full: `${p}Full`, ref: (c) => `${p}${c}` }];
}

// Reserved token file: sections/<sec>/globals.ily optionally defines
// globals<SectionCap> = { ... } — a self-contained setup (key/time/tempo)
// that the wrapper emits in place of \global (pitched) or \drumGlobal
// (drums) for that section. Never an instrument: excluded from tokens,
// staves, drift token lists and solo-render targets everywhere.
const BAND_GLOBALS_TOKEN = "globals";
function bandGlobalsVar(section) { return `globals${lilyCap(section)}`; }

// Raw disk scan: sections with their .ily token files. Needs no wrapper,
// so wrapper-less projects (rebuild UI) can use it too.
async function bandScanSections(bp) {
  let entries;
  try { entries = await fs.readdir(bp.sectionsDir, { withFileTypes: true }); } catch (_) { return null; }
  const sections = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    let files;
    try { files = await fs.readdir(path.join(bp.sectionsDir, e.name)); } catch (_) { continue; }
    const ily = files.filter((f) => f.endsWith(".ily"));
    sections.push({
      name: e.name,
      tokens: ily.map((f) => f.slice(0, -4)).filter((t) => t !== BAND_GLOBALS_TOKEN).sort(),
      hasGlobalsFile: ily.includes(`${BAND_GLOBALS_TOKEN}.ily`),
    });
  }
  return sections;
}

// Include paths referenced by a wrapper body.
function bandWrapperIncludes(text) {
  const out = [];
  for (const m of String(text || "").matchAll(/\\include\s+"([^"]+)"/g)) out.push(m[1]);
  return out;
}

async function bandStructure(project) {
  const bp = bandPaths(project);
  if (!bp) return null;
  const sections = await bandScanSections(bp);
  if (!sections) return null;
  try { await fs.stat(bp.wrapper); } catch (_) { return null; }
  // Order from the wrapper's include lines; unknown dirs/files append alphabetically.
  // The reserved globals.ily never orders tokens (it is not an instrument).
  let secOrder = [], tokOrder = [];
  try {
    const w = await fs.readFile(bp.wrapper, "utf8");
    for (const m of w.matchAll(/\\include\s+"sections\/([^"/]+)\/([^"/]+)\.ily"/g)) {
      if (m[2] === BAND_GLOBALS_TOKEN) { if (!secOrder.includes(m[1])) secOrder.push(m[1]); continue; }
      if (!secOrder.includes(m[1])) secOrder.push(m[1]);
      if (!tokOrder.includes(m[2])) tokOrder.push(m[2]);
    }
  } catch (_) {}
  sections.sort((a, b) =>
    (secOrder.indexOf(a.name) === -1 ? 1e9 : secOrder.indexOf(a.name)) -
    (secOrder.indexOf(b.name) === -1 ? 1e9 : secOrder.indexOf(b.name)) ||
    a.name.localeCompare(b.name));
  for (const s of sections) s.tokens.sort((a, b) =>
    (tokOrder.indexOf(a) === -1 ? 1e9 : tokOrder.indexOf(a)) -
    (tokOrder.indexOf(b) === -1 ? 1e9 : tokOrder.indexOf(b)) ||
    a.localeCompare(b));
  const tokens = [];
  for (const t of tokOrder) if (sections.some((s) => s.tokens.includes(t)) && !tokens.includes(t)) tokens.push(t);
  for (const s of sections) for (const t of s.tokens) if (!tokens.includes(t)) tokens.push(t);
  // Drift: wrapper includes vs files on disk. `missing` is included but
  // gone (loud compile error); `unlisted` is on disk but never included
  // (silently never plays). Only sections/* + shared includes count —
  // globals.ily included: it is drift like any other file.
  let incs = [];
  let wrapperText = "";
  try { wrapperText = await fs.readFile(bp.wrapper, "utf8"); incs = bandWrapperIncludes(wrapperText); } catch (_) {}
  const onDisk = new Set();
  for (const s of sections) {
    for (const t of s.tokens) onDisk.add(`sections/${s.name}/${t}.ily`);
    if (s.hasGlobalsFile) onDisk.add(`sections/${s.name}/${BAND_GLOBALS_TOKEN}.ily`);
  }
  try { await fs.stat(path.join(bp.root, "shared", "shared.ily")); onDisk.add("shared/shared.ily"); } catch (_) {}
  const inWrapper = new Set(incs.filter((p) => p === "shared/shared.ily" || p.startsWith("sections/")));
  const missing = [...inWrapper].filter((p) => !onDisk.has(p)).sort();
  const unlisted = [...onDisk].filter((p) => !inWrapper.has(p)).sort();
  // Per-section setup overrides: valid when globals.ily defines
  // globals<SectionCap>. Present-but-wrong names are reported, never applied.
  const globalsBodies = await bandReadGlobals(bp, sections.map((s) => s.name));
  const overrides = sections.filter((s) => bandGlobalsValid(globalsBodies, s.name)).map((s) => s.name).sort();
  const globalsIssues = sections
    .filter((s) => s.hasGlobalsFile && !bandGlobalsValid(globalsBodies, s.name))
    .map((s) => `sections/${s.name}/globals.ily does not define ${bandGlobalsVar(s.name)} (override ignored)`);
  for (const s of sections) s.hasGlobals = overrides.includes(s.name);
  // A \key override never reaches the ChordNames context (key changes are
  // staff-local), so chord names would show the old key. Warn instead of
  // silently corrupting the chord grid.
  const hasChordNames = /\\new\s+ChordNames/.test(wrapperText);
  const chordKeyWarn = hasChordNames ? overrides.filter((s) => bandGlobalsHasKey(globalsBodies, s)) : [];
  return {
    project: bp.name, wrapper: `${bp.name}/full-band.ly`, sections, tokens,
    drift: { missing, unlisted }, overrides, globalsIssues, chordKeyWarn,
  };
}

// Placeholder music for a new <token> in <section>: 4 bars of rests
// (pitched whole-notes for sung tokens so lyrics attach). Mirrors each
// family's conventions (\global, clefs, \voiceOne/Two, lyrics).
function bandScaffold(token, section) {
  const C = lilyCap(section);
  const head = `% ${section} — ${token} token. Scaffold placeholder: replace with real music.`;
  if (token === "keys") return `${head}\npiano${C}RH = \\relative c' {\n  \\global\n  R1 | R1 | R1 | R1 |\n}\n\npiano${C}LH = \\relative c {\n  \\global\n  \\clef bass\n  R1 | R1 | R1 | R1 |\n}\n`;
  if (token === "drums") return `${head}\ndrum${C}Hands = \\drummode {\n  \\voiceOne\n  R1 | R1 | R1 | R1 |\n}\n\ndrum${C}Feet = \\drummode {\n  \\voiceTwo\n  R1 | R1 | R1 | R1 |\n}\n`;
  if (token === "vocals") return `${head}\nlead${C} = \\relative c' {\n  \\global\n  e1 | e1 | e1 | e1 |\n}\n\nleadWords${C} = \\lyricmode {\n  la __ la __ la __ la __\n}\n`;
  if (token === "backing") return `${head}\nbacking${C} = \\relative c' {\n  \\global\n  e1 | e1 | e1 | e1 |\n}\n\nbackingWords${C} = \\lyricmode {\n  ooh __ ooh __ ooh __ ooh __\n}\n`;
  if (token === "bass") return `${head}\nbass${C} = \\relative c {\n  \\global\n  \\clef bass\n  R1 | R1 | R1 | R1 |\n}\n`;
  const p = bandPrefixFor(token);
  return `${head}\n${p}${C} = \\relative c' {\n  \\global\n  R1 | R1 | R1 | R1 |\n}\n`;
}

function bandIntroPlaceholder(token, section) {
  return `% ${section} — ${token} token. Scaffold placeholder.\n% Replace with real ${section} material; once its variables are defined,\n% full-band.ly stitches them in automatically.\n`;
}

// Regenerate full-band.ly includes + <x>Full stitches + lead voice from disk.
// - include order: existing wrapper order, new sections/tokens appended
// - stitch refs: only variables actually defined in the section token file
//   (comment-only placeholders contribute nothing)
// - lead voice: section-ordered (A/B split when defined, else single var)
async function bandReadBodies(bp, secs, toks) {
  const bodies = {};
  for (const s of secs) for (const t of toks) {
    try { bodies[`${s}/${t}`] = await fs.readFile(path.join(bp.sectionsDir, s, `${t}.ily`), "utf8"); }
    catch (_) { bodies[`${s}/${t}`] = null; }
  }
  return bodies;
}

function bandDefines(bodies, sec, tok, v) {
  const b = bodies[`${sec}/${tok}`];
  return !!b && new RegExp(`(^|\\n)\\s*${v}\\s*=`).test(b);
}

// Bodies of sections/<sec>/globals.ily, keyed by section ({sec: body|null}).
async function bandReadGlobals(bp, secs) {
  const out = {};
  for (const s of secs) {
    try { out[s] = await fs.readFile(path.join(bp.sectionsDir, s, `${BAND_GLOBALS_TOKEN}.ily`), "utf8"); }
    catch (_) { out[s] = null; }
  }
  return out;
}

// A globals file only counts when it defines globals<SectionCap>; a wrong
// name would collide or sit unused, so it is reported, never applied.
function bandGlobalsValid(globalsBodies, sec) {
  const b = globalsBodies[sec];
  return !!b && new RegExp(`(^|\\n)\\s*${bandGlobalsVar(sec)}\\s*=`).test(b);
}

function bandGlobalsHasKey(globalsBodies, sec) {
  const b = globalsBodies[sec];
  return !!b && /\\key\b/.test(String(b).replace(/%[^\n]*/g, ""));
}

// Stitch lines for every token's <x>Full vars, referencing only variables
// actually defined in the section files. Setup is per section: the override
// globals<Sec> when valid, else the family base (\global, or \drumGlobal
// for drums). Lyrics (\lyricmode) never take a setup prefix.
// Overrides must be self-contained: a back-to-back "\global \globalsX"
// pair applies two tempo/key changes at the same moment and LilyPond
// discards one, so exactly one setup var is emitted per section.
function bandStitchBlock(bodies, secs, toks, opts = {}) {
  const overrides = opts.overrides || new Set();
  const drumBase = opts.drumBase || "\\drumGlobal";
  const setupFor = (t, s) => overrides.has(s) ? `\\${bandGlobalsVar(s)}` : (t === "drums" ? drumBase : "\\global");
  const contributing = secs.filter((s) => toks.some((t) => bandStitchDefs(t).some((d) => bandDefines(bodies, s, t, d.ref(lilyCap(s))))));
  const stitchBlock = [`% Stitched variables: full-band view = ${(contributing.length ? contributing : secs).join(" + ")}.`];
  if (overrides.size) stitchBlock.push(`% Setup overrides: ${[...overrides].sort().join(", ")}.`);
  for (const t of toks) {
    for (const d of bandStitchDefs(t)) {
      const parts = [];
      for (const s of secs) {
        if (!bandDefines(bodies, s, t, d.ref(lilyCap(s)))) continue;
        if (!d.words) parts.push(`${setupFor(t, s)} \\${d.ref(lilyCap(s))}`);
        else parts.push(`\\${d.ref(lilyCap(s))}`);
      }
      stitchBlock.push(d.words
        ? `${d.full} = \\lyricmode {${parts.length ? ` ${parts.join(" ")} ` : " "}}`
        : `${d.full} = {${parts.length ? ` ${parts.join(" ")} ` : ""}}`);
    }
  }
  return stitchBlock;
}

// Section-ordered lead-voice body lines (A/B split when defined, else
// single var), each section group prefixed with its setup var.
function bandLeadVoiceBody(bodies, secs, opts = {}) {
  const overrides = opts.overrides || new Set();
  const lines = [];
  for (const s of secs) {
    const C = lilyCap(s);
    const hasA = bandDefines(bodies, s, "vocals", `lead${C}A`), hasB = bandDefines(bodies, s, "vocals", `lead${C}B`);
    let entries = [];
    if (hasA || hasB) { if (hasA) entries.push(`\\lead${C}A`); if (hasB) entries.push(`\\lead${C}B`); }
    else if (bandDefines(bodies, s, "vocals", `lead${C}`)) entries.push(`\\lead${C}`);
    if (!entries.length) continue;
    const setup = overrides.has(s) ? `\\${bandGlobalsVar(s)}` : "\\global";
    lines.push(`        ${setup} ${entries.join(" \\break ")}`);
  }
  if (!lines.length) return "        R1";
  return lines.join(" \\break\n");
}

// Section-ordered lead-voice entries (A/B split when defined, else single).
function bandLeadVoiceEntries(bodies, secs) {
  const entries = [];
  for (const s of secs) {
    const C = lilyCap(s);
    const hasA = bandDefines(bodies, s, "vocals", `lead${C}A`), hasB = bandDefines(bodies, s, "vocals", `lead${C}B`);
    if (hasA || hasB) { if (hasA) entries.push(`\\lead${C}A`); if (hasB) entries.push(`\\lead${C}B`); }
    else if (bandDefines(bodies, s, "vocals", `lead${C}`)) entries.push(`\\lead${C}`);
  }
  return entries;
}

async function rewriteBandWrapper(project, secOrder, tokOrder) {
  const bp = bandPaths(project);
  const text = await fs.readFile(bp.wrapper, "utf8");
  const info = await bandStructure(project);
  if (!info) throw new Error("not a band project");
  const secs = info.sections.map((s) => s.name);
  if (secOrder) {
    const known = new Set(secs);
    secs.length = 0;
    for (const s of secOrder) if (known.has(s)) secs.push(s);
    for (const s of info.sections.map((x) => x.name)) if (!secs.includes(s)) secs.push(s);
  }
  const toks = info.tokens.slice();
  if (tokOrder) {
    const known = new Set(toks);
    toks.length = 0;
    for (const t of tokOrder) if (known.has(t)) toks.push(t);
    for (const t of info.tokens) if (!toks.includes(t)) toks.push(t);
  }
  const bodies = await bandReadBodies(bp, secs, toks);
  const globalsBodies = await bandReadGlobals(bp, secs);
  const overrides = new Set(secs.filter((s) => bandGlobalsValid(globalsBodies, s)));
  const drumBase = Object.values(bodies).filter(Boolean).some((b) => /(^|\n)\s*drumGlobal\s*=/.test(b))
    ? "\\drumGlobal" : "\\global";

  const lines = text.split("\n");
  // 1) include block: first shared include .. last sections include
  const isSharedInc = (l) => /\\include\s+"shared\/shared\.ily"/.test(l);
  const isSecInc = (l) => /\\include\s+"sections\/[^"]+\.ily"/.test(l);
  const iStart = lines.findIndex(isSharedInc);
  let iEnd = -1;
  lines.forEach((l, i) => { if (isSecInc(l)) iEnd = i; });
  const incBlock = [];
  try { await fs.stat(path.join(bp.root, "shared", "shared.ily")); incBlock.push(`\\include "shared/shared.ily"`); } catch (_) {}
  // Preserve hand-written includes (anything that is neither the shared nor
  // a sections include), so a restitch never deletes them.
  if (iStart !== -1 && iEnd !== -1 && iEnd >= iStart) {
    for (let i = iStart; i <= iEnd; i++) {
      const l = lines[i].trim();
      if (l && !isSharedInc(lines[i]) && !isSecInc(lines[i]) && !incBlock.includes(l)) incBlock.push(l);
    }
  }
  for (const s of secs) {
    if (globalsBodies[s] !== null) incBlock.push(`\\include "sections/${s}/${BAND_GLOBALS_TOKEN}.ily"`);
    for (const t of toks) {
      if (bodies[`${s}/${t}`] !== null) incBlock.push(`\\include "sections/${s}/${t}.ily"`);
    }
  }
  if (iStart !== -1 && iEnd !== -1 && iEnd >= iStart) lines.splice(iStart, iEnd - iStart + 1, ...incBlock);
  else {
    const vIdx = lines.findIndex((l) => l.startsWith("\\version"));
    lines.splice(vIdx === -1 ? 0 : vIdx + 1, 0, ...incBlock);
  }

  // 2) stitch block: consecutive top-level "<var> = {" / "<var> = \lyricmode"
  // lines (covers guitarFull, pianoFullRH/LH, drumFullHands/Feet, *WordsFull)
  const isStitch = (l) => /^\s*[A-Za-z]\w*\s*=\s*(\{|\\lyricmode)/.test(l);
  const sStart0 = lines.findIndex(isStitch);
  let sStart = sStart0, sEnd = sStart0;
  if (sStart !== -1) {
    while (sEnd + 1 < lines.length && isStitch(lines[sEnd + 1])) sEnd++;
    // Swallow our own "% Stitched variables" header(s) so rewrites replace
    // the whole region instead of stacking a new header each time.
    while (sStart - 1 >= 0 && /^%\s*(Stitched variables|Setup overrides)/.test(lines[sStart - 1])) sStart--;
  }
  const stitchBlock = bandStitchBlock(bodies, secs, toks, { overrides, drumBase });
  if (sStart !== -1) lines.splice(sStart, sEnd - sStart + 1, ...stitchBlock);
  else {
    const anchor = lines.findIndex((l) => l.startsWith("#(set-global-staff-size") || l.startsWith("\\header"));
    lines.splice(anchor === -1 ? lines.length : anchor, 0, ...stitchBlock, "");
  }

  // 3) lead voice (only while the vocals token exists)
  if (toks.includes("vocals")) {
    const body = bandLeadVoiceBody(bodies, secs, { overrides });
    const joined = lines.join("\n").replace(
      /\\new Voice = "lead" \{[\s\S]*?\n(\s*)\}/,
      (_m, indent) => `\\new Voice = "lead" {\n${body}\n${indent}}`
    );
    lines.length = 0;
    lines.push(...joined.split("\n"));
  }

  await fs.writeFile(bp.wrapper, lines.join("\n"), "utf8");
}

// Score insertion index for a new staff: before DrumStaff, else before the
// score's closing >>. -1 when no insertion point exists.
function bandScoreInsertIndex(lines) {
  let at = lines.findIndex((l) => l.includes("\\new DrumStaff"));
  if (at === -1) {
    const layoutIdx = lines.findIndex((l) => /^\s*\\layout\b/.test(l));
    for (let i = layoutIdx === -1 ? lines.length - 1 : layoutIdx; i >= 0; i--) {
      if (/^\s*>>\s*$/.test(lines[i])) { at = i; break; }
    }
  }
  return at;
}

// Score Staff block for a newly added (custom) token, tagged for later removal.
function bandStaffBlock(token, label, midi, clef, fullVar) {
  const safeLabel = String(label || token).replace(/["\\\n\r]/g, "").slice(0, 40) || token;
  const safeMidi = String(midi || "acoustic grand").replace(/["\\\n\r]/g, "").slice(0, 60) || "acoustic grand";
  const safeClef = ["treble", "bass", "alto", "tenor", "treble_8"].includes(clef) ? clef : "treble";
  return [
    `    % token:${token} (managed)`,
    `    \\new Staff \\with {`,
    `      instrumentName = "${safeLabel}"`,
    `      midiInstrument = "${safeMidi}"`,
    `    } {`,
    `      \\clef "${safeClef}"`,
    `      \\${fullVar}`,
    `    }`,
  ];
}

// End line (inclusive) of the Staff-like block starting at lines[startIdx].
// Counts { } and << >> so PianoStaff (<< >>) blocks resolve correctly.
function bandBlockEnd(lines, startIdx) {
  let depth = 0, seen = false;
  for (let i = startIdx; i < lines.length; i++) {
    const l = lines[i];
    depth += (l.match(/<</g) || []).length + (l.match(/\{/g) || []).length
      - (l.match(/>>/g) || []).length - (l.match(/\}/g) || []).length;
    if (depth > 0) seen = true;
    if (seen && depth <= 0) return i;
  }
  return startIdx;
}

// Top-level \score children, independent of indentation: scan the score's
// << ... >> region tracking bracket depth; \new ... lines at depth 0 are
// top-level blocks (nested `\new Staff = "upper"` lines sit deeper and can
// never match). A block start must open with { or << on its own line.
function bandScoreTopBlocks(lines) {
  const scoreIdx = lines.findIndex((l) => /^\s*\\score\s*\{/.test(l));
  if (scoreIdx === -1) return { blocks: [], lyrics: [] };
  let openIdx = -1;
  for (let i = scoreIdx; i < lines.length; i++) {
    if (lines[i].includes("<<")) { openIdx = i; break; }
  }
  if (openIdx === -1) return { blocks: [], lyrics: [] };
  const depthOf = (l) => {
    const opens = (l.match(/<</g) || []).length + (l.match(/\{/g) || []).length;
    const closes = (l.match(/>>/g) || []).length + (l.match(/\}/g) || []).length;
    return opens - closes;
  };
  const isTopStaff = (l) => /^\s*\\new\s+(Staff|TabStaff|DrumStaff|PianoStaff)(\s|\\|$)/.test(l)
    && !/\\new\s+Staff\s*=/.test(l) && (l.includes("{") || l.includes("<<"));
  const blocks = [], lyrics = [];
  let depth = 0;
  for (let i = openIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (depth === 0) {
      if (/^\s*>>/.test(l)) break; // score music list closed
      if (isTopStaff(l)) blocks.push({ start: i, end: bandBlockEnd(lines, i) });
      else if (/^\s*\\new\s+Lyrics\b/.test(l)) lyrics.push(i);
    }
    depth += depthOf(l);
    if (depth < 0) break;
  }
  return { blocks, lyrics };
}

// Remove score Staff/Lyrics material for a deleted token: the managed block
// when present, else legacy top-level blocks referencing the token's
// <x>Full variables. Never touches nested lines, so reformatted wrappers
// can't be corrupted — at worst a block is left behind (a compile error,
// not silent damage).
function bandRemoveTokenFromScore(lines, token) {
  const vars = bandStitchDefs(token).map((d) => d.full);
  if (token === "drums") vars.push("drumGlobal");
  const tagIdx = lines.findIndex((l) => l.trim() === `% token:${token} (managed)`);
  if (tagIdx !== -1) {
    let s = tagIdx + 1;
    while (s < lines.length && !lines[s].trim()) s++;
    lines.splice(tagIdx, bandBlockEnd(lines, s) - tagIdx + 1);
    return;
  }
  const mentions = (txt) => vars.some((v) => txt.includes(`\\${v}`)) || (token === "vocals" && txt.includes('= "lead"'));
  // Collect every cut first, then splice descending: splicing blocks shifts
  // all later line indices, so splicing lyrics afterward with stale indices
  // would miss (this previously left backing/vocal Lyrics lines behind).
  const { blocks, lyrics } = bandScoreTopBlocks(lines);
  const cuts = [];
  for (const { start, end } of blocks) {
    if (mentions(lines.slice(start, end + 1).join("\n"))) cuts.push([start, end]);
  }
  for (const i of lyrics) {
    if (vars.some((v) => lines[i].includes(`\\${v}`))) cuts.push([i, i]);
  }
  cuts.sort((a, b) => b[0] - a[0]);
  for (const [s, e] of cuts) lines.splice(s, e - s + 1);
}

// ---- Solo render: one sections/<section>/<token>.ily on its own ----
// A section token is a fragment (\global etc. come from shared/shared.ily),
// so "render this section only" synthesizes a minimal wrapper: the right
// staff context per instrument family, playing just this file's root
// variables (defined vars not referenced by siblings in the same file).
// Full-var -> token for the built-in instruments (custom tokens use their
// own name as prefix, resolved structurally below).
const BAND_FULL_TOKEN = {
  pianoFullRH: "keys", pianoFullLH: "keys",
  drumFullHands: "drums", drumFullFeet: "drums",
  leadFull: "vocals", leadWordsFull: "vocals",
  backingFull: "backing", backingWordsFull: "backing",
  guitarFull: "guitar", rhythmFull: "rhythm", bassFull: "bass",
};

// Remove score material for tokens with no .ily files left on disk (e.g.
// every file deleted via the tree). Candidates come from the wrapper's
// includes AND from Full vars the score plays: the latter catches staves
// orphaned gradually (last file deleted after its include was already
// healed away). Reuses the tested bandRemoveTokenFromScore path.
async function bandPruneOrphanTokens(project) {
  const bp = bandPaths(project);
  if (!bp) return [];
  const sections = await bandScanSections(bp);
  if (!sections) return [];
  let raw;
  try { raw = await fs.readFile(bp.wrapper, "utf8"); } catch (_) { return []; }
  const lines = raw.split("\n");
  const scoreIdx = lines.findIndex((l) => /^\s*\\score\s*\{/.test(l));
  const scoreText = lines.slice(scoreIdx === -1 ? 0 : scoreIdx).join("\n");
  const candidates = new Set();
  for (const m of raw.matchAll(/\\include\s+"sections\/([^"/]+)\/([^"/]+)\.ily"/g)) {
    if (m[2] !== BAND_GLOBALS_TOKEN) candidates.add(m[2]);
  }
  for (const m of scoreText.matchAll(/\\([A-Za-z][A-Za-z0-9]*Full(?:RH|LH|Hands|Feet)?)\b/g)) {
    const v = m[1];
    if (BAND_FULL_TOKEN[v]) { candidates.add(BAND_FULL_TOKEN[v]); continue; }
    const p = v.replace(/Full(?:RH|LH|Hands|Feet|Words)?$/, "");
    if (p && p !== v && (new RegExp(`^${p}Full\\s*=`, "m").test(raw)
      || lines.some((l) => l.trim() === `% token:${p} (managed)`))) candidates.add(p);
  }
  const onDisk = new Set(sections.flatMap((s) => s.tokens));
  const orphans = [...candidates].filter((t) => !onDisk.has(t));
  if (!orphans.length) return [];
  for (const t of orphans) bandRemoveTokenFromScore(lines, t);
  await fs.writeFile(bp.wrapper, lines.join("\n"), "utf8");
  return orphans.sort();
}

// Keep section-scoped variables in sync after a tree move: when a move
// crosses sections (section-folder rename, cross-section file move) or
// renames a token file, <prefix><SectionCap>* variables follow the new
// name. Without this the music is orphaned: stitches reference the new
// name while the file still defines the old one.
async function bandFixMovedVars(fromRel, toRel) {
  const fixed = [];
  const fp = String(fromRel || "").split("/"), tp = String(toRel || "").split("/");
  if (fp.length < 3 || tp.length < 3 || fp[1] !== "sections" || tp[1] !== "sections") return fixed;
  if (fp[0] !== tp[0]) return fixed;
  const bp = bandPaths(fp[0]);
  if (!bp) return fixed;
  try { await fs.stat(bp.wrapper); } catch (_) { return fixed; }
  const fromSec = fp[2], toSec = tp[2];
  const jobs = [];
  try {
    const st = await fs.stat(path.join(WORKSPACE_DIR, toRel));
    if (st.isDirectory() && fp.length === 3 && tp.length === 3 && fromSec !== toSec) {
      // Section-folder rename: every token file follows the new section name.
      const files = await fs.readdir(path.join(WORKSPACE_DIR, toRel));
      for (const f of files) {
        if (!f.endsWith(".ily")) continue;
        const tok = f.slice(0, -4);
        jobs.push({
          file: `${toRel}/${f}`,
          oldBase: bandPrefixFor(tok) + lilyCap(fromSec),
          newBase: bandPrefixFor(tok) + lilyCap(toSec),
        });
      }
    } else if (!st.isDirectory() && fp.length === 4 && tp.length === 4) {
      // Token file move/rename (possibly across sections).
      const fa = fp[3].slice(0, -4), fb = tp[3].slice(0, -4);
      jobs.push({
        file: toRel,
        oldBase: bandPrefixFor(fa) + lilyCap(fromSec),
        newBase: bandPrefixFor(fb) + lilyCap(toSec),
      });
    }
  } catch (_) { return fixed; }
  for (const { file, oldBase, newBase } of jobs) {
    if (!oldBase || oldBase === newBase) continue;
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(oldBase) || !/^[A-Za-z][A-Za-z0-9]*$/.test(newBase)) continue;
    let body;
    try { body = await fs.readFile(path.join(WORKSPACE_DIR, file), "utf8"); } catch (_) { continue; }
    const re = new RegExp(`(^|[^A-Za-z0-9_])${oldBase}([A-Za-z0-9]*)`, "g");
    if (!re.test(body)) continue;
    const out = body.replace(new RegExp(`(^|[^A-Za-z0-9_])${oldBase}([A-Za-z0-9]*)`, "g"), `$1${newBase}$2`);
    await fs.writeFile(path.join(WORKSPACE_DIR, file), out, "utf8");
    fixed.push(file);
  }
  return fixed;
}

// Add score staves for tokens that have real music on disk but no staff in
// the score (hand-added token files, tree-renamed tokens). Tokens whose
// files define nothing are skipped, so placeholders stay silent.
async function bandEnsureTokenStaves(project) {
  const bp = bandPaths(project);
  if (!bp) return [];
  const sections = await bandScanSections(bp);
  if (!sections) return [];
  const toks = [...new Set(sections.flatMap((s) => s.tokens))];
  if (!toks.length) return [];
  const secs = sections.map((s) => s.name);
  const bodies = await bandReadBodies(bp, secs, toks);
  let raw;
  try { raw = await fs.readFile(bp.wrapper, "utf8"); } catch (_) { return []; }
  const lines = raw.split("\n");
  const scoreText = lines.slice(lines.findIndex((l) => /^\s*\\score\s*\{/.test(l))).join("\n");
  const added = [];
  for (const t of toks) {
    const contributes = bandStitchDefs(t).some((d) => secs.some((s) => bandDefines(bodies, s, t, d.ref(lilyCap(s)))));
    if (!contributes) continue;
    // Covered when the score plays any of the token's Full vars or its
    // section vars (the canonical lead voice plays leadVerseA/B directly,
    // never \leadFull). Search the score region only: stitch definitions
    // reference section vars too, and must not count.
    const refs = [];
    for (const d of bandStitchDefs(t)) {
      refs.push(`\\${d.full}`);
      for (const s of secs) refs.push(`\\${d.ref(lilyCap(s))}`);
    }
    if (refs.some((r) => scoreText.includes(r))) continue;
    const hasDrumGlobal = Object.values(bodies).filter(Boolean).some((b) => /(^|\n)\s*drumGlobal\s*=/.test(b));
    const at = bandScoreInsertIndex(lines);
    if (at === -1) continue;
    lines.splice(at, 0, ...bandRebuildStaff(t, hasDrumGlobal));
    added.push(t);
  }
  if (added.length) await fs.writeFile(bp.wrapper, lines.join("\n"), "utf8");
  return added;
}

// Strip redundant \global usages from section token files. The wrapper now
// supplies setup per section (base \global or the globals<Sec> override),
// so a file-local \global would re-assert the shared defaults AFTER the
// override and silently cancel it. Only standalone \global lines are
// removed; inline occurrences (music on the same line) are reported, never
// edited. globals.ily itself is never touched.
async function bandStripSectionGlobals(project, secs, toks) {
  const bp = bandPaths(project);
  if (!bp) return { stripped: [], inlineKept: [] };
  const stripped = [], inlineKept = [];
  for (const s of secs) {
    for (const t of toks) {
      const full = path.join(bp.sectionsDir, s, `${t}.ily`);
      let body;
      try { body = await fs.readFile(full, "utf8"); } catch (_) { continue; }
      const lines = body.split("\n");
      let changed = false;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*\\global\s*(%.*)?$/.test(lines[i])) { lines.splice(i, 1); i--; changed = true; }
        else if (/(^|[^A-Za-z])\\global\b/.test(lines[i].replace(/%.*$/, ""))) {
          inlineKept.push(`sections/${s}/${t}.ily:${i + 1}`);
        }
      }
      if (changed) {
        await fs.writeFile(full, lines.join("\n"), "utf8");
        stripped.push(`sections/${s}/${t}.ily`);
      }
    }
  }
  return { stripped: stripped.sort(), inlineKept };
}

// True when the wrapper's stitch region or lead voice differs from what the
// files on disk (plus overrides) generate — e.g. a globals.ily was added or
// removed out-of-app, or prefixes predate the setup scheme.
function bandWrapperStitchesStale(wrapperText, bodies, secs, toks, overrides, drumBase) {
  const expectedStitch = bandStitchBlock(bodies, secs, toks, { overrides, drumBase });
  const lines = wrapperText.split("\n");
  const isStitch = (l) => /^\s*[A-Za-z]\w*\s*=\s*(\{|\\lyricmode)/.test(l);
  const s0 = lines.findIndex(isStitch);
  if (s0 === -1) return true;
  let s1 = s0;
  while (s1 + 1 < lines.length && isStitch(lines[s1 + 1])) s1++;
  let hs = s0;
  while (hs - 1 >= 0 && /^%\s*(Stitched variables|Setup overrides)/.test(lines[hs - 1])) hs--;
  const current = lines.slice(hs, s1 + 1).join("\n").trim();
  if (current !== expectedStitch.join("\n").trim()) return true;
  if (toks.includes("vocals")) {
    const m = wrapperText.match(/\\new Voice = "lead" \{([\s\S]*?)\n(\s*)\}/);
    const expectedLead = bandLeadVoiceBody(bodies, secs, { overrides });
    const currentLead = m ? m[1].trim() : "";
    if (currentLead !== expectedLead.trim()) return true;
  }
  return false;
}

// Heal a drifted wrapper: restitch includes/stitches/lead voice from disk,
// strip redundant file-local \global lines (the wrapper supplies setup),
// then prune staves of instruments with no files left. Rewrites only when
// drift, stripped files, or stale stitches demand it — a clean wrapper is
// never touched.
async function bandReconcile(project) {
  const info = await bandStructure(project);
  if (!info) return { changed: false, reason: "not a band project" };
  const unfixable = info.drift.missing.filter((p) => p === "shared/shared.ily");
  const missing = info.drift.missing.filter((p) => p !== "shared/shared.ily");
  const unlisted = info.drift.unlisted;
  const bp = bandPaths(project);
  const secs = info.sections.map((s) => s.name);
  const toks = info.tokens.slice();
  const overrides = new Set(info.overrides || []);
  const strip = await bandStripSectionGlobals(project, secs, toks);
  const bodies = await bandReadBodies(bp, secs, toks);
  const drumBase = Object.values(bodies).filter(Boolean).some((b) => /(^|\n)\s*drumGlobal\s*=/.test(b))
    ? "\\drumGlobal" : "\\global";
  let wrapperText = "";
  try { wrapperText = await fs.readFile(bp.wrapper, "utf8"); } catch (_) {}
  const stale = wrapperText && bandWrapperStitchesStale(wrapperText, bodies, secs, toks, overrides, drumBase);
  const stripNote = [...strip.stripped, ...strip.inlineKept.map((l) => `${l} (inline \\global kept)`)];
  if (!missing.length && !unlisted.length && !strip.stripped.length && !stale) {
    const pruned = await bandPruneOrphanTokens(project);
    const stavesAdded = await bandEnsureTokenStaves(project);
    if (!pruned.length && !stavesAdded.length) {
      return {
        changed: false, stripped: strip.stripped, globalsIssues: info.globalsIssues || [],
        chordKeyWarn: info.chordKeyWarn || [], overrides: info.overrides || [],
      };
    }
    return {
      changed: true, added: [], removed: [], pruned, stavesAdded,
      stripped: strip.stripped, globalsIssues: info.globalsIssues || [],
      chordKeyWarn: info.chordKeyWarn || [], overrides: info.overrides || [], unfixable,
    };
  }
  // Prune BEFORE the rewrite: the rewrite drops the stale includes that
  // identify the orphaned tokens, so pruning after it would find nothing.
  const pruned = await bandPruneOrphanTokens(project);
  await rewriteBandWrapper(project, null, null);
  const stavesAdded = await bandEnsureTokenStaves(project);
  return {
    changed: true, added: unlisted, removed: missing, pruned, stavesAdded,
    stripped: strip.stripped, strippedNote: stripNote,
    globalsIssues: info.globalsIssues || [], chordKeyWarn: info.chordKeyWarn || [],
    overrides: info.overrides || [], unfixable,
  };
}

// Reconcile the band projects owning workspace-relative paths (top-level
// dir with a full-band.ly sibling). Only drifted wrappers are rewritten.
async function reconcileOwners(relPaths) {
  const done = [];
  const seen = new Set();
  for (const rel of relPaths || []) {
    const proj = String(rel || "").split("/")[0];
    if (!proj || seen.has(proj)) continue;
    seen.add(proj);
    const bp = bandPaths(proj);
    if (!bp) continue;
    try { await fs.stat(bp.wrapper); } catch (_) { continue; }
    try {
      const r = await bandReconcile(proj);
      if (r.changed) {
        done.push({
          project: proj,
          added: r.added || [],
          removed: r.removed || [],
          pruned: r.pruned || [],
          stavesAdded: r.stavesAdded || [],
          stripped: r.stripped || [],
          overrides: r.overrides || [],
          unfixable: r.unfixable || [],
        });
      }
    } catch (_) { /* leave the wrapper alone on any failure */ }
  }
  return done;
}

const BAND_SETUP_VARS = new Set(["global", "drumGlobal"]);
const BAND_SOLO_MIDI = {
  guitar: "overdriven guitar", rhythm: "distorted guitar", bass: "electric bass (finger)",
  keys: "acoustic grand", vocals: "voice oohs", backing: "voice oohs",
};

function bandParseDefs(body) {
  const flat = String(body || "").replace(/%[^\n]*/g, "");
  const defs = [];
  const re = /(^|\n)\s*([A-Za-z][A-Za-z0-9]*)\s*=\s*(\\lyricmode\b)?/g;
  let m;
  while ((m = re.exec(flat))) defs.push({ name: m[2], lyrics: !!m[3] });
  return { flat, defs };
}

async function renderBandSolo(project, section, token) {
  const fail = (log) => ({ success: false, log, pdf: null, midi: null, pngs: [] });
  const bp = bandPaths(project);
  const sec = validBandWord(section), tok = validBandWord(token);
  if (!bp || !sec || !tok) return fail("Solo render needs a valid project/section/token.");
  if (tok === BAND_GLOBALS_TOKEN) return fail(`sections/${sec}/globals.ily is setup, not music — render an instrument instead.`);
  const full = path.join(bp.sectionsDir, sec, `${tok}.ily`);
  if (full !== bp.sectionsDir && !full.startsWith(bp.sectionsDir + path.sep)) return fail("Invalid section path.");
  let body;
  try { body = await fs.readFile(full, "utf8"); } catch (_) { return fail(`Could not read sections/${sec}/${tok}.ily.`); }
  const { flat, defs } = bandParseDefs(body);
  const isRef = (name) => (flat.match(new RegExp(`\\\\${name}\\b`, "g")) || []).length > 0;
  const musicRoots = defs.filter((d) => !d.lyrics && !BAND_SETUP_VARS.has(d.name) && !isRef(d.name)).map((d) => d.name);
  const lyricRoots = defs.filter((d) => d.lyrics && !isRef(d.name)).map((d) => d.name);
  if (!musicRoots.length) return fail(`No playable music in sections/${sec}/${tok}.ily yet — replace the placeholder with real music.`);
  const music = musicRoots[0], words = lyricRoots[0] || null;
  const label = `${lilyCap(sec)} · ${lilyCap(tok)}`;
  const midi = BAND_SOLO_MIDI[tok] || "acoustic grand";
  // Section files no longer carry \global (the wrapper supplies setup), so
  // the solo staff supplies it too: the section override when valid, else
  // the family base. Lyrics stay bare (\lyricmode takes no setup).
  let globalsBody = null;
  try { globalsBody = await fs.readFile(path.join(bp.sectionsDir, sec, `${BAND_GLOBALS_TOKEN}.ily`), "utf8"); } catch (_) {}
  const hasOverride = !!globalsBody && new RegExp(`(^|\\n)\\s*${bandGlobalsVar(sec)}\\s*=`).test(globalsBody);
  const setupRef = hasOverride ? `\\${bandGlobalsVar(sec)}` : "\\global";
  const M = (v) => `{ ${tok === "drums" ? "" : `${setupRef} `}\\${v} }`;
  let staff = "";
  if (tok === "keys" && musicRoots.length >= 2) {
    const up = musicRoots.find((r) => /RH$/i.test(r)) || musicRoots[0];
    const lo = musicRoots.find((r) => /LH$/i.test(r) && r !== up) || musicRoots.find((r) => r !== up);
    staff = `    \\new PianoStaff \\with {\n      instrumentName = "${label}"\n      midiInstrument = "${midi}"\n    } <<\n      \\new Staff = "upper" ${M(up)}\n      \\new Staff = "lower" ${M(lo)}\n    >>`;
  } else if (tok === "drums") {
    const setup = hasOverride ? `      ${setupRef}` : (defs.some((d) => d.name === "drumGlobal") ? "      \\drumGlobal" : "      \\time 4/4");
    const voices = musicRoots.map((r) => `        \\new DrumVoice \\${r}`).join("\n");
    staff = `    \\new DrumStaff \\with {\n      instrumentName = "${label}"\n    } {\n${setup}\n      <<\n${voices}\n      >>\n    }`;
  } else if (words) {
    staff = `    \\new Staff \\with {\n      instrumentName = "${label}"\n      midiInstrument = "${midi}"\n    } {\n      \\new Voice = "v" ${M(music)}\n    }\n    \\new Lyrics \\lyricsto "v" \\${words}`;
  } else if ((tok === "guitar" || tok === "rhythm") && musicRoots.length === 1) {
    staff = `    \\new Staff \\with {\n      instrumentName = "${label}"\n      midiInstrument = "${midi}"\n    } {\n      \\clef "treble_8"\n      ${M(music)}\n    }\n    \\new TabStaff \\with {\n      instrumentName = "${label} Tab"\n      midiInstrument = "${midi}"\n    } {\n      ${M(music)}\n    }`;
  } else if (musicRoots.length === 1) {
    staff = `    \\new Staff \\with {\n      instrumentName = "${label}"\n      midiInstrument = "${midi}"\n    } ${M(music)}`;
  } else {
    staff = `    \\new Staff \\with {\n      instrumentName = "${label}"\n      midiInstrument = "${midi}"\n    } { ${musicRoots.map((r) => `${tok === "drums" ? "" : `${setupRef} `}\\${r}`).join(" ")} }`;
  }
  let version = "2.24.4", tempo = null;
  try {
    const w = await fs.readFile(bp.wrapper, "utf8");
    const vm = w.match(/\\version\s+"([^"]+)"/);
    if (vm) version = vm[1];
  } catch (_) {}
  try {
    const shared = await fs.readFile(path.join(bp.root, "shared", "shared.ily"), "utf8");
    const tm = shared.match(/\\tempo\s+\d+\s*=\s*(\d+)/);
    if (tm) tempo = tm[1];
  } catch (_) {}
  if (hasOverride) {
    const gm = String(globalsBody).replace(/%[^\n]*/g, "").match(/\\tempo\s+\d+\s*=\s*(\d+)/);
    if (gm) tempo = gm[1];
  }
  const incs = [];
  try { await fs.stat(path.join(bp.root, "shared", "shared.ily")); incs.push(`\\include "${bp.name}/shared/shared.ily"`); } catch (_) {}
  if (globalsBody !== null) incs.push(`\\include "${bp.name}/sections/${sec}/${BAND_GLOBALS_TOKEN}.ily"`);
  incs.push(`\\include "${bp.name}/sections/${sec}/${tok}.ily"`);
  const code = `\\version "${version}"
% Solo render: ${sec} · ${tok} — the full song is ${bp.name}/full-band.ly.
${incs.join("\n")}

\\header { title = "${label}" }

\\score {
  <<
${staff}
  >>
  \\layout { }
  \\midi {${tempo ? ` \\tempo 4 = ${tempo}` : ""} }
}
`;
  return compileLilypond(code, `${bp.name}/sections/${sec}/${tok}.ily`);
}

app.post("/api/band/render", async (req, res) => {
  try {
    const { project, section, token } = req.body || {};
    const result = await renderBandSolo(project, section, token);
    const urls = await publishPreview(result);
    res.json({
      success: result.success,
      log: result.log,
      name: `${String(project || "")}/sections/${String(section || "")}/${String(token || "")}.ily`,
      label: `${lilyCap(String(section || ""))} · ${lilyCap(String(token || ""))}`,
      pdf: result.pdf ? toDataUrl(result.pdf, "application/pdf") : null,
      midi: result.midi ? toDataUrl(result.midi, "audio/midi") : null,
      pngs: result.pngs.map((p) => toDataUrl(p.data, "image/png")),
      pages: result.pngs.length,
      hasMidi: !!result.midi,
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

app.get("/api/band", async (req, res) => {
  const bp = bandPaths(req.query.project);
  if (!bp) return res.status(404).json({ error: "not a band project (need sections/ + full-band.ly)" });
  const info = await bandStructure(req.query.project);
  if (info) return res.json(info);
  // Wrapper-less but sections on disk: offer a rebuild instead of nothing.
  const sections = await bandScanSections(bp);
  if (!sections) return res.status(404).json({ error: "not a band project (need sections/ + full-band.ly)" });
  sections.sort((a, b) => a.name.localeCompare(b.name));
  const toks = [...new Set(sections.flatMap((s) => s.tokens))].sort();
  res.json({
    project: bp.name,
    wrapper: `${bp.name}/full-band.ly`,
    sections,
    tokens: toks,
    wrapperMissing: true,
    drift: { missing: [], unlisted: [] },
    overrides: [],
    globalsIssues: [],
    chordKeyWarn: [],
  });
});

app.post("/api/band/section", async (req, res) => {
  const bp = bandPaths(req.body?.project);
  const section = validBandWord(req.body?.section);
  if (!bp || !section) return res.status(400).json({ error: "need { project, section } (letters/digits/hyphens)" });
  const info = await bandStructure(bp.name);
  if (!info) return res.status(404).json({ error: "not a band project" });
  if (info.sections.some((s) => s.name === section)) return res.status(409).json({ error: `section "${section}" already exists` });
  try {
    await fs.mkdir(path.join(bp.sectionsDir, section), { recursive: true });
    for (const t of info.tokens) {
      const dest = path.join(bp.sectionsDir, section, `${t}.ily`);
      try { await fs.stat(dest); continue; } catch (_) {}
      await fs.writeFile(dest, bandScaffold(t, section), "utf8");
    }
    // Order: insert after `after` when it names an existing section, else append.
    const order = info.sections.map((s) => s.name);
    const after = String(req.body?.after || "");
    const at = order.indexOf(after);
    if (at !== -1) order.splice(at + 1, 0, section);
    else order.push(section);
    await rewriteBandWrapper(bp.name, order, null);
    res.json({ ok: true, section, structure: await bandStructure(bp.name) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/band/section", async (req, res) => {
  const bp = bandPaths(req.query.project ?? req.body?.project);
  const section = validBandWord(req.query.section ?? req.body?.section);
  if (!bp || !section) return res.status(400).json({ error: "need ?project=&section=" });
  const info = await bandStructure(bp.name);
  if (!info) return res.status(404).json({ error: "not a band project" });
  if (!info.sections.some((s) => s.name === section)) return res.status(404).json({ error: `no such section "${section}"` });
  if (info.sections.length <= 1) return res.status(400).json({ error: "cannot delete the last section" });
  try {
    const full = path.join(bp.sectionsDir, section);
    if (full !== bp.sectionsDir && full.startsWith(bp.sectionsDir + path.sep)) {
      await fs.rm(full, { recursive: true, force: true });
    }
    await rewriteBandWrapper(bp.name, null, null);
    res.json({ ok: true, section, structure: await bandStructure(bp.name) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Custom instruments only: legacy tokens (guitar/keys/drums/bass/vocals/
// backing/rhythm) are structural — restore them from the preset instead.
const BAND_RESERVED_TOKENS = new Set(["guitar", "keys", "drums", "bass", "vocals", "backing", "rhythm"]);

app.post("/api/band/token", async (req, res) => {
  const bp = bandPaths(req.body?.project);
  const token = validBandWord(req.body?.token);
  if (!bp || !token) return res.status(400).json({ error: "need { project, token } (letters/digits/hyphens)" });
  if (token === BAND_GLOBALS_TOKEN) return res.status(409).json({ error: `"${BAND_GLOBALS_TOKEN}" is the per-section setup file; create sections/<section>/globals.ily in the tree instead` });
  if (BAND_RESERVED_TOKENS.has(token)) return res.status(409).json({ error: `"${token}" is a built-in instrument; restore it from the preset instead` });
  const info = await bandStructure(bp.name);
  if (!info) return res.status(404).json({ error: "not a band project" });
  if (info.tokens.includes(token)) return res.status(409).json({ error: `instrument "${token}" already exists` });
  const clash = info.tokens.find((t) => t !== token && bandPrefixFor(t) === bandPrefixFor(token));
  if (clash) return res.status(409).json({ error: `"${token}" would define the same variables as "${clash}"; pick another name` });
  try {
    // Locate the score insertion point BEFORE writing anything, so a failure
    // here can't leave orphaned token files behind.
    const raw0 = await fs.readFile(bp.wrapper, "utf8");
    const at0 = bandScoreInsertIndex(raw0.split("\n"));
    if (at0 === -1) return res.status(500).json({ error: "could not locate score insertion point" });
    for (const s of info.sections) {
      const dest = path.join(bp.sectionsDir, s.name, `${token}.ily`);
      try { await fs.stat(dest); continue; } catch (_) {}
      // Sections with no defined variables at all stay comment-only placeholders.
      let placeholder = true;
      try {
        const existing = await fs.readdir(path.join(bp.sectionsDir, s.name));
        for (const f of existing) {
          if (!f.endsWith(".ily")) continue;
          const body = await fs.readFile(path.join(bp.sectionsDir, s.name, f), "utf8");
          if (/(^|\n)\s*[A-Za-z]+\s*=/.test(body)) { placeholder = false; break; }
        }
      } catch (_) {}
      await fs.writeFile(dest, placeholder ? bandIntroPlaceholder(token, s.name) : bandScaffold(token, s.name), "utf8");
    }
    // Add the Staff block before DrumStaff, else before the score's closing >>.
    // (Insertion point was validated above, before any files were written.)
    const raw = await fs.readFile(bp.wrapper, "utf8");
    const lines = raw.split("\n");
    const block = bandStaffBlock(token, req.body?.label || lilyCap(token), req.body?.midi, req.body?.clef, `${bandPrefixFor(token)}Full`);
    let at = bandScoreInsertIndex(lines);
    if (at === -1) at = at0; // wrapper unchanged since probe; identical content
    lines.splice(at, 0, ...block);
    await fs.writeFile(bp.wrapper, lines.join("\n"), "utf8");
    await rewriteBandWrapper(bp.name, null, [...info.tokens, token]);
    res.json({ ok: true, token, structure: await bandStructure(bp.name) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/band/token", async (req, res) => {
  const bp = bandPaths(req.query.project ?? req.body?.project);
  const token = validBandWord(req.query.token ?? req.body?.token);
  if (!bp || !token) return res.status(400).json({ error: "need ?project=&token=" });
  const info = await bandStructure(bp.name);
  if (!info) return res.status(404).json({ error: "not a band project" });
  if (!info.tokens.includes(token)) return res.status(404).json({ error: `no such instrument "${token}"` });
  try {
    for (const s of info.sections) {
      const full = path.join(bp.sectionsDir, s.name, `${token}.ily`);
      if (full.startsWith(bp.sectionsDir + path.sep)) await fs.rm(full, { force: true });
    }
    const raw = await fs.readFile(bp.wrapper, "utf8");
    const lines = raw.split("\n");
    bandRemoveTokenFromScore(lines, token);
    await fs.writeFile(bp.wrapper, lines.join("\n"), "utf8");
    await rewriteBandWrapper(bp.name, null, null);
    res.json({ ok: true, token, structure: await bandStructure(bp.name) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Synthesize a fresh full-band.ly from the files on disk (recovery path for
// a deleted wrapper). Staves are family-correct but generic: built-in tokens
// mirror the canonical layout, custom tokens get a plain Staff. Staff
// labels and MIDI voices are family defaults — the header says so.
const BAND_REBUILD_MIDI = {
  guitar: "overdriven guitar", rhythm: "distorted guitar", bass: "electric bass (finger)",
  keys: "acoustic grand", vocals: "voice oohs", backing: "voice oohs",
};

function bandRebuildStaff(t, hasDrumGlobal) {
  const midi = BAND_REBUILD_MIDI[t] || "acoustic grand";
  const label = lilyCap(t);
  if (t === "keys") {
    return [
      `    \\new PianoStaff \\with {`,
      `      instrumentName = "Piano"`,
      `      midiInstrument = "${midi}"`,
      `    } <<`,
      `      \\new Staff = "upper" \\pianoFullRH`,
      `      \\new Staff = "lower" \\pianoFullLH`,
      `    >>`,
    ];
  }
  if (t === "drums") {
    return [
      `    \\new DrumStaff \\with {`,
      `      instrumentName = "Drums"`,
      `    } {`,
      hasDrumGlobal ? `      \\drumGlobal` : `      \\time 4/4`,
      `      <<`,
      `        \\new DrumVoice \\drumFullHands`,
      `        \\new DrumVoice \\drumFullFeet`,
      `      >>`,
      `    }`,
    ];
  }
  if (t === "vocals") {
    return [
      `    \\new Staff \\with {`,
      `      instrumentName = "Vocals 1"`,
      `      midiInstrument = "${midi}"`,
      `    } {`,
      `      \\new Voice = "lead" { \\leadFull }`,
      `    }`,
      `    \\new Lyrics \\lyricsto "lead" \\leadWordsFull`,
    ];
  }
  if (t === "backing") {
    return [
      `    \\new Staff \\with {`,
      `      instrumentName = "Vocals 2"`,
      `      midiInstrument = "${midi}"`,
      `    } {`,
      `      \\new Voice = "backing" { \\backingFull }`,
      `    }`,
      `    \\new Lyrics \\lyricsto "backing" \\backingWordsFull`,
    ];
  }
  const p = bandPrefixFor(t);
  const block = [
    `    \\new Staff \\with {`,
    `      instrumentName = "${label}"`,
    `      midiInstrument = "${midi}"`,
    `    } {`,
  ];
  if (t === "guitar" || t === "rhythm") block.push(`      \\clef "treble_8"`);
  block.push(`      \\${p}Full`, `    }`);
  if (t === "guitar" || t === "rhythm") {
    block.push(
      `    \\new TabStaff \\with {`,
      `      instrumentName = "${label} Tab"`,
      `      midiInstrument = "${midi}"`,
      `    } {`,
      `      \\${p}Full`,
      `    }`);
  }
  return block;
}

async function bandRebuildWrapper(project) {
  const bp = bandPaths(project);
  if (!bp) throw new Error("invalid project");
  const sections = await bandScanSections(bp);
  if (!sections || !sections.length) throw new Error("no sections/ directories with .ily files");
  sections.sort((a, b) => a.name.localeCompare(b.name));
  for (const s of sections) s.tokens.sort();
  const secs = sections.map((s) => s.name);
  const toks = [...new Set(sections.flatMap((s) => s.tokens))].sort();
  const bodies = await bandReadBodies(bp, secs, toks);
  const globalsBodies = await bandReadGlobals(bp, secs);
  const overrides = new Set(secs.filter((s) => bandGlobalsValid(globalsBodies, s)));
  const allBodies = Object.values(bodies).filter(Boolean);
  let hasShared = false;
  try { await fs.stat(path.join(bp.root, "shared", "shared.ily")); hasShared = true; } catch (_) {}
  let tempo = null;
  if (hasShared) {
    try {
      const shared = await fs.readFile(path.join(bp.root, "shared", "shared.ily"), "utf8");
      const tm = shared.match(/\\tempo\s+\d+\s*=\s*(\d+)/);
      if (tm) tempo = tm[1];
    } catch (_) {}
  }
  const definesAny = (re) => allBodies.some((b) => re.test(b));
  const definedVars = new Set();
  for (const b of allBodies) {
    for (const m of b.matchAll(/(^|\n)\s*([A-Za-z][A-Za-z0-9]*)\s*=/g)) definedVars.add(m[2]);
  }
  const referenced = (name) => allBodies.some((b) => new RegExp(`\\\\${name}\\b`).test(b.replace(/%[^\n]*/g, "")));
  // Fallbacks when shared/ is gone: section files still reference \global,
  // \drumGlobal and \fullChords. Emit minimal stand-ins (loudly commented)
  // instead of a wrapper that cannot compile.
  const fallbackBlock = [];
  if (!hasShared) {
    if (referenced("global") && !definedVars.has("global")) {
      fallbackBlock.push(`global = { \\time 4/4 }  % fallback: shared/shared.ily is missing`);
    }
    if (referenced("drumGlobal") && !definedVars.has("drumGlobal")) {
      fallbackBlock.push(`drumGlobal = { \\time 4/4 }  % fallback: shared/shared.ily is missing`);
    }
    if (referenced("fullChords") && !definedVars.has("fullChords")) {
      fallbackBlock.push(`fullChords = \\chordmode { c1 }  % fallback: shared/shared.ily is missing`);
    }
  }
  let hasChords = definesAny(/(^|\n)\s*fullChords\s*=/);
  if (hasShared && !hasChords) {
    try {
      const sh = await fs.readFile(path.join(bp.root, "shared", "shared.ily"), "utf8");
      if (/(^|\n)\s*fullChords\s*=/.test(sh)) hasChords = true;
    } catch (_) {}
  }
  const hasDrumGlobal = definesAny(/(^|\n)\s*drumGlobal\s*=/);
  const drumBase = hasDrumGlobal ? "\\drumGlobal" : "\\global";
  const incBlock = [
    ...(hasShared ? [`\\include "shared/shared.ily"`] : []),
    ...secs.flatMap((s) => [
      ...(globalsBodies[s] !== null ? [`\\include "sections/${s}/${BAND_GLOBALS_TOKEN}.ily"`] : []),
      ...sections.find((x) => x.name === s).tokens.map((t) => `\\include "sections/${s}/${t}.ily"`),
    ]),
  ];
  const stitchBlock = bandStitchBlock(bodies, secs, toks, { overrides, drumBase });
  const staffLines = [];
  if (hasChords) staffLines.push(`    \\new ChordNames \\fullChords`);
  for (const t of toks) staffLines.push(...bandRebuildStaff(t, hasDrumGlobal));
  const code = `\\version "2.24.4"
% Rebuilt from the files on disk: staff labels and MIDI voices are family
% defaults, not the original layout. Check the score before performing it.
${fallbackBlock.length ? fallbackBlock.join("\n") + "\n" : ""}${incBlock.join("\n")}

${stitchBlock.join("\n")}

\\header {
  title = "${bp.name} (rebuilt)"
  subtitle = "Wrapper rebuilt from disk — verify staff labels"
}

\\score {
  <<
${staffLines.join("\n")}
  >>
  \\layout { }
  \\midi {${tempo ? ` \\tempo 4 = ${tempo}` : ""} }
}
`;
  await fs.writeFile(bp.wrapper, code, "utf8");
  return bandStructure(bp.name);
}

app.post("/api/band/restitch", async (req, res) => {
  try {
    const bp = bandPaths(req.body?.project);
    if (!bp) return res.status(400).json({ error: "need { project }" });
    const result = await bandReconcile(bp.name);
    res.json({ ok: true, ...result, structure: await bandStructure(bp.name) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/band/rebuild", async (req, res) => {
  try {
    const bp = bandPaths(req.body?.project);
    if (!bp) return res.status(400).json({ error: "need { project }" });
    try {
      await fs.stat(bp.wrapper);
      return res.status(409).json({ error: "full-band.ly already exists; use restitch instead" });
    } catch (_) { /* missing: rebuild it */ }
    const structure = await bandRebuildWrapper(bp.name);
    res.json({ ok: true, rebuilt: true, structure });
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
  let code = String(req.body?.code ?? "");
  let name = String(req.body?.name || "score");
  if (/\.ily$/i.test(name)) {
    const wrapper = await resolveIlyWrapper(name);
    if (wrapper) {
      try {
        const wrapperCode = await fs.readFile(path.join(WORKSPACE_DIR, wrapper), "utf8");
        code = wrapperCode;
        name = wrapper;
      } catch (_) { /* fall back to posted code */ }
    }
  }
  if (!code.trim()) return res.status(400).json({ success: false, log: "Empty score." });
  try {
    const result = await compileLilypond(code, name);
    const urls = await publishPreview(result);

    res.json({
      success: result.success,
      log: result.log,
      name,
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
    let result, target = file, label = null;
    // Out-of-app saves heal too: reconcile the owning band project first,
    // so a shell/editor edit that drifted the wrapper still compiles.
    let restitchNote = null;
    try {
      const owner = bandPaths(String(file).split("/")[0]);
      let hasWrapper = false;
      if (owner) {
        try { await fs.stat(owner.wrapper); hasWrapper = true; } catch (_) {}
      }
      if (hasWrapper) {
        const r = await bandReconcile(owner.name);
        if (r.changed) {
          const bits = [
            ...(r.added || []).map((p) => `+${p}`),
            ...(r.removed || []).map((p) => `-${p}`),
            ...(r.pruned || []).map((t) => `pruned staff:${t}`),
            ...(r.stripped || []).map((p) => `setup:${p}`),
            ...(r.overrides || []).map((s) => `override:${s}`),
          ];
          restitchNote = `wrapper restitched (${bits.join(", ") || "tidy"})`
            + ((r.unfixable || []).length ? `; still missing: ${r.unfixable.join(", ")}` : "");
          console.log(`  ${restitchNote}`);
        }
      }
    } catch (_) { /* never let healing break the compile */ }
    const solo = String(file).match(/^(.+)\/sections\/([^/]+)\/([^/]+)\.ily$/i);
    if (solo) {
      // A section token renders on its own, not as the whole song.
      result = await renderBandSolo(solo[1], solo[2], solo[3]);
      label = `${lilyCap(solo[2])} · ${lilyCap(solo[3])}`;
    } else {
      // An .ily save actually compiles its resolved wrapper.
      let compileCode = code;
      if (/\.ily$/i.test(file)) {
        const wrapper = await resolveIlyWrapper(file);
        if (wrapper) {
          try { compileCode = await fs.readFile(path.join(WORKSPACE_DIR, wrapper), "utf8"); target = wrapper; } catch (_) { /* keep raw */ }
        }
      }
      result = await compileLilypond(compileCode, target);
    }
    const urls = await publishPreview(result);
    broadcast({
      type: "auto-compiled",
      file,
      label,
      restitch: restitchNote,
      success: result.success,
      log: restitchNote ? `${restitchNote}\n${result.log}` : result.log,
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
