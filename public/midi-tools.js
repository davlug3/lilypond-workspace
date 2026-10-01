/* midi-tools.js — small SMF helpers for the player: parse, mute/solo by
 * channel, slice a time range, re-serialize. Engine-agnostic (both MIDI
 * engines play the resulting bytes). Verse = first half of the 16-bar
 * MIDI (constant 132 BPM). UMD: window.MidiTools, or module.exports.
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.MidiTools = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function readVlq(bytes, i) {
    let v = 0, b;
    do {
      b = bytes[i++];
      v = (v << 7) | (b & 0x7f);
    } while (b & 0x80);
    return [v, i];
  }

  function writeVlq(v) {
    if (v < 0) v = 0;
    let out = [v & 0x7f];
    v >>= 7;
    while (v > 0) {
      out.unshift((v & 0x7f) | 0x80);
      v >>= 7;
    }
    // Set continuation bits on all but the last byte.
    for (let k = 0; k < out.length - 1; k++) out[k] |= 0x80;
    return out;
  }

  // Event: { tick, kind, ...kindFields }. kinds:
  //  note:{ch,pitch,vel,on}, prog:{ch,prog}, ctrl:{ch,cc,val},
  //  bend:{ch,lsb,msb}, pressure:{ch,val}, poly:{ch,pitch,val},
  //  meta:{type,data:Uint8Array}, sysex:{data}, tempoUs (folded into tempos[])
  function parseMidi(buf) {
    const d = new Uint8Array(buf);
    const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
    if (d[0] !== 0x4d || d[1] !== 0x54 || d[2] !== 0x68 || d[3] !== 0x64)
      throw new Error("not a MIDI file");
    const fmt = dv.getUint16(8);
    const ntrk = dv.getUint16(10);
    const div = dv.getUint16(12);
    if (div & 0x8000) throw new Error("SMPTE timing not supported");
    let pos = 14;
    const tracks = [];
    for (let t = 0; t < ntrk; t++) {
      if (d[pos] !== 0x4d || d[pos + 1] !== 0x54 || d[pos + 2] !== 0x72 || d[pos + 3] !== 0x6b)
        throw new Error("bad track header " + t);
      const len = dv.getUint32(pos + 4);
      const end = pos + 8 + len;
      let i = pos + 8, tick = 0, status = 0;
      const events = [];
      while (i < end) {
        let dt;
        [dt, i] = readVlq(d, i);
        tick += dt;
        const b = d[i];
        if (b === 0xff) {
          const type = d[i + 1];
          let ln;
          [ln, i] = readVlq(d, i + 2);
          const data = d.slice(i, i + ln);
          i += ln;
          if (type === 0x51 && ln === 3)
            events.push({ tick, kind: "tempo", us: (data[0] << 16) | (data[1] << 8) | data[2] });
          else if (type !== 0x2f)
            events.push({ tick, kind: "meta", type, data });
          // 0x2f end-of-track is regenerated on serialize; drop it.
        } else if (b === 0xf0 || b === 0xf7) {
          let ln;
          [ln, i] = readVlq(d, i + 1);
          events.push({ tick, kind: "sysex", data: d.slice(i, i + ln) });
          i += ln;
        } else {
          let p1, p2 = null;
          if (b & 0x80) { status = b; i++; }
          const cmd = status & 0xf0, ch = status & 0x0f;
          p1 = d[i++];
          if (cmd !== 0xc0 && cmd !== 0xd0) p2 = d[i++];
          if (cmd === 0x90 && p2 > 0) events.push({ tick, kind: "note", ch, pitch: p1, vel: p2, on: true });
          else if (cmd === 0x90 || cmd === 0x80) events.push({ tick, kind: "note", ch, pitch: p1, vel: 0, on: false });
          else if (cmd === 0xc0) events.push({ tick, kind: "prog", ch, prog: p1 });
          else if (cmd === 0xb0) events.push({ tick, kind: "ctrl", ch, cc: p1, val: p2 });
          else if (cmd === 0xe0) events.push({ tick, kind: "bend", ch, lsb: p1, msb: p2 });
          else if (cmd === 0xd0) events.push({ tick, kind: "pressure", ch, val: p1 });
          else if (cmd === 0xa0) events.push({ tick, kind: "poly", ch, pitch: p1, val: p2 });
        }
      }
      tracks.push(events);
      pos = end;
    }
    return { fmt, division: div, tracks };
  }

  function tempoAt(parsed, tick) {
    let us = 500000;
    for (const tr of parsed.tracks)
      for (const e of tr) {
        if (e.kind === "tempo" && e.tick <= tick) us = e.us;
      }
    // Tracks are time-ordered; a linear scan is fine for our file sizes.
    return us;
  }

  function ticksToSec(parsed, tick) {
    // Piecewise through the (possibly changing) tempo map.
    const points = [];
    for (const tr of parsed.tracks)
      for (const e of tr) if (e.kind === "tempo") points.push([e.tick, e.us]);
    points.sort((a, b) => a[0] - b[0]);
    let s = 0, last = 0, us = 500000, di = 0;
    for (const [tt, u] of points) {
      if (tt > tick) break;
      s += ((tt - last) * us) / 1e6 / parsed.division;
      last = tt; us = u; di++;
    }
    s += ((tick - last) * us) / 1e6 / parsed.division;
    return s;
  }

  function secToTicks(parsed, sec) {
    const points = [];
    for (const tr of parsed.tracks)
      for (const e of tr) if (e.kind === "tempo") points.push([e.tick, e.us]);
    points.sort((a, b) => a[0] - b[0]);
    let s = 0, last = 0, us = 500000;
    const segs = [];
    for (const [tt, u] of points) {
      segs.push([last, tt, us]);
      s += ((tt - last) * us) / 1e6 / parsed.division;
      last = tt; us = u;
    }
    segs.push([last, Infinity, us]);
    // Walk segments to invert.
    let acc = 0;
    for (const [a, b, u] of segs) {
      const segDur = b === Infinity ? Infinity : ((b - a) * u) / 1e6 / parsed.division;
      if (sec <= acc + segDur) return Math.round(a + ((sec - acc) * 1e6 * parsed.division) / u);
      acc += segDur;
    }
    return last;
  }

  function durationSec(parsed) {
    let maxTick = 0;
    for (const tr of parsed.tracks)
      for (const e of tr) if (e.tick > maxTick) maxTick = e.tick;
    return ticksToSec(parsed, maxTick);
  }

  // Sounding tracks in file order: [{index, name, channels:[], notes}].
  function soundingTracks(parsed) {
    const out = [];
    parsed.tracks.forEach((tr, i) => {
      let name = null;
      const chs = new Set();
      let notes = 0;
      for (const e of tr) {
        if (e.kind === "meta" && e.type === 0x03 && name === null)
          name = new TextDecoder("latin1").decode(e.data);
        if (e.kind === "note" && e.on) { chs.add(e.ch); notes++; }
      }
      if (notes > 0) out.push({ index: i, name, channels: [...chs].sort(), notes });
    });
    return out;
  }

  // Known rock-band layout (08/09/10 scores): 11 sounding tracks in score
  // order. Groups Tab staves with their guitar so one fader = one instrument.
  // Returns [{label, tracks:[indexes], channels:[...] }] or null.
  const BAND_GROUPS = [
    ["Chords", 0], ["Vocals 1", 1], ["Vocals 2", 2],
    ["Piano", 3, 4], ["Guitar 1", 5, 6], ["Guitar 2", 7, 8],
    ["Bass", 9], ["Drums", 10],
  ];

  function mixGroups(parsed) {
    const st = soundingTracks(parsed);
    if (st.length === 11) {
      return BAND_GROUPS.map(([label, ...slots]) => {
        const members = slots.map((s) => st[s]).filter(Boolean);
        const channels = [...new Set(members.flatMap((m) => m.channels))].sort();
        return { label, tracks: members.map((m) => m.index), channels };
      });
    }
    return st.map((m, i) => ({
      label: (m.name || "").replace(/^:/, "").trim() || ("Track " + (i + 1) + " (ch " + m.channels.join(",") + ")"),
      tracks: [m.index],
      channels: m.channels,
    }));
  }

  function serialize(parsed) {
    const bytes = [];
    const pushStr = (s) => { for (const c of s) bytes.push(c.charCodeAt(0)); };
    const push32 = (v) => bytes.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
    const push16 = (v) => bytes.push((v >>> 8) & 0xff, v & 0xff);
    pushStr("MThd"); push32(6); push16(Math.min(parsed.fmt, 1)); push16(parsed.tracks.length); push16(parsed.division);
    for (const tr of parsed.tracks) {
      const tb = [];
      let last = 0;
      const sorted = [...tr].sort((a, b) => a.tick - b.tick);
      for (const e of sorted) {
        for (const v of writeVlq(e.tick - last)) tb.push(v);
        last = e.tick;
        if (e.kind === "note") {
          tb.push(e.on ? 0x90 | e.ch : 0x80 | e.ch, e.pitch, e.on ? e.vel : 0);
        } else if (e.kind === "prog") tb.push(0xc0 | e.ch, e.prog);
        else if (e.kind === "ctrl") tb.push(0xb0 | e.ch, e.cc, e.val);
        else if (e.kind === "bend") tb.push(0xe0 | e.ch, e.lsb, e.msb);
        else if (e.kind === "pressure") tb.push(0xd0 | e.ch, e.val);
        else if (e.kind === "poly") tb.push(0xa0 | e.ch, e.pitch, e.val);
        else if (e.kind === "tempo") {
          tb.push(0xff, 0x51, 0x03, (e.us >>> 16) & 0xff, (e.us >>> 8) & 0xff, e.us & 0xff);
        } else if (e.kind === "meta") {
          tb.push(0xff, e.type);
          for (const v of writeVlq(e.data.length)) tb.push(v);
          for (const b of e.data) tb.push(b);
        } else if (e.kind === "sysex") {
          tb.push(0xf0);
          for (const v of writeVlq(e.data.length)) tb.push(v);
          for (const b of e.data) tb.push(b);
        }
      }
      for (const v of writeVlq(0)) tb.push(v);
      tb.push(0xff, 0x2f, 0x00);
      pushStr("MTrk"); push32(tb.length);
      for (const b of tb) bytes.push(b);
    }
    return new Uint8Array(bytes).buffer;
  }

  function toBytes(buf) {
    if (buf instanceof ArrayBuffer) return buf;
    if (buf.buffer instanceof ArrayBuffer) return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    throw new Error("expected ArrayBuffer");
  }

  // Drop note on/off (+aftertouch) on muted channels. keep = Set of channels.
  function filterChannels(parsed, keep) {
    const tracks = parsed.tracks.map((tr) =>
      tr.filter((e) => {
        if ((e.kind === "note" || e.kind === "poly") && !keep.has(e.ch)) return false;
        return true;
      })
    );
    return serialize({ fmt: parsed.fmt, division: parsed.division, tracks });
  }

  // Slice [t0Sec, t1Sec): keep events inside, rebase to zero, carry each
  // channel's last program + volume/pan + the tempo map so playback speed
  // and sounds match, then all-notes-off per used channel.
  function sliceTime(parsed, t0Sec, t1Sec) {
    const t0 = secToTicks(parsed, Math.max(0, t0Sec));
    const t1 = secToTicks(parsed, Math.max(t0Sec, t1Sec));
    // Channel state (program + a few controllers) just before t0.
    const prog = new Map(), ctrls = new Map();
    for (const tr of parsed.tracks)
      for (const e of tr) {
        if (e.tick >= t0) break;
        if (e.kind === "prog") prog.set(e.ch, e.prog);
        else if (e.kind === "ctrl" && (e.cc === 7 || e.cc === 10 || e.cc === 11)) ctrls.set(e.ch + ":" + e.cc, e.val);
      }
    // Tempo at/before t0 becomes the slice's tick-0 tempo (scan everything;
    // a break-on-first-non-tempo would miss it behind track names).
    let tempoUs = 500000, tempoTick = -1;
    for (const tr of parsed.tracks)
      for (const e of tr) {
        if (e.kind === "tempo" && e.tick <= t0 && e.tick >= tempoTick) {
          tempoUs = e.us;
          tempoTick = e.tick;
        }
      }
    const used = new Set();
    const tracks = parsed.tracks.map((tr) => {
      const out = [];
      for (const e of tr) {
        if (e.kind === "tempo") {
          if (e.tick === t0) out.push({ tick: 0, kind: "tempo", us: e.us });
          else if (e.tick > t0 && e.tick < t1)
            out.push({ tick: e.tick - t0, kind: "tempo", us: e.us });
          continue;
        }
        if (e.tick < t0 || e.tick >= t1) continue;
        const c = { ...e, tick: e.tick - t0 };
        if (c.kind === "note" && c.on) used.add(c.ch);
        if (c.kind === "note" && !c.on) used.add(c.ch);
        out.push(c);
      }
      return out;
    });
    // Prepend carried state + tempo at tick 0 (tempo first so players lock).
    const head = [{ tick: 0, kind: "tempo", us: tempoUs }];
    for (const [ch, p] of [...prog.entries()].sort()) head.push({ tick: 0, kind: "prog", ch, prog: p });
    for (const [k, v] of [...ctrls.entries()].sort()) {
      const [ch, cc] = k.split(":").map(Number);
      head.push({ tick: 0, kind: "ctrl", ch, cc, val: v });
    }
    tracks[0] = [...head, ...tracks[0]];
    // All-notes-off per used channel at the end (avoid hung notes).
    const endTick = Math.max(0, t1 - t0);
    for (const ch of [...used].sort()) tracks[0].push({ tick: endTick, kind: "ctrl", ch, cc: 123, val: 0 });
    return serialize({ fmt: parsed.fmt, division: parsed.division, tracks });
  }

  // Section bounds for the 16-bar form (verse bars 1-8, chorus 9-16):
  // constant tempo, no repeats, so the split is exactly halfway.
  function sectionRange(parsed, which) {
    const dur = durationSec(parsed);
    if (which === "verse") return [0, dur / 2];
    if (which === "chorus") return [dur / 2, dur];
    return [0, dur];
  }

  return {
    parseMidi, serialize, filterChannels, sliceTime,
    soundingTracks, mixGroups, sectionRange,
    durationSec, ticksToSec, secToTicks, toBytes,
  };
});
