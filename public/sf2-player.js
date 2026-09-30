// SF2 playback engine (SpessaSynth) — plays compiled MIDI with full .sf2/.sf3 banks.
// Magenta (html-midi-player) only offers 3 streamed sets; this engine accepts any
// SoundFont bank: bundled GeneralUser GS, an uploaded file, or a custom URL.
//
// Wiring: app.js dispatches window events on every compile:
//   "lily:midi" { url } — a new MIDI is ready (autoplay if engine + checkbox say so)
//   "lily:midi-clear"   — no MIDI (score has no \midi block)
// This module is intentionally decoupled: it works even if it loads after app.js.
import { WorkletSynthesizer, Sequencer } from "spessasynth_lib";

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

async function ensureEngine() {
  if (engineReady) return engineReady;
  engineReady = (async () => {
    setSf2Status("SF2: starting audio engine…");
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
    // Keep the seek UI moving while playing.
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
    setSf2Status("SF2: choose an .sf2 / .sf3 / .dls file.");
    return;
  }
  if (key === "url") {
    const u = $("sf2Url");
    if (u) u.hidden = false;
    const b = $("sf2LoadBtn");
    if (b) b.hidden = false;
    const f = $("sf2File");
    if (f) f.hidden = true;
    setSf2Status("SF2: paste a bank URL, then Load bank.");
    if (opts.url) return loadBankFromUrl(opts.url);
    return;
  }
  const bank = SF2_BANKS[key] || SF2_BANKS.generaluser;
  const f = $("sf2File");
  if (f) f.hidden = true;
  const u = $("sf2Url");
  if (u) u.hidden = true;
  const b = $("sf2LoadBtn");
  if (b) b.hidden = true;
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
      setSf2Status(currentBank ? `SF2 playing — ${currentBank}` : "SF2 playing.");
    } catch (e) {
      setSf2Status(`SF2 play blocked: ${e?.message || e} — press Play.`);
    }
  } else {
    setSf2Status(`SF2 loaded (${fmtTime(seq.duration || 0)}) — press Play.`);
  }
}

// Public entry: app.js calls this via the "lily:midi" event (and window.SF2).
async function loadMidi(url) {
  lastMidiUrl = url;
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
  } catch (_) {}
  return "generaluser";
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
      loadBankByKey(sel.value).catch(() => {});
    });
  }
  const f = $("sf2File");
  if (f) f.addEventListener("change", async () => {
    const file = f.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      await loadBank(buf, file.name, null);
      try {
        localStorage.setItem(SF2_KEY, "custom");
      } catch (_) {}
    } catch (e) {
      setSf2Status(`SF2: could not read file: ${e?.message || e}`);
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
      setSf2Status(currentBank ? `SF2 playing — ${currentBank}` : "SF2 playing.");
    } catch (e) {
      setSf2Status(`SF2 play failed: ${e?.message || e}`);
    }
  });
  const pause = $("sf2Pause");
  if (pause) pause.addEventListener("click", () => {
    try {
      seq?.pause();
      setSf2Status("SF2 paused.");
    } catch (_) {}
  });
  const stop = $("sf2Stop");
  if (stop) stop.addEventListener("click", () => {
    try {
      if (seq?.stop) seq.stop();
      else seq?.pause();
      if (seq) seq.currentTime = 0;
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
    } catch (_) {}
  },
  play: () => {
    try {
      seq?.play();
    } catch (_) {}
  },
  banks: SF2_BANKS,
};

bindControls();
