// midi-engine.js — owns all MIDI playback: Magenta (html-midi-player),
// SF2 (SpessaSynth, via sf2-player.js), and Basic (built-in WebAudio synth,
// zero network). One engine is always available, so playback never silently
// dies: Magenta needs its CDN script; when it is missing the engine falls
// back to Basic with a visible note.
//
// Wiring: App dispatches window events on every compile:
//   "lily:midi" { url, autoplay, file } — a new MIDI is ready
//   "lily:midi-clear"                   — no MIDI (compile failed)
// This module listens for those itself (registered on first bind, so it
// works even if it loads after App), stages audio gaplessly, and drives the
// mixer (mute/solo per instrument + verse/chorus slices via MidiTools).
// Controls live in the React MIDI tab, which mounts lazily — bind() wires
// whatever exists and is safe to call on every tab switch.
// UMD: window.MIDI, or module.exports (node self-test).
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MIDI = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const root = typeof globalThis !== "undefined" ? globalThis : this;

  const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);
  const tools = () => (typeof MidiTools !== "undefined" ? MidiTools : null);
  const ENGINE_KEY = "lily-engine";
  const SF_KEY = "lily-soundfont";
  const SF_SETS = {
    sgm: { label: "General MIDI", url: "" },
    salamander: { label: "Salamander grand piano", url: "https://storage.googleapis.com/magentadata/js/soundfonts/salamander" },
    jazz: { label: "Jazz Kit drums", url: "https://storage.googleapis.com/magentadata/js/soundfonts/jazz_kit" },
    synth: { label: "Simple synth", url: null },
  };

  let midiGen = 0;
  let pendingMidi = null;      // { url, blobUrl, gen } staged, fully downloaded
  let currentMidiBlob = null;  // blob URL currently loaded (revoked on swap)
  let midiParsed = null;       // { parsed, bytes, url, file, gen }
  let lastUrl = null;
  let lastFile = null;
  let listenersOn = false;
  const mix = { muted: new Set(), solo: new Set(), section: "full", loop: false };

  const magentaAvailable = () => {
    try { return !!(root.customElements && root.customElements.get("midi-player")); }
    catch (_) { return false; }
  };
  const player = () => $("midiPlayer");
  const viz = () => $("midiViz");
  const getEngine = () => {
    const v = $("engineSelect") ? $("engineSelect").value : null;
    if (v === "sf2" || v === "basic") return v;
    return "magenta";
  };
  const autoplayOn = () => ($("autoplay") ? $("autoplay").checked !== false : true);
  function setStatus(t) {
    const el = $("midiStatus");
    if (el) el.textContent = t;
  }
  function emit(type, detail) {
    try {
      if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function")
        root.dispatchEvent(new root.CustomEvent(type, { detail }));
    } catch (_) {}
  }
  function once(el, key, ev, fn) {
    if (!el || el.dataset["m" + key]) return;
    el.dataset["m" + key] = "1";
    el.addEventListener(ev, fn);
  }
  function unlockAudio() {
    try {
      const ctx = root.Tone && root.Tone.context;
      if (ctx && ctx.state === "suspended") ctx.resume();
    } catch (_) {}
    try { Basic.ensure(); } catch (_) {}
  }

  // ---- Dependency-free fallback synth (WebAudio oscillators + noise) ----
  // Fed by MidiTools.parseMidi output; needs no network, no samples.
  const Basic = {
    ctx: null, master: null, live: new Set(), endTimer: null,
    tickTimer: null, notes: [], dur: 0, startedAt: 0, offset: 0, playing: false,
    ensure() {
      if (!this.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) throw new Error("WebAudio not available in this browser");
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return this.ctx;
    },
    // Flatten parsed SMF to [{ t, d, ch, pitch, vel, prog }] in seconds.
    build(parsed) {
      const T = tools();
      if (!T) throw new Error("MidiTools not loaded");
      const notes = [];
      const open = new Map();
      for (const tr of parsed.tracks) {
        const prog = new Map();
        for (const e of tr) {
          if (e.kind === "prog") { prog.set(e.ch, e.prog); continue; }
          if (e.kind !== "note") continue;
          const key = e.ch + ":" + e.pitch;
          const t = T.ticksToSec(parsed, e.tick);
          if (e.on && e.vel > 0) {
            if (!open.has(key)) open.set(key, { t, vel: e.vel });
          } else if (open.has(key)) {
            const o = open.get(key);
            open.delete(key);
            notes.push({ t: o.t, d: Math.max(0.05, t - o.t), ch: e.ch, pitch: e.pitch, vel: o.vel, prog: prog.get(e.ch) || 0 });
          }
        }
      }
      const end = T.durationSec(parsed);
      for (const [key, o] of open) {
        const [ch, pitch] = key.split(":").map(Number);
        notes.push({ t: o.t, d: Math.max(0.05, end - o.t), ch, pitch, vel: o.vel, prog: 0 });
      }
      notes.sort((a, b) => a.t - b.t);
      return { notes, dur: end };
    },
    loadBytes(buf) {
      const T = tools();
      if (!T) throw new Error("MidiTools not loaded");
      const parsed = T.parseMidi(T.toBytes(buf));
      const { notes, dur } = this.build(parsed);
      this.notes = notes;
      this.dur = dur;
      this.offset = 0;
      return { notes: notes.length, dur };
    },
    voice(prog, ch) {
      if (ch === 9) return { kind: "drum" };
      if (prog <= 7) return { kind: "osc", type: "triangle", gain: 0.5 };
      if (prog <= 15) return { kind: "osc", type: "sine", gain: 0.5 };
      if (prog <= 23) return { kind: "osc", type: "square", gain: 0.18 };
      if (prog <= 31) return { kind: "osc", type: "sawtooth", gain: 0.3 };
      if (prog <= 39) return { kind: "osc", type: "sine", gain: 0.6 };
      if (prog <= 55) return { kind: "osc", type: "triangle", gain: 0.4 };
      if (prog <= 79) return { kind: "osc", type: "sawtooth", gain: 0.25 };
      return { kind: "osc", type: "square", gain: 0.15 };
    },
    play(fromSec) {
      this.ensure();
      this.stop(true);
      const t0 = this.ctx.currentTime + 0.05;
      const off = Math.max(0, fromSec || 0);
      this.startedAt = t0;
      this.offset = off;
      this.playing = true;
      for (const n of this.notes) {
        if (n.t + n.d <= off) continue;
        const t = t0 + Math.max(0, n.t - off);
        const d = n.t >= off ? n.d : n.t + n.d - off;
        this.schedule(n, t, d);
      }
      const remain = Math.max(0.1, this.dur - off);
      this.endTimer = setTimeout(() => this.onEnded(), (remain + 0.3) * 1000);
      this.tickTimer = setInterval(() => this.tick(), 250);
      this.tick();
      setStatus(`Basic synth playing (${fmtClock(this.dur)}).`);
    },
    schedule(n, t, d) {
      const v = this.voice(n.prog, n.ch);
      const peak = Math.max(0.02, (n.vel / 127) * (v.gain || 0.4));
      if (v.kind === "drum") {
        const len = Math.min(0.25, Math.max(0.06, d));
        const buf = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * len), this.ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const f = this.ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = n.pitch < 40 ? 300 : n.pitch < 60 ? 2000 : 6000;
        const g = this.ctx.createGain();
        g.gain.value = peak;
        src.connect(f); f.connect(g); g.connect(this.master);
        src.start(t);
        this.live.add(src);
        src.onended = () => { try { src.disconnect(); } catch (_) {} this.live.delete(src); };
        return;
      }
      const o = this.ctx.createOscillator();
      o.type = v.type;
      o.frequency.value = 440 * Math.pow(2, (n.pitch - 69) / 12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.09, d));
      o.connect(g); g.connect(this.master);
      o.start(t);
      o.stop(t + Math.max(0.1, d) + 0.1);
      this.live.add(o);
      o.onended = () => { try { o.disconnect(); try { g.disconnect(); } catch (_) {} } catch (_) {} this.live.delete(o); };
    },
    tick() {
      const el = $("basicTime");
      if (el && this.playing) {
        const cur = this.offset + (this.ctx.currentTime - this.startedAt);
        el.textContent = `${fmtClock(cur)} / ${fmtClock(this.dur)}`;
      }
    },
    onEnded() {
      this.playing = false;
      if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
      const el = $("basicTime");
      if (el) el.textContent = `${fmtClock(this.dur)} / ${fmtClock(this.dur)}`;
      if (mix.loop && autoplayOn() && lastUrl) {
        this.play(0);
        return;
      }
      setStatus(`Basic synth ready (${fmtClock(this.dur)}) — press Play.`);
    },
    stop(silent) {
      if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }
      if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
      for (const n of [...this.live]) {
        try { n.stop ? n.stop() : n.disconnect(); } catch (_) {}
        try { n.disconnect(); } catch (_) {}
      }
      this.live.clear();
      this.playing = false;
      if (!silent) setStatus(this.notes.length ? `Basic synth ready (${fmtClock(this.dur)}) — press Play.` : "Basic synth idle.");
    },
  };

  function fmtClock(s) {
    s = Math.max(0, s || 0);
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  // ---- Fetch + parse (no DOM needed) ----
  async function fetchBytes(url) {
    if (url.startsWith("data:")) {
      const bin = atob(url.slice(url.indexOf(",") + 1));
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    }
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.arrayBuffer();
  }

  // A new MIDI is ready. Same URL + already parsed = just (re)stage it.
  // A new MIDI is ready. Same URL as the in-flight/completed load = nothing
  // to do (or just re-stage into a freshly mounted player); this guard also
  // stops the tab-switch effect from cutting audio that just started.
  function needsStage() {
    const e = effectiveEngine();
    if (e === "magenta") {
      const p = player();
      return !!(p && !p.src);
    }
    if (e === "basic") return Basic.notes.length === 0;
    return false; // sf2 is fed by events and manages itself
  }
  async function load(url, opts) {
    opts = opts || {};
    if (!url) return;
    if (url === lastUrl) {
      if (midiParsed && needsStage()) routeCurrent(opts.autoplay !== undefined ? opts.autoplay : false);
      return;
    }
    const gen = ++midiGen;
    lastUrl = url;
    lastFile = opts.file || lastFile;
    const autoplay = opts.autoplay !== undefined ? opts.autoplay : autoplayOn();
    resetMixForFile();
    let bytes = null;
    try {
      bytes = await fetchBytes(url);
    } catch (e) {
      if (gen !== midiGen) return;
      setStatus(`MIDI download failed: ${e && e.message || e}`);
      return;
    }
    if (gen !== midiGen) return;
    const T = tools();
    if (T) {
      try {
        midiParsed = { parsed: T.parseMidi(bytes), bytes, url, file: lastFile, gen };
      } catch (e) {
        midiParsed = null;
      }
    }
    if (!midiParsed && T) {
      setStatus("MIDI could not be parsed — download it and check the file.");
      return;
    }
    if (!midiParsed) midiParsed = { parsed: null, bytes, url, file: lastFile, gen };
    renderMixerPanel();
    applyMixAndStage(autoplay);
  }

  // Build the mixed MIDI (mute/solo filter, then section slice) and hand it
  // to the active engine. Mixer math runs on bytes, so all engines agree.
  function applyMixAndStage(shouldStart) {
    if (!midiParsed) return;
    const T = tools();
    let out = null;
    try {
      if (T && midiParsed.parsed) {
        const groups = T.mixGroups(midiParsed.parsed);
        const all = new Set(groups.flatMap((g) => g.channels));
        const keep = effectiveChannels(groups);
        let parsed = midiParsed.parsed;
        if (keep.size < all.size) {
          out = T.filterChannels(parsed, keep);
          parsed = T.parseMidi(out);
        }
        if (mix.section !== "full") {
          const [a, b] = T.sectionRange(parsed, mix.section);
          out = T.sliceTime(parsed, a, b);
        }
      }
    } catch (e) {
      out = null;
    }
    const engine = effectiveEngine();
    if (engine === "sf2") {
      const url = out ? blobUrlOf(out) : midiParsed.url;
      const dl = $("dlMidi");
      if (dl && out) dl.href = url;
      else if (dl) dl.href = midiParsed.url;
      emit("lily:midi", { url, from: "midi-engine" });
      return;
    }
    const buf = out || midiParsed.bytes;
    if (!buf) return;
    const url = out ? blobUrlOf(out) : midiParsed.url;
    const dl = $("dlMidi");
    if (dl) dl.href = out ? url : midiParsed.url;
    stageMixedBytes(buf, url, shouldStart, midiParsed.gen);
  }

  let lastBlob = null;
  function blobUrlOf(buf) {
    if (lastBlob && lastBlob.startsWith("blob:")) {
      try { URL.revokeObjectURL(lastBlob); } catch (_) {}
    }
    const blob = new Blob([buf], { type: "audio/midi" });
    lastBlob = URL.createObjectURL(blob);
    return lastBlob;
  }

  // Route already-loaded bytes to the active engine (engine switch, rebind).
  function routeCurrent(shouldStart) {
    if (!midiParsed) return;
    applyMixAndStage(shouldStart);
  }

  function stageMixedBytes(buf, url, shouldStart, gen) {
    const engine = effectiveEngine();
    if (engine === "basic") {
      try { stopMagenta(); } catch (_) {}
      const noMidi = $("noMidi");
      if (noMidi) noMidi.hidden = true;
      try {
        const info = Basic.loadBytes(buf);
        if (shouldStart) Basic.play(0);
        else setStatus(`Basic synth ready (${fmtClock(info.dur)}, ${info.notes} notes) — press Play.`);
      } catch (e) {
        setStatus(`Basic synth failed: ${e && e.message || e}`);
      }
      return;
    }
    // Magenta.
    try { Basic.stop(true); } catch (_) {}
    if (pendingMidi && pendingMidi.blobUrl && pendingMidi.blobUrl.startsWith("blob:")) {
      try { URL.revokeObjectURL(pendingMidi.blobUrl); } catch (_) {}
    }
    pendingMidi = { url, blobUrl: url, gen };
    swapStagedMidi(shouldStart);
  }

  function safeStart() {
    unlockAudio();
    try {
      const p = player();
      if (!p) { setStatus("Open the MIDI tab to play."); return; }
      const r = p.start();
      if (r && r.catch) r.catch(() => setStatus("Autoplay blocked — press Play in the player."));
    } catch (_) {
      setStatus("Autoplay blocked — press Play in the player.");
    }
  }
  function stopMagenta() {
    try { player().stop(); } catch (_) {}
  }

  // Swap the staged file into <midi-player>. The load listener attaches
  // BEFORE src is set so the async load is never missed; the generation
  // guard drops stale handlers on rapid saves. No player element (MIDI tab
  // closed) = stay staged; bind() flushes on tab open.
  function swapStagedMidi(shouldStart) {
    if (!pendingMidi) return;
    const p = player();
    if (!p) return; // tab closed; bind() will flush
    const { url, blobUrl, gen } = pendingMidi;
    pendingMidi = null;
    if (currentMidiBlob) {
      try { URL.revokeObjectURL(currentMidiBlob); } catch (_) {}
      currentMidiBlob = null;
    }
    if (blobUrl.startsWith("blob:")) currentMidiBlob = blobUrl;
    stopMagenta(); // cut current audio so the new version starts clean
    try { Basic.stop(true); } catch (_) {}
    const noMidi = $("noMidi");
    if (noMidi) noMidi.hidden = true;
    p.addEventListener("load", () => {
      if (gen !== midiGen) return;
      setStatus("Magenta player ready — press Play if it did not start.");
      if (shouldStart && autoplayOn()) safeStart();
    }, { once: true });
    p.src = blobUrl;
    const v = viz();
    if (v) v.src = url;
  }

  function clearMidi(silent) {
    midiGen++;
    pendingMidi = null;
    midiParsed = null;
    lastUrl = null;
    const box = $("mixerBox");
    if (box) box.hidden = true;
    try { Basic.stop(true); } catch (_) {}
    try { stopMagenta(); } catch (_) {}
    try { player().removeAttribute("src"); } catch (_) {}
    try { viz().removeAttribute("src"); } catch (_) {}
    const noMidi = $("noMidi");
    if (noMidi) noMidi.hidden = false;
    if (!silent) {
      emit("lily:midi-clear", { from: "midi-engine" });
      setStatus("No MIDI — compile the score first.");
    }
  }

  // ---- Mixer (mute/solo per instrument) + section play/loop ----
  function currentMixGroups() {
    try {
      const T = tools();
      return midiParsed && midiParsed.parsed && T ? T.mixGroups(midiParsed.parsed) : [];
    } catch (_) { return []; }
  }
  function effectiveChannels(groups) {
    groups = groups || currentMixGroups();
    const all = new Set(groups.flatMap((g) => g.channels));
    if (mix.solo.size) {
      const keep = new Set();
      for (const g of groups) if (mix.solo.has(g.label)) for (const c of g.channels) keep.add(c);
      return keep.size ? keep : all; // soloing unknown labels = no-op
    }
    const keep = new Set(all);
    for (const g of groups) if (mix.muted.has(g.label)) for (const c of g.channels) keep.delete(c);
    return keep.size ? keep : all; // never mute absolutely everything
  }
  function isSectionFile(name) {
    return /(^|\/)sections\//.test(name || "");
  }
  function resetMixForFile() {
    mix.muted.clear();
    mix.solo.clear();
    mix.section = "full";
    const loopBox = $("loopBox");
    if (loopBox) { loopBox.checked = false; }
    mix.loop = false;
    try { if (root.SF2 && root.SF2.setLoop) root.SF2.setLoop(false); } catch (_) {}
  }
  function renderMixerPanel() {
    const box = $("mixerBox"), rows = $("mixerRows"), times = $("sectionTimes");
    if (!box || !rows) return;
    const groups = currentMixGroups();
    if (!midiParsed || !groups.length) { box.hidden = true; return; }
    box.hidden = false;
    const secFile = isSectionFile(midiParsed.file);
    box.querySelectorAll("[data-section]").forEach((b) => {
      const s = b.dataset.section;
      b.hidden = secFile && s !== "full";
      try {
        b.style.fontWeight = mix.section === s ? "700" : "";
        b.style.textDecoration = mix.section === s ? "underline" : "";
      } catch (_) {}
    });
    try {
      const T = tools();
      if (times && T && midiParsed.parsed) {
        const d = T.durationSec(midiParsed.parsed);
        times.textContent = secFile
          ? `section ${fmtClock(d)} (this file is one section)`
          : `full ${fmtClock(d)} · verse 0:00–${fmtClock(d / 2)} · chorus ${fmtClock(d / 2)}–${fmtClock(d)}`;
      }
    } catch (_) {}
    rows.innerHTML = "";
    for (const g of groups) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:6px;margin:2px 0;font-size:13px;";
      const nm = document.createElement("span");
      nm.style.cssText = "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
      nm.title = `channels ${g.channels.join(", ")} · ${g.tracks.length} track(s)`;
      nm.textContent = g.label;
      if (mix.muted.has(g.label) && !mix.solo.has(g.label)) nm.style.opacity = "0.45";
      const mk = (label, title, on, bg) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.title = title;
        b.style.cssText = `border:1px solid #888;border-radius:4px;min-width:24px;padding:0 4px;${on ? `background:${bg};color:#fff;` : ""}`;
        return b;
      };
      const m = mk("M", `Mute ${g.label}`, mix.muted.has(g.label), "#b00");
      m.onclick = () => {
        mix.muted.has(g.label) ? mix.muted.delete(g.label) : mix.muted.add(g.label);
        renderMixerPanel();
        applyMixAndStage(true);
      };
      const s = mk("S", `Solo ${g.label}`, mix.solo.has(g.label), "#080");
      s.onclick = () => {
        mix.solo.has(g.label) ? mix.solo.delete(g.label) : mix.solo.add(g.label);
        renderMixerPanel();
        applyMixAndStage(true);
      };
      row.append(nm, m, s);
      rows.appendChild(row);
    }
  }

  // ---- SoundFont picker (browser-side Magenta sets, one at a time) ----
  function loadSoundFont() {
    let key = "sgm";
    try {
      const saved = typeof localStorage !== "undefined" && localStorage.getItem(SF_KEY);
      if (saved && saved in SF_SETS) key = saved;
    } catch (_) {}
    const sel = $("sfSelect");
    if (sel) sel.value = key;
    try { if (player()) player().soundFont = SF_SETS[key].url; } catch (_) {}
    return key;
  }
  function applySoundFont(key) {
    const set = SF_SETS[key] || SF_SETS.sgm;
    const p = player();
    let wasPlaying = false;
    try { wasPlaying = !!(p && p.playing); } catch (_) {}
    try { if (p) p.stop(); } catch (_) {}
    try {
      if (p) p.soundFont = set.url;
    } catch (_) {
      setStatus("Soundfont switch failed.");
      return;
    }
    try { localStorage.setItem(SF_KEY, key in SF_SETS ? key : "sgm"); } catch (_) {}
    const cur = (pendingMidi && pendingMidi.blobUrl) || (p && p.src);
    if (!cur || !p) return; // nothing loaded yet; choice applies next
    setStatus(`Loading ${set.label.toLowerCase()}…`);
    try { p.removeAttribute("src"); } catch (_) {}
    midiGen++;
    const gen = midiGen;
    let loaded = false;
    p.addEventListener("load", () => {
      if (gen !== midiGen) return;
      loaded = true;
      setStatus(`${set.label} ready.`);
      if (wasPlaying && autoplayOn()) safeStart();
    }, { once: true });
    setTimeout(() => {
      if (gen === midiGen && !loaded) setStatus("Soundfont load timed out — check connection, or use Basic.");
    }, 30000);
    p.src = cur;
  }

  // ---- Engine selection ----
  function effectiveEngine() {
    const e = getEngine();
    if (e === "magenta" && !magentaAvailable()) return "basic";
    return e;
  }
  function applyEngineUI() {
    const e = effectiveEngine();
    const midiBox = $("midiBox"), sf2Box = $("sf2Box"), basicBox = $("basicBox");
    if (midiBox) midiBox.hidden = e !== "magenta";
    if (sf2Box) sf2Box.hidden = e !== "sf2";
    if (basicBox) basicBox.hidden = e !== "basic";
    const magentaSfWrap = $("magentaSfWrap"), sf2Wrap = $("sf2Wrap");
    if (magentaSfWrap) magentaSfWrap.hidden = e !== "magenta";
    if (sf2Wrap) sf2Wrap.hidden = e !== "sf2";
  }
  function loadEngine() {
    let e = null;
    try { e = typeof localStorage !== "undefined" && localStorage.getItem(ENGINE_KEY); } catch (_) {}
    if (e !== "sf2" && e !== "basic" && e !== "magenta") e = null;
    if (!e) e = magentaAvailable() ? "magenta" : "basic";
    if (e === "magenta" && !magentaAvailable()) e = "basic";
    const sel = $("engineSelect");
    if (sel) sel.value = e;
    applyEngineUI();
    return e;
  }
  function onEngineChange() {
    const sel = $("engineSelect");
    const e = sel && sel.value === "sf2" ? "sf2" : sel && sel.value === "basic" ? "basic" : "magenta";
    if (sel && e === "magenta" && !magentaAvailable()) {
      sel.value = "basic";
      setStatus("Magenta player failed to load (check connection) — using Basic synth.");
      try { localStorage.setItem(ENGINE_KEY, "basic"); } catch (_) {}
      applyEngineUI();
      routeCurrent(false);
      return;
    }
    try { localStorage.setItem(ENGINE_KEY, e); } catch (_) {}
    // Stop the engine we're leaving so they never overlap.
    try { stopMagenta(); } catch (_) {}
    try { if (root.SF2 && root.SF2.stop) root.SF2.stop(); } catch (_) {}
    try { Basic.stop(true); } catch (_) {}
    pendingMidi = null;
    applyEngineUI();
    routeCurrent(false);
  }

  // ---- One-time window wiring + per-mount control wiring ----
  function ensureListeners() {
    if (listenersOn) return;
    listenersOn = true;
    if (typeof root.addEventListener !== "function") return; // node self-test
    root.addEventListener("pointerdown", unlockAudio);
    root.addEventListener("keydown", unlockAudio);
    root.addEventListener("lily:midi", (e) => {
      if (e && e.detail && e.detail.from === "midi-engine") return;
      load(e && e.detail && e.detail.url, {
        autoplay: e && e.detail && e.detail.autoplay,
        file: e && e.detail && e.detail.file,
      });
    });
    root.addEventListener("lily:midi-clear", (e) => {
      if (e && e.detail && e.detail.from === "midi-engine") return;
      clearMidi(true);
      setStatus("No MIDI — compile the score first.");
    });
  }

  function bind() {
    ensureListeners();
    if (typeof document === "undefined") return;
    loadSoundFont();
    loadEngine();
    if (getEngine() === "magenta" && !magentaAvailable()) {
      setStatus("Magenta player failed to load (check connection) — using Basic synth.");
    }
    const sel = $("engineSelect");
    once(sel, "eng", "change", onEngineChange);
    const sf = $("sfSelect");
    once(sf, "sf", "change", () => applySoundFont(sf.value));
    const upBtn = $("sf2UploadBtn"), upFile = $("sf2UploadFile");
    if (upBtn && upFile && !upBtn.dataset.mup) {
      upBtn.dataset.mup = "1";
      upBtn.onclick = () => upFile.click();
      upFile.addEventListener("change", async () => {
        const file = upFile.files && upFile.files[0];
        upFile.value = "";
        if (!file) return;
        if (!root.SF2 || !root.SF2.upload) {
          setStatus("Uploader not ready — reload the page and retry.");
          return;
        }
        setStatus(`Uploading ${file.name}…`);
        let res;
        try {
          res = await root.SF2.upload(file);
        } catch (e) {
          setStatus(`Upload failed: ${(e && e.message) || e}`);
          return;
        }
        if (!res || !res.ok) {
          setStatus(`Upload failed: ${(res && res.error) || "unknown error"}`);
          return;
        }
        try { localStorage.setItem(ENGINE_KEY, "sf2"); } catch (_) {}
        if (sel) sel.value = "sf2";
        applyEngineUI();
        routeCurrent(true);
        setStatus("Soundfont ready — SF2 engine active.");
      });
    }
    document.querySelectorAll("#mixerBox [data-section]").forEach((b) => {
      once(b, "sec" + b.dataset.section, "click", () => {
        mix.section = b.dataset.section;
        renderMixerPanel();
        applyMixAndStage(true); // audition immediately
      });
    });
    const loopBox = $("loopBox");
    once(loopBox, "loop", "change", () => {
      mix.loop = !!loopBox.checked;
      try { if (root.SF2 && root.SF2.setLoop) root.SF2.setLoop(loopBox.checked); } catch (_) {}
    });
    const p = player();
    if (p && !p.dataset.mstop) {
      p.dataset.mstop = "1";
      p.addEventListener("stop", (e) => {
        try {
          if (mix.loop && autoplayOn() && e && e.detail && e.detail.finished) safeStart();
        } catch (_) {}
      });
    }
    const bp = $("basicPlay");
    once(bp, "bplay", "click", () => {
      try {
        if (!Basic.notes.length && midiParsed && midiParsed.bytes) Basic.loadBytes(midiParsed.bytes);
        if (!Basic.notes.length) { setStatus("No MIDI loaded — compile the score first."); return; }
        Basic.play(0);
      } catch (e) {
        setStatus(`Basic synth failed: ${(e && e.message) || e}`);
      }
    });
    const bs = $("basicStop");
    once(bs, "bstop", "click", () => { try { Basic.stop(); } catch (_) {} });
    // SF2 controls mount with the same tab; (re)bind them too.
    try { if (root.SF2 && root.SF2.bind) root.SF2.bind(); } catch (_) {}
    // Flush anything that arrived while the tab was closed, and re-stage
    // into the freshly mounted controls after a tab switch.
    renderMixerPanel();
    if (midiParsed && needsStage()) routeCurrent(false);
  }

  return {
    bind,
    load,
    clear: () => clearMidi(false),
    getEngine: effectiveEngine,
    _Basic: Basic,
    _state: () => ({ midiParsed: !!midiParsed, pending: !!pendingMidi, lastUrl }),
  };
});
