// SF2 playback engine (SpessaSynth) — plays compiled MIDI with full .sf2/.sf3 banks.
// Magenta (html-midi-player) only offers 3 streamed sets; this engine accepts any
// SoundFont bank: bundled GeneralUser GS, an uploaded file, or a custom URL.
//
// Wiring: app.js dispatches window events on every compile:
//   "lily:midi" { url } — a new MIDI is ready (autoplay if engine + checkbox say so)
//   "lily:midi-clear"   — no MIDI (score has no \midi block)
// This module is intentionally decoupled: it works even if it loads after app.js.
// NOTE: no static imports here on purpose — if the SpessaSynth CDN is
// unreachable, a static import would kill this whole module (upload, bank
// list, selection included). The synth library loads lazily in
// ensureEngine(); everything else works without it.
const SPESSA_VERSION = "4.3.14";
const WORKLET_URL = `https://cdn.jsdelivr.net/npm/spessasynth_lib@${SPESSA_VERSION}/dist/spessasynth_processor.min.js`;

// Add more banks here — one line each. Must be CORS-enabled (.sf2/.sf3/.dls).
const SF2_BANKS = {
  generaluser: {
    label: "GeneralUser GS (~8 MB)",
    url: "https://spessasus.github.io/SpessaSynth/soundfonts/GeneralUserGS.sf3",
  },
};
const SF2_KEY = "lily-sf2-bank";
const SF2_URL_KEY = "lily-sf2-url";
const OPFS_DIR = "lily-soundfonts";

// ---- Persistent storage: OPFS (browser, origin-private files) + server ----
// Same shapes as before ({name, size} lists; {name, buffer} records) so all
// callers work unchanged. Throws with a clear message when OPFS is missing.
async function opfsDir() {
  const storage = navigator.storage;
  if (!storage?.getDirectory) throw new Error("OPFS not available in this browser");
  const root = await storage.getDirectory();
  return root.getDirectoryHandle(OPFS_DIR, { create: true });
}

async function opfsList() {
  try {
    const dir = await opfsDir();
    const out = [];
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind !== "file") continue;
      let size = 0;
      try { size = (await handle.getFile()).size; } catch (_) {}
      out.push({ name, size });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  } catch (_) { return []; }
}

async function opfsGet(name) {
  if (name.includes("/")) throw new Error("bad bank name");
  const dir = await opfsDir();
  const handle = await dir.getFileHandle(name);
  const file = await handle.getFile();
  return { name, buffer: await file.arrayBuffer(), size: file.size };
}

async function opfsPut(name, buffer) {
  if (name.includes("/")) throw new Error("bad bank name");
  const dir = await opfsDir();
  const handle = await dir.getFileHandle(name, { create: true });
  const w = await handle.createWritable();
  try {
    await w.write(buffer);
  } finally {
    await w.close();
  }
  return true;
}

async function opfsDelete(name) {
  const dir = await opfsDir();
  await dir.removeEntry(name);
  return true;
}


async function fetchServerBanks() {
  try {
    const r = await fetch("/api/soundfonts", { cache: "no-store" });
    if (!r.ok) return [];
    const { files } = await r.json();
    return Array.isArray(files) ? files : [];
  } catch (_) { return []; }
}

async function uploadToServer(name, buffer) {
  const r = await fetch(`/api/soundfonts?name=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "X-Filename": name },
    body: buffer,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function sanitizeBankName(name) {
  const base = String(name || "bank").split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return /\.(sf2|sf3|dls|sfogg)$/i.test(base) ? base : `${base || "bank"}.sf2`;
}

// (Re)build the Bank <select> from built-ins + OPFS + server entries.
// Preserves the current/saved selection; returns { opfs, server } lists.
async function refreshPersistentBanks() {
  const sel = $("sf2Select");
  if (!sel) return { opfs: [], server: [] };
  const [opfs, server] = await Promise.all([opfsList(), fetchServerBanks()]);
  const keep = sel.value || savedBankKey();
  // Drop previously injected dynamic options, keep built-ins + custom/url.
  for (const opt of [...sel.querySelectorAll("option[data-dyn]")]) opt.remove();
  for (const { name, size } of opfs) {
    const o = document.createElement("option");
    o.value = `opfs:${name}`;
    o.dataset.dyn = "opfs";
    o.textContent = `${name} (browser${size ? `, ${Math.round(size / 1048576)} MB` : ""})`;
    sel.insertBefore(o, [...sel.options].find((x) => x.value === "custom") || null);
  }
  for (const { name, size } of server) {
    const o = document.createElement("option");
    o.value = `server:${name}`;
    o.dataset.dyn = "server";
    o.textContent = `${name} (server${size ? `, ${Math.round(size / 1048576)} MB` : ""})`;
    sel.insertBefore(o, [...sel.options].find((x) => x.value === "custom") || null);
  }
  const valid = new Set([...sel.options].map((o) => o.value));
  sel.value = valid.has(keep) ? keep : savedBankKeyFallback(valid);
  updateDeleteBtn();
  return { opfs, server };
}

function savedBankKeyFallback(valid) {
  const saved = savedBankKey();
  if (valid.has(saved)) return saved;
  if (valid.has("generaluser")) return "generaluser";
  return sel_first(valid);
}

function sel_first(valid) {
  for (const v of valid) return v;
  return "generaluser";
}

function updateDeleteBtn() {
  const sel = $("sf2Select");
  const del = $("sf2DeleteBtn");
  if (!del) return;
  const v = sel?.value || "";
  del.hidden = !(v.startsWith("opfs:") || v.startsWith("server:"));
}

const $ = (id) => document.getElementById(id);
const statusEl = () => $("sf2Status");
const engineIsSf2 = () => $("engineSelect")?.value === "sf2";
const autoplayOn = () => $("autoplay")?.checked !== false;

function setSf2Status(text) {
  const el = statusEl();
  if (el) el.textContent = text;
}

function fmtTime(s) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

let ctx = null;
let synth = null;
let seq = null;
let engineReady = null; // promise, resolves when synth+sequencer exist
let bankCache = new Map(); // key/url -> ArrayBuffer
let bankPromise = null; // in-flight bank download (dedupes rapid triggers)
let currentBank = null; // label of loaded bank
let midiSeq = 0; // guards rapid saves: stale MIDI fetches are dropped
let stagedMidi = null; // ArrayBuffer waiting for a bank
let lastMidiUrl = null;
let sf2Loop = false; // loop the current MIDI (set from app.js loop checkbox)
let sf2WasPlaying = false; // latch: only loop after natural ends, never after stop

async function ensureEngine() {
  if (engineReady) return engineReady;
  engineReady = (async () => {
    setSf2Status("SF2: starting audio engine…");
    let WorkletSynthesizer, Sequencer;
    try {
      ({ WorkletSynthesizer, Sequencer } = await import("spessasynth_lib"));
    } catch (e) {
      throw new Error(`SpessaSynth library failed to load (check connection): ${e?.message || e}`);
    }
    ctx = new AudioContext();
    await ctx.audioWorklet.addModule(WORKLET_URL);
    synth = new WorkletSynthesizer(ctx);
    synth.connect(ctx.destination);
    seq = new Sequencer(synth);
    try {
      seq.skipToFirstNoteOn = true;
    } catch (_) {}
    try {
      await synth.isReady;
    } catch (_) {}
    // Keep the seek UI moving while playing; loop the track on natural end.
    setInterval(() => {
      try {
        const seek = $("sf2Seek");
        const time = $("sf2Time");
        if (!seq || !seek || !time) return;
        const dur = seq.duration || 0;
        const cur = seq.currentTime || 0;
        if (dur > 0 && document.activeElement !== seek) {
          seek.value = String(Math.round((cur / dur) * 1000));
        }
        time.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
        if (sf2Loop && sf2WasPlaying && seq.isFinished) {
          seq.currentTime = 0;
          seq.play();
        }
      } catch (_) {}
    }, 250);
    setSf2Status(currentBank ? `SF2 ready — ${currentBank}` : "SF2 ready — pick a bank, then Play.");
    return true;
  })().catch((e) => {
    engineReady = null; // allow retry
    setSf2Status(`SF2 engine failed to start: ${e?.message || e} — check connection, or use Magenta.`);
    throw e;
  });
  return engineReady;
}

async function fetchBuffer(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.arrayBuffer();
}

async function loadBank(buffer, label, cacheKey) {
  await ensureEngine();
  await ctx.resume().catch(() => {});
  const wasPlaying = seq && !seq.paused;
  try {
    if (wasPlaying) seq.pause();
  } catch (_) {}
  setSf2Status(`SF2: loading ${label}…`);
  // "main" id replaces the previous bank.
  await synth.soundBankManager.addSoundBank(buffer, "main");
  if (cacheKey) bankCache.set(cacheKey, buffer);
  currentBank = label;
  setSf2Status(`SF2: ${label} ready${stagedMidi ? " — loading pending MIDI…" : "."}`);
  // A MIDI may have arrived while the bank was downloading.
  if (stagedMidi) {
    const mid = stagedMidi;
    stagedMidi = null;
    playBuffer(mid, autoplayOn() && engineIsSf2());
  }
}

async function loadBankByKey(key, opts = {}) {
  const hideLoadRow = () => {
    const f = $("sf2File");
    if (f) f.hidden = true;
    const u = $("sf2Url");
    if (u) u.hidden = true;
    const b = $("sf2LoadBtn");
    if (b) b.hidden = true;
    updateDeleteBtn();
  };
  if (key === "custom") {
    const f = $("sf2File");
    if (f) {
      f.hidden = false;
      if (!f.value && opts.prompt !== false) f.click();
    }
    const u = $("sf2Url");
    if (u) u.hidden = true;
    const b = $("sf2LoadBtn");
    if (b) b.hidden = true;
    updateDeleteBtn();
    setSf2Status("SF2: choose an .sf2 / .sf3 / .dls file — it will be saved in this browser + on the server.");
    return;
  }
  if (key === "url") {
    const u = $("sf2Url");
    if (u) u.hidden = false;
    const b = $("sf2LoadBtn");
    if (b) b.hidden = false;
    const f = $("sf2File");
    if (f) f.hidden = true;
    updateDeleteBtn();
    setSf2Status("SF2: paste a bank URL, then Load bank.");
    if (opts.url) return loadBankFromUrl(opts.url);
    return;
  }
  if (key?.startsWith("opfs:")) {
    hideLoadRow();
    const name = key.slice(5);
    try { localStorage.setItem(SF2_KEY, key); } catch (_) {}
    try {
      if (bankCache.has(key)) return loadBank(bankCache.get(key), `${name} (browser)`, key);
      setSf2Status(`SF2: loading ${name} from browser storage…`);
      const rec = await opfsGet(name);
      if (!rec?.buffer) throw new Error("not found in browser storage");
      return loadBank(rec.buffer, `${name} (browser)`, key);
    } catch (e) {
      setSf2Status(`SF2: browser bank missing (${e?.message || e}) — re-upload the file.`);
      return;
    }
  }
  if (key?.startsWith("server:")) {
    hideLoadRow();
    const name = key.slice(7);
    try { localStorage.setItem(SF2_KEY, key); } catch (_) {}
    try {
      if (bankCache.has(key)) return loadBank(bankCache.get(key), `${name} (server)`, key);
      setSf2Status(`SF2: downloading ${name} from server…`);
      const buf = await fetchBuffer(`/soundfonts/${encodeURIComponent(name)}`);
      return loadBank(buf, `${name} (server)`, key);
    } catch (e) {
      setSf2Status(`SF2 server bank failed: ${e?.message || e}`);
      return;
    }
  }
  const bank = SF2_BANKS[key] || SF2_BANKS.generaluser;
  hideLoadRow();
  try {
    localStorage.setItem(SF2_KEY, key in SF2_BANKS ? key : "generaluser");
  } catch (_) {}
  if (bankCache.has(key)) {
    return loadBank(bankCache.get(key), bank.label, key);
  }
  if (bankPromise) return bankPromise;
  setSf2Status(`SF2: downloading ${bank.label}…`);
  bankPromise = fetchBuffer(bank.url)
    .then((buf) => loadBank(buf, bank.label, key))
    .finally(() => { bankPromise = null; });
  return bankPromise;
}

async function loadBankFromUrl(url) {
  url = String(url || "").trim();
  if (!url) {
    setSf2Status("SF2: paste a bank URL first.");
    return;
  }
  try {
    localStorage.setItem(SF2_URL_KEY, url);
  } catch (_) {}
  try {
    if (bankCache.has(url)) return loadBank(bankCache.get(url), "custom bank", url);
    setSf2Status("SF2: downloading custom bank…");
    const buf = await fetchBuffer(url);
    return loadBank(buf, "custom bank", url);
  } catch (e) {
    setSf2Status(`SF2 bank download failed: ${e?.message || e}`);
  }
}

async function playBuffer(buffer, autoplay) {
  await ensureEngine();
  await ctx.resume().catch(() => {});
  const gen = midiSeq;
  seq.loadNewSongList([{ binary: buffer }]);
  if (gen !== midiSeq) return; // superseded while loading
  if (autoplay) {
    try {
      seq.play();
      sf2WasPlaying = true;
      setSf2Status(currentBank ? `SF2 playing — ${currentBank}` : "SF2 playing.");
    } catch (e) {
      setSf2Status(`SF2 play blocked: ${e?.message || e} — press Play.`);
    }
  } else {
    sf2WasPlaying = false;
    setSf2Status(`SF2 loaded (${fmtTime(seq.duration || 0)}) — press Play.`);
  }
}

// Public entry: app.js calls this via the "lily:midi" event (and window.SF2).
async function loadMidi(url) {
  lastMidiUrl = url;
  sf2WasPlaying = false; // new file: loop restarts only after it plays again
  const gen = ++midiSeq;
  const shouldPlay = autoplayOn() && engineIsSf2();
  try {
    const buf = await fetchBuffer(url);
    if (gen !== midiSeq) return; // a newer save won
    if (!synth || !currentBank) {
      // Engine or bank not ready yet: stage it; it plays once both exist.
      stagedMidi = buf;
      if (!synth) {
        // Don't force AudioContext creation before a user gesture; just note it.
        setSf2Status("SF2: MIDI staged — open the MIDI tab / press Play to enable audio.");
        return;
      }
      // Synth exists but no bank yet: load the saved bank, then auto-play.
      const sel = $("sf2Select");
      const key = sel?.value || savedBankKey();
      await loadBankByKey(key, { prompt: false });
      return; // loadBank() consumes stagedMidi
    }
    await playBuffer(buf, shouldPlay);
  } catch (e) {
    if (gen !== midiSeq) return;
    setSf2Status(`SF2: MIDI load failed: ${e?.message || e}`);
  }
}

function savedBankKey() {
  try {
    const k = localStorage.getItem(SF2_KEY);
    if (k && (k in SF2_BANKS || k === "custom" || k === "url")) return k;
    // Pre-OPFS selections used the idb: prefix for the same filenames.
    if (k && k.startsWith("idb:")) return "opfs:" + k.slice(4);
    if (k && k.startsWith("opfs:") || k?.startsWith("server:")) return k;
  } catch (_) {}
  return "generaluser";
}

// Full upload pipeline at module scope (so window.SF2.upload can reach
// it): read -> play now if the engine starts -> persist (browser +
// server) -> select the stored copy.
async function uploadBankFile(file) {
  if (!file) return { ok: false, error: "no file" };
  const safe = sanitizeBankName(file.name);
  let buf;
  try {
    buf = await file.arrayBuffer();
  } catch (e) {
    setSf2Status(`SF2: could not read file: ${e?.message || e}`);
    return { ok: false, error: e?.message || String(e) };
  }
  let played = false;
  try {
    await loadBank(buf, file.name, `opfs:${safe}`);
    played = true;
  } catch (e) {
    console.warn("instant play failed (file will still be saved):", e?.message || e);
  }
  let opfsOk = false;
  try { await opfsPut(safe, buf.slice(0)); opfsOk = true; } catch (e) {
    console.warn("opfs save failed:", e.message);
  }
  let serverOk = false;
  try { await uploadToServer(safe, buf); serverOk = true; } catch (e) {
    console.warn("server upload failed:", e.message);
  }
  await refreshPersistentBanks();
  const next = serverOk ? `server:${safe}` : (opfsOk ? `opfs:${safe}` : "custom");
  if ([...$("sf2Select").options].some((o) => o.value === next)) {
    $("sf2Select").value = next;
    try { localStorage.setItem(SF2_KEY, next); } catch (_) {}
  }
  updateDeleteBtn();
  const where = [opfsOk ? "browser" : null, serverOk ? "server" : null].filter(Boolean).join(" + ");
  if (!played && !opfsOk && !serverOk) {
    setSf2Status(`SF2: ${file.name} could not be played or saved — check connection and storage.`);
    return { ok: false, error: "play and persist both failed" };
  }
  setSf2Status(
    `SF2: ${file.name} ready` +
    (where ? ` — saved to ${where}` : "") +
    (played ? "." : " (saved; playback starts when the engine loads).")
  );
  return { ok: true, key: next, where };
}

// ---- Controls ----
function unlockOnGesture() {
  // Create/resume the AudioContext inside a user gesture so autoplay works later.
  if (!engineIsSf2()) return;
  ensureEngine()
    .then(() => ctx?.resume().catch(() => {}))
    .catch(() => {});
  // If a MIDI is staged (or on screen), make sure the bank is coming.
  if (!currentBank && !bankCache.size) {
    const sel = $("sf2Select");
    loadBankByKey(sel?.value || savedBankKey(), { prompt: false }).catch(() => {});
  }
}
window.addEventListener("pointerdown", unlockOnGesture);
window.addEventListener("keydown", unlockOnGesture);

function bindControls() {
  const sel = $("sf2Select");
  if (sel) {
    sel.value = savedBankKey();
    const savedUrl = (() => {
      try {
        return localStorage.getItem(SF2_URL_KEY) || "";
      } catch (_) {
        return "";
      }
    })();
    if (savedUrl && $("sf2Url")) $("sf2Url").value = savedUrl;
    // Reflect the saved mode in the load row (UI only — no download until first use).
    const f0 = $("sf2File"), u0 = $("sf2Url"), b0 = $("sf2LoadBtn");
    if (f0) f0.hidden = sel.value !== "custom";
    if (u0) u0.hidden = sel.value !== "url";
    if (b0) b0.hidden = sel.value !== "url";
    sel.addEventListener("change", () => {
      try {
        localStorage.setItem(SF2_KEY, sel.value);
      } catch (_) {}
      updateDeleteBtn();
      loadBankByKey(sel.value).catch(() => {});
    });
    // Populate browser + server banks, then restore the saved selection.
    refreshPersistentBanks().then(({ opfs, server }) => {
      const want = savedBankKey();
      if ([...sel.options].some((o) => o.value === want)) sel.value = want;
      updateDeleteBtn();
      if (want.startsWith("opfs:") || want.startsWith("server:")) {
        const hasAny = opfs.length + server.length > 0;
        setSf2Status(hasAny ? "SF2: restored saved bank — press Play." : "SF2 ready — pick a bank, then Play.");
      }
    }).catch(() => {});
  }
  const f = $("sf2File");
  if (f) f.addEventListener("change", async () => {
    const file = f.files?.[0];
    if (!file) return;
    await uploadBankFile(file);
    f.value = "";
  });
  const del = $("sf2DeleteBtn");
  if (del) del.addEventListener("click", async () => {
    const v = $("sf2Select")?.value || "";
    try {
      if (v.startsWith("opfs:")) {
        await opfsDelete(v.slice(5));
        bankCache.delete(v);
      } else if (v.startsWith("server:")) {
        const r = await fetch(`/api/soundfonts/${encodeURIComponent(v.slice(7))}`, { method: "DELETE" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        bankCache.delete(v);
      } else return;
      try { localStorage.setItem(SF2_KEY, "generaluser"); } catch (_) {}
      await refreshPersistentBanks();
      $("sf2Select").value = "generaluser";
      updateDeleteBtn();
      setSf2Status("SF2: saved bank deleted.");
    } catch (e) {
      setSf2Status(`SF2 delete failed: ${e?.message || e}`);
    }
  });
  const lb = $("sf2LoadBtn");
  if (lb) lb.addEventListener("click", () => loadBankFromUrl($("sf2Url")?.value));
  const play = $("sf2Play");
  if (play) play.addEventListener("click", async () => {
    try {
      await ensureEngine();
      if (!currentBank) await loadBankByKey($("sf2Select")?.value || "generaluser", { prompt: false });
      // (Re)load the on-screen MIDI if the sequencer is empty.
      if ((!seq.duration || seq.isFinished) && lastMidiUrl) {
        await loadMidi(lastMidiUrl);
        return;
      }
      await ctx.resume().catch(() => {});
      seq.play();
      sf2WasPlaying = true;
      setSf2Status(currentBank ? `SF2 playing — ${currentBank}` : "SF2 playing.");
    } catch (e) {
      setSf2Status(`SF2 play failed: ${e?.message || e}`);
    }
  });
  const pause = $("sf2Pause");
  if (pause) pause.addEventListener("click", () => {
    try {
      seq?.pause();
      sf2WasPlaying = false;
      setSf2Status("SF2 paused.");
    } catch (_) {}
  });
  const stop = $("sf2Stop");
  if (stop) stop.addEventListener("click", () => {
    try {
      if (seq?.stop) seq.stop();
      else seq?.pause();
      if (seq) seq.currentTime = 0;
      sf2WasPlaying = false;
      setSf2Status("SF2 stopped.");
    } catch (_) {}
  });
  const seek = $("sf2Seek");
  if (seek) seek.addEventListener("change", () => {
    try {
      if (seq?.duration) seq.currentTime = (Number(seek.value) / 1000) * seq.duration;
    } catch (_) {}
  });
}

// ---- Events from app.js ----
window.addEventListener("lily:midi", (e) => {
  if (!engineIsSf2()) return; // Magenta owns playback right now
  loadMidi(e?.detail?.url);
});
window.addEventListener("lily:midi-clear", () => {
  midiSeq++;
  stagedMidi = null;
  lastMidiUrl = null;
  sf2WasPlaying = false;
  try {
    if (seq?.stop) seq.stop();
    else seq?.pause();
  } catch (_) {}
  if (engineIsSf2()) setSf2Status("No MIDI yet — add a `\\midi { }` block to your `\\score`.");
});

window.SF2 = {
  loadMidi: (url) => loadMidi(url),
  stop: () => {
    try {
      if (seq?.stop) seq.stop();
      else seq?.pause();
      sf2WasPlaying = false;
    } catch (_) {}
  },
  play: () => {
    try {
      seq?.play();
      sf2WasPlaying = true;
    } catch (_) {}
  },
  setLoop: (v) => { sf2Loop = !!v; },
  upload: (file) => uploadBankFile(file),
  banks: SF2_BANKS,
};

bindControls();
