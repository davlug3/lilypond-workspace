const $ = (id) => document.getElementById(id);
const editor = $("editor"), logEl = $("log"), statusEl = $("status");
const autoBox = $("auto"), fileSelect = $("fileSelect");
const followBox = $("follow"), autoplayBox = $("autoplay");
const pngWrap = $("pngWrap"), pdfFrame = $("pdfFrame");
const midiPlayer = $("midiPlayer"), midiViz = $("midiViz"), noMidi = $("noMidi");
const dlPng = $("dlPng"), dlPdf = $("dlPdf"), dlMidi = $("dlMidi");

let debounce = null;
let lastCode = "";

function setStatus(state, text) {
  statusEl.className = "status " + state;
  statusEl.textContent = text;
}

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

async function refreshFiles(selected) {
  try {
    const { files } = await api("/api/files");
    fileSelect.innerHTML = "";
    for (const f of files) {
      const o = document.createElement("option");
      o.value = o.textContent = f;
      fileSelect.appendChild(o);
    }
    if (selected && files.includes(selected)) fileSelect.value = selected;
    else if (files.length && !fileSelect.value) fileSelect.value = files[0];
  } catch (e) { console.warn(e); }
}

async function loadFile(name) {
  if (!name) return;
  try {
    const { code } = await api(`/api/file?name=${encodeURIComponent(name)}`);
    editor.value = code;
    scheduleCompile(true);
  } catch (e) { logEl.textContent = "Load error: " + e.message; }
}

// ---- Failure UI: banner with extracted error lines + stale-output marker ----
let hasGoodRender = false;

function extractErrors(log) {
  const out = [], seen = new Set();
  for (const line of String(log || "").split("\n")) {
    const t = line.trim();
    if (!t || !/error|fatal|failed files/i.test(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

function showFailure(title, log) {
  setStatus("err", title);
  logEl.textContent = log || "(no log)";
  const errs = extractErrors(log);
  const banner = $("errorBanner");
  if (banner) {
    banner.hidden = false;
    banner.innerHTML = "";
    const head = document.createElement("strong");
    const where = title === "compile error" ? "" : ` in ${title.replace(/^error in /, "")}`;
    head.textContent = `Compile failed${where} — nothing was produced`;
    const pre = document.createElement("pre");
    pre.textContent = errs.length ? errs.join("\n") : "(no error lines found — see full compiler log)";
    banner.appendChild(head);
    banner.appendChild(pre);
  }
  // Whatever is on screen is now outdated — say so (only if something rendered before).
  const stale = $("staleChip");
  if (stale) stale.hidden = !hasGoodRender;
}

function showSuccess() {
  hasGoodRender = true;
  const banner = $("errorBanner");
  if (banner) banner.hidden = true;
  const stale = $("staleChip");
  if (stale) stale.hidden = true;
}

// Preload score images off-screen, swap only when ready — no flicker,
// and (like MIDI) the visible page is never torn down mid-view.
function setPngs(urls) {
  if (!urls?.length) { pngWrap.innerHTML = "<p class='empty'>No PNG produced.</p>"; return; }
  dlPng.href = urls[0];
  const imgs = urls.map((src, i) => {
    const im = new Image();
    im.alt = `page ${i + 1}`;
    im.src = src;
    return im;
  });
  const ready = Promise.all(imgs.map((im) =>
    (im.decode ? im.decode() : Promise.resolve()).catch(() => {})
  ));
  const timeout = new Promise((res) => setTimeout(res, 3000));
  Promise.race([ready, timeout]).then(() => {
    pngWrap.innerHTML = "";
    imgs.forEach((im) => pngWrap.appendChild(im));
  });
}

function showResult(data) {
  if (!data.success) { showFailure("compile error", data.log); return; }
  showSuccess();
  logEl.textContent = data.log || "(no log)";
  setStatus("ok", `ok · ${data.pages} png page(s)${data.hasMidi ? " · midi" : ""}`);

  setPngs(data.pngs);

  // PDF
  if (data.pdf) { pdfFrame.src = data.pdf; dlPdf.href = data.pdf; }
  else { pdfFrame.removeAttribute("src"); }

  // MIDI: staged in background, never cuts playing audio (data: URLs need no fetch)
  if (data.midi) updateMidiNeatly(data.midi);
  else clearMidi();
}

async function compile(immediate = false) {
  const code = editor.value;
  if (!code.trim()) return;
  if (!immediate && code === lastCode) return;
  lastCode = code;
  setStatus("busy", "compiling…");
  try {
    const data = await api("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name: fileSelect.value || "score" }),
    });
    showResult(data);
  } catch (e) {
    setStatus("err", "failed");
    logEl.textContent = "Compile request failed: " + e.message;
  }
}

function scheduleCompile(immediate = false) {
  if (!autoBox.checked && !immediate) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => compile(immediate), immediate ? 50 : 800);
}

// UI state: tab lives in the URL hash (#png / #pdf / #midi);
// opacities live in localStorage.
const TABS = ["png", "pdf", "midi"];
const uiState = { tab: "png", png: 1, pdf: 1 };
const OP_KEY = "lily-opacities";

function clampOp(v) {
  let n = parseFloat(v);
  if (!Number.isFinite(n)) return null;
  if (n > 1) n = n / 100; // legacy 0-100 percent links
  return Math.round(Math.min(1, Math.max(0, n)) * 100) / 100;
}

function loadOpacities() {
  try {
    const saved = JSON.parse(localStorage.getItem(OP_KEY) || "{}");
    for (const k of ["png", "pdf"]) {
      const n = clampOp(saved[k]);
      if (n !== null) uiState[k] = n;
    }
  } catch (_) {}
}

function saveOpacities() {
  try {
    localStorage.setItem(OP_KEY, JSON.stringify({ png: uiState.png, pdf: uiState.pdf }));
  } catch (_) {}
}

function readUiState() {
  const seg = location.hash.replace(/^#/, "").split("&")[0];
  uiState.tab = TABS.includes(seg) ? seg : "png";
}

function applyUiState() {
  activateTab(uiState.tab);
  for (const k of ["png", "pdf"]) {
    const slider = $(k + "Op"), label = $(k + "OpVal");
    if (slider) slider.value = uiState[k];
    if (label) label.textContent = Math.round(uiState[k] * 100) + "%";
    try { document.documentElement.style.setProperty(`--${k}-op`, uiState[k]); }
    catch (_) {}
  }
}

function activateTab(name) {
  if (!TABS.includes(name)) name = "png";
  uiState.tab = name;
  document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("active", x.dataset.tab === name));
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x.id === "tab-" + name));
}
document.querySelectorAll(".tabs button").forEach((b) => {
  b.onclick = () => {
    activateTab(b.dataset.tab);
    // Plain tab hash keeps a history entry (back button works);
    // the hashchange handler below applies it. Same-hash clicks apply directly.
    const h = "#" + uiState.tab;
    if (location.hash !== h) location.hash = h;
    else { readUiState(); applyUiState(); }
  };
});
window.addEventListener("hashchange", () => { readUiState(); applyUiState(); });

for (const k of ["png", "pdf"]) {
  const slider = $(k + "Op");
  if (slider) slider.addEventListener("input", () => {
    const n = clampOp(slider.value);
    uiState[k] = n === null ? 1 : n;
    applyUiState();
    saveOpacities();
  });
}

$("compileBtn").onclick = () => compile(true);
editor.addEventListener("input", () => scheduleCompile(false));
fileSelect.onchange = () => { pinWatchFile(); loadFile(fileSelect.value); };
followBox.onchange = () => pinWatchFile();

// Resizable panels: drag the splitter (position persisted in localStorage).
try {
  const splitter = $("splitter");
  const mainEl = document.querySelector("main");
  const SPLIT_KEY = "lily-split";
  const clampSplit = (p) => Math.min(85, Math.max(15, p));
  const applySplit = (p) => document.documentElement.style.setProperty("--split", clampSplit(p) + "%");
  const wideLayout = () => !window.matchMedia || window.matchMedia("(min-width: 901px)").matches;

  try {
    const saved = parseFloat(localStorage.getItem(SPLIT_KEY));
    if (Number.isFinite(saved)) applySplit(saved);
  } catch (_) {}

  let dragging = false;
  splitter.addEventListener("pointerdown", (e) => {
    if (!wideLayout()) return;
    dragging = true;
    splitter.classList.add("dragging");
    try { splitter.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  splitter.addEventListener("pointermove", (e) => {
    if (!dragging || !wideLayout()) return;
    const r = mainEl.getBoundingClientRect();
    if (r.width > 0) applySplit(((e.clientX - r.left) / r.width) * 100);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove("dragging");
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--split");
      localStorage.setItem(SPLIT_KEY, parseFloat(v) || 50);
    } catch (_) {}
  };
  splitter.addEventListener("pointerup", endDrag);
  splitter.addEventListener("pointercancel", endDrag);
  splitter.addEventListener("dblclick", () => {
    applySplit(50);
    try { localStorage.setItem(SPLIT_KEY, 50); } catch (_) {}
  });
  splitter.addEventListener("keydown", (e) => {
    const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--split")) || 50;
    if (e.key === "ArrowLeft") { applySplit(cur - 2); e.preventDefault(); }
    else if (e.key === "ArrowRight") { applySplit(cur + 2); e.preventDefault(); }
    else if (e.key === "Home") { applySplit(50); e.preventDefault(); }
    else return;
    try { localStorage.setItem(SPLIT_KEY, parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--split")) || 50); } catch (_) {}
  });
} catch (_) {}

async function pinWatchFile() {
  try {
    await api("/api/watch-file", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: followBox.checked ? fileSelect.value : null }),
    });
  } catch (e) { console.warn("watch-file pin failed:", e.message); }
}

// Browsers block audio before any user gesture — unlock Tone.js context early.
function unlockAudio() {
  try {
    const ctx = window.Tone?.context;
    if (ctx && ctx.state === "suspended") ctx.resume();
  } catch (_) {}
}
window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);

function tryAutoplay() {
  // New outputs arrive via updateMidiNeatly() below; this is only the
  // explicit "start what is loaded" used by the manual Compile button.
  if (!autoplayBox.checked || (!midiPlayer.src && !pendingMidi)) return;
  if (pendingMidi) swapStagedMidi(true);
  else safeStart();
}

// ---- Gapless MIDI: fetch neatly in the background, never cut playing audio ----
// The player API is start()/stop() with .playing state and
// load/start/stop({finished})/loop events (see html-midi-player docs).
let pendingMidi = null;      // { url, blobUrl } staged, fully downloaded
let currentMidiBlob = null;  // blob URL currently loaded (to revoke on swap)
let midiGen = 0;             // guards against stale load handlers on rapid saves

function safeStart() {
  unlockAudio();
  try {
    const r = midiPlayer.start();
    if (r?.catch) r.catch(() => setStatus("ok", "ready — click Play (autoplay blocked)"));
  } catch (_) {
    setStatus("ok", "ready — click Play (autoplay blocked)");
  }
}

// Fetch the new MIDI fully before touching the player, so the swap is instant;
// the staged version then cuts in immediately (autoplay on) or on next Play.
async function updateMidiNeatly(url) {
  const gen = ++midiGen;
  dlMidi.href = url;
  let blobUrl = url;
  if (!url.startsWith("data:")) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      if (gen !== midiGen) return; // superseded by a newer save
      blobUrl = URL.createObjectURL(blob);
    } catch (e) {
      console.warn("midi stage failed, falling back to direct URL:", e.message);
      if (gen !== midiGen) return;
    }
  }
  if (pendingMidi?.blobUrl.startsWith("blob:")) URL.revokeObjectURL(pendingMidi.blobUrl);
  pendingMidi = { url, blobUrl, gen };
  // Play as soon as the new version is ready, cutting any current audio.
  swapStagedMidi(autoplayBox.checked);
}

// Swap the staged file into the player. Listener is attached BEFORE setting
// src so the async 'load' is never missed; the generation guard drops stale
// handlers when saves arrive in quick succession.
function swapStagedMidi(shouldStart) {
  if (!pendingMidi) return;
  const { url, blobUrl, gen } = pendingMidi;
  pendingMidi = null;
  if (currentMidiBlob) { try { URL.revokeObjectURL(currentMidiBlob); } catch (_) {} }
  currentMidiBlob = blobUrl.startsWith("blob:") ? blobUrl : null;
  try { midiPlayer.stop(); } catch (_) {} // cut current audio so the new version starts clean
  noMidi.hidden = true;
  midiPlayer.addEventListener("load", () => {
    if (gen !== midiGen) return;
    if (shouldStart && autoplayBox.checked) safeStart();
  }, { once: true });
  midiPlayer.src = blobUrl;
  midiViz.src = url; // keep the piano-roll in sync with what the player holds
}

function clearMidi() {
  midiGen++;
  pendingMidi = null;
  noMidi.hidden = false;
  try { midiPlayer.removeAttribute("src"); } catch (_) {}
  try { midiViz.removeAttribute("src"); } catch (_) {}
}

// ---- SoundFont picker (browser-side Magenta sets, one at a time) ----
const SF_SETS = {
  sgm: { label: "General MIDI", url: "" },
  salamander: { label: "Salamander grand piano", url: "https://storage.googleapis.com/magentadata/js/soundfonts/salamander" },
  synth: { label: "Simple synth", url: null },
};
const SF_KEY = "lily-soundfont";
const sfSelect = $("sfSelect");

function loadSoundFont() {
  let key = "sgm";
  try {
    const saved = localStorage.getItem(SF_KEY);
    if (saved && saved in SF_SETS) key = saved;
  } catch (_) {}
  if (sfSelect) sfSelect.value = key;
  try { midiPlayer.soundFont = SF_SETS[key].url; } catch (_) {}
  return key;
}

function applySoundFont(key) {
  const set = SF_SETS[key] || SF_SETS.sgm;
  let wasPlaying = false;
  try { wasPlaying = !!midiPlayer.playing; } catch (_) {}
  try { midiPlayer.stop(); } catch (_) {}
  try {
    midiPlayer.soundFont = set.url;
  } catch (_) {
    setStatus("err", "soundfont switch failed");
    return;
  }
  try { localStorage.setItem(SF_KEY, key in SF_SETS ? key : "sgm"); } catch (_) {}
  const cur = (pendingMidi && pendingMidi.blobUrl) || midiPlayer.src;
  if (!cur) return; // nothing loaded yet; choice applies to the next compile
  setStatus("busy", `loading ${set.label.toLowerCase()}…`);
  // Re-assign src so the player refetches current MIDI with the new samples.
  try { midiPlayer.removeAttribute("src"); } catch (_) {}
  midiGen++;
  const gen = midiGen;
  let loaded = false;
  midiPlayer.addEventListener("load", () => {
    if (gen !== midiGen) return;
    loaded = true;
    setStatus("ok", `${set.label} ready`);
    if (wasPlaying && autoplayBox.checked) safeStart();
  }, { once: true });
  setTimeout(() => {
    if (gen === midiGen && !loaded) setStatus("err", "soundfont load timed out — check connection");
  }, 30000);
  midiPlayer.src = cur;
}
if (sfSelect) sfSelect.addEventListener("change", () => applySoundFont(sfSelect.value));

// Result pushed by the server after it auto-compiled a saved workspace file.
async function showAutoCompiled(msg) {
  if (!msg.success) { showFailure(`error in ${msg.file}`, msg.log); return; }
  showSuccess();
  logEl.textContent = msg.log || "(no log)";
  setStatus("ok", `auto: ${msg.file} · ${msg.pages} png page(s)${msg.hasMidi ? " · midi" : ""}`);

  setPngs(msg.pngUrls);
  if (msg.pdfUrl) { pdfFrame.src = msg.pdfUrl; dlPdf.href = msg.pdfUrl; }
  if (msg.midiUrl) updateMidiNeatly(msg.midiUrl);
  else clearMidi();
  // In follow mode the disk file wins: sync the editor to what was compiled.
  try {
    const { code } = await api(`/api/file?name=${encodeURIComponent(msg.file)}`);
    if (code !== editor.value) { editor.value = code; lastCode = code; }
  } catch (_) {}
}
$("saveBtn").onclick = async () => {
  const name = fileSelect.value || "score.ly";
  await api(`/api/file?name=${encodeURIComponent(name)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: editor.value }),
  });
  logEl.textContent = `Saved ${name}`;
  refreshFiles(name);
};
$("newBtn").onclick = async () => {
  const name = prompt("New file path inside workspace/ (subfolders ok):", "new-score.ly");
  if (!name) return;
  const safe = name.endsWith(".ly") ? name : name + ".ly";
  await api(`/api/file?name=${encodeURIComponent(safe)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: editor.value || '% new score\n\\version "2.22.2"\n{ c4 d e f }\n' }),
  });
  await refreshFiles(safe);
  loadFile(safe);
};

// live server-side watch: auto-compiled pushes (external editors, :w to play)
function showWatchNotice(html, onLoad) {
  const n = $("watchNotice");
  n.hidden = false;
  n.innerHTML = html;
  const btn = $("reloadBtn");
  if (btn && onLoad) btn.onclick = onLoad;
}
try {
  const es = new EventSource("/api/watch");
  es.onerror = () => setStatus("err", "live feed down — Compile still works, reload page to reconnect");
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === "file-saved") {
        // Saved a file we're not following: say so, offer one-click switch.
        if (msg.file === fileSelect.value) return; // ours is handled via auto-compiled
        showWatchNotice(
          `<b>${msg.file}</b> saved on disk (not followed — following <b>${fileSelect.value}</b>). <button id="reloadBtn">Follow it</button>`,
          async () => {
            await refreshFiles(msg.file);
            fileSelect.value = msg.file;
            pinWatchFile();
            loadFile(msg.file);
            $("watchNotice").hidden = true;
          }
        );
        refreshFiles(fileSelect.value);
        return;
      }
      if (msg.type !== "auto-compiled") return;
      if (followBox.checked && msg.file === fileSelect.value) {
        $("watchNotice").hidden = true;
        showAutoCompiled(msg);
      } else {
        showWatchNotice(
          `<b>${msg.file}</b> saved & compiled (${msg.success ? "ok" : "error"}). <button id="reloadBtn">Load</button>`,
          async () => {
            await refreshFiles(msg.file);
            fileSelect.value = msg.file;
            pinWatchFile();
            if (msg.success) showAutoCompiled(msg); else loadFile(msg.file);
            $("watchNotice").hidden = true;
          }
        );
        refreshFiles(fileSelect.value);
      }
    } catch (_) {}
  };
} catch (_) {}

// init
(async () => {
  readUiState();
  loadOpacities();
  applyUiState();
  loadSoundFont();
  try {
    const v = await api("/api/version");
    $("version").textContent = v.version;
  } catch { $("version").textContent = "lilypond not found?"; }
  await refreshFiles();
  pinWatchFile();
  if (fileSelect.value) await loadFile(fileSelect.value);
  else {
    editor.value = '% Press Compile\n\\version "2.22.2"\n\\header { title = "Hello LilyPond" }\n{ c4 d e f g a b c1 }\n\\score { { c4 d e f g a b c1 } \\layout {} \\midi {} }\n';
    scheduleCompile(true);
  }
})();
