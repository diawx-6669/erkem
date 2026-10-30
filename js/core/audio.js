// Весь звук дворца рождается здесь, в WebAudio: никаких чужих записей.
// Контекст создаётся только после первого нажатия (так требуют браузеры).
import { store } from './store.js';

let ctx = null;
let master, sfxBus, musicBus, noiseBuf;
const listeners = new Set();

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const N = { C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, Bb4: 70, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, D6: 86, E6: 88, G6: 91 };

function create() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  master = ctx.createGain();
  master.gain.value = store.get('muted') ? 0 : 0.9;
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85;
  musicBus = ctx.createGain(); musicBus.gain.value = 0.55;
  sfxBus.connect(master); musicBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export function unlock() {
  if (!ctx && !create()) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}
export const ready = () => !!ctx;
export const now = () => (ctx ? ctx.currentTime : 0);

export function isMuted() { return !!store.get('muted'); }
export function setMuted(m) {
  store.set('muted', m);
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.03);
  listeners.forEach((fn) => fn(m));
}
export function onMute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/* ---------- инструменты ---------- */

function env(g, t, a, peak, dur, rel = 0.08) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur - rel), rel / 3);
}

function tone(freq, t, dur, { type = 'sine', gain = 0.2, attack = 0.005, rel = 0.08, bus = sfxBus, slideTo, detune = 0, cutoff } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  let last = o;
  if (cutoff) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
    o.connect(f); last = f;
  }
  last.connect(g); g.connect(bus);
  env(g, t, attack, gain, dur, rel);
  o.start(t); o.stop(t + dur + rel * 3 + 0.05);
  return o;
}

function noise(t, dur, { gain = 0.2, type = 'bandpass', freq = 2000, q = 1, attack = 0.002, sweepTo, bus = sfxBus } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  s.loopStart = Math.random(); s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = ctx.createGain();
  s.connect(f); f.connect(g); g.connect(bus);
  env(g, t, attack, gain, dur, dur * 0.6);
  s.start(t, Math.random()); s.stop(t + dur * 2 + 0.1);
}

function bell(freq, t, dur = 1.2, gain = 0.16, bus = sfxBus) {
  tone(freq, t, dur, { gain, attack: 0.002, rel: dur * 0.8, bus });
  tone(freq * 2.0, t, dur * 0.5, { gain: gain * 0.35, attack: 0.002, rel: dur * 0.4, bus });
  tone(freq * 3.01, t, dur * 0.25, { gain: gain * 0.15, attack: 0.002, rel: dur * 0.2, bus });
}

function brass(freq, t, dur, gain = 0.12, bus = sfxBus) {
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
  const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 9;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(freq * 6, t + 0.06); f.frequency.setTargetAtTime(freq * 3, t + 0.08, 0.1);
  const g = ctx.createGain();
  o.connect(f); o2.connect(f); f.connect(g); g.connect(bus);
  env(g, t, 0.03, gain, dur, 0.12);
  o.start(t); o2.start(t); o.stop(t + dur + 0.5); o2.stop(t + dur + 0.5);
}

function kick(t, gain = 0.5, bus = musicBus) {
  tone(150, t, 0.18, { gain, slideTo: 42, attack: 0.001, rel: 0.12, bus });
  noise(t, 0.012, { gain: gain * 0.25, type: 'highpass', freq: 3000, bus });
}
function clap(t, gain = 0.18, bus = musicBus) {
  for (let i = 0; i < 3; i++) noise(t + i * 0.011, 0.03, { gain, freq: 1400, q: 1.2, bus });
  noise(t + 0.033, 0.14, { gain: gain * 0.8, freq: 1300, q: 0.9, bus });
}
function hat(t, open = false, gain = 0.07, bus = musicBus) {
  noise(t, open ? 0.14 : 0.035, { gain, type: 'highpass', freq: 7500, q: 0.5, bus });
}
function bass(freq, t, dur, gain = 0.24, bus = musicBus) {
  tone(freq, t, dur, { type: 'sawtooth', gain, cutoff: 520, attack: 0.004, rel: 0.05, bus });
  tone(freq / 2, t, dur, { type: 'sine', gain: gain * 0.8, attack: 0.004, rel: 0.05, bus });
}
function stab(freqs, t, dur, gain = 0.06, bus = musicBus) {
  freqs.forEach((f) => {
    tone(f, t, dur, { type: 'sawtooth', gain, cutoff: 2400, attack: 0.004, rel: 0.06, bus, detune: -6 });
    tone(f, t, dur, { type: 'square', gain: gain * 0.5, cutoff: 2000, attack: 0.004, rel: 0.06, bus, detune: 7 });
  });
}
function pluck(freq, t, dur, gain = 0.1, bus = musicBus) {
  tone(freq, t, dur, { type: 'triangle', gain, attack: 0.002, rel: dur * 0.7, bus });
  tone(freq * 2, t, dur * 0.4, { type: 'sine', gain: gain * 0.25, attack: 0.002, rel: dur * 0.3, bus });
}
function lead(freq, t, dur, gain = 0.09, bus = musicBus) {
  const o = tone(freq, t, dur, { type: 'square', gain, cutoff: 3200, attack: 0.01, rel: 0.07, bus });
  const lfo = ctx.createOscillator(); const lg = ctx.createGain();
  lfo.frequency.value = 5.5; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.detune);
  lfo.start(t + 0.12); lfo.stop(t + dur + 0.3);
}

/* ---------- звуковые эффекты ---------- */

function play(fn) {
  if (!ctx) return;
  try { fn(ctx.currentTime + 0.01); } catch (e) { console.warn(e); }
}

export const sfx = {
  ding: () => play((t) => { bell(midi(N.G6) / 2, t, 0.9, 0.14); bell(midi(N.D6), t + 0.07, 1.1, 0.12); }),
  star: () => play((t) => [N.C6, N.E6, N.G6].forEach((m, i) => bell(midi(m), t + i * 0.07, 0.8, 0.12))),
  pop: () => play((t) => { noise(t, 0.05, { gain: 0.5, freq: 1800, q: 0.6 }); tone(700, t, 0.08, { gain: 0.25, slideTo: 140 }); }),
  tick: () => play((t) => tone(1900, t, 0.012, { type: 'square', gain: 0.06, rel: 0.01 })),
  click: () => play((t) => { tone(880, t, 0.03, { type: 'triangle', gain: 0.12, slideTo: 1320 }); }),
  boop: () => play((t) => { tone(392, t, 0.09, { type: 'triangle', gain: 0.14, slideTo: 523 }); tone(523, t + 0.09, 0.12, { type: 'triangle', gain: 0.12, slideTo: 440 }); }),
  whoosh: () => play((t) => noise(t, 0.45, { gain: 0.18, freq: 300, sweepTo: 4000, q: 1.5 })),
  sparkle: () => play((t) => { for (let i = 0; i < 7; i++) bell(midi(84 + [0, 4, 7, 12, 7, 12, 16][i]), t + i * 0.05, 0.5, 0.06); }),
  magic: () => play((t) => { for (let i = 0; i < 12; i++) bell(midi(72 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 28][i]), t + i * 0.035, 0.6, 0.05); }),
  boom: () => play((t) => { tone(140, t, 0.6, { gain: 0.6, slideTo: 35, rel: 0.3 }); noise(t, 0.7, { gain: 0.45, type: 'lowpass', freq: 1200, sweepTo: 120 }); }),
  shutter: () => play((t) => { noise(t, 0.02, { gain: 0.35, freq: 4000 }); noise(t + 0.07, 0.03, { gain: 0.3, freq: 2500 }); }),
  stamp: () => play((t) => { tone(110, t, 0.15, { gain: 0.5, slideTo: 50 }); noise(t, 0.08, { gain: 0.3, type: 'lowpass', freq: 900 }); }),
  puff: () => play((t) => noise(t, 0.35, { gain: 0.2, freq: 900, sweepTo: 300, q: 0.5, attack: 0.02 })),
  crash: () => play((t) => noise(t, 1.4, { gain: 0.16, type: 'highpass', freq: 5000, q: 0.3 })),
  beep: (high = false) => play((t) => tone(high ? 1320 : 880, t, 0.14, { type: 'triangle', gain: 0.2 })),
  snap: () => play((t) => { tone(1200, t, 0.03, { type: 'triangle', gain: 0.18, slideTo: 600 }); bell(midi(N.C6), t + 0.02, 0.4, 0.06); }),
  flip: () => play((t) => noise(t, 0.08, { gain: 0.12, freq: 2500, sweepTo: 5000, q: 2 })),
  door: () => play((t) => { for (let i = 0; i < 6; i++) bell(midi(76 + [0, 3, 7, 12, 15, 19][i]), t + i * 0.06, 0.7, 0.07); noise(t, 0.5, { gain: 0.08, freq: 600, sweepTo: 2500 }); }),
  fanfare: () => play((t) => {
    const s = 0.13;
    [[N.G4, 0], [N.G4, s], [N.G4, 2 * s], [N.C5, 3 * s]].forEach(([m, d]) => brass(midi(m), t + d, s * 0.9, 0.13));
    [N.C5, N.E5, N.G5, N.C4].forEach((m) => brass(midi(m), t + 4 * s, 1.1, 0.09));
    [N.C6, N.E6, N.G6].forEach((m, i) => bell(midi(m), t + 4 * s + i * 0.05, 1.2, 0.07));
    noise(t + 4 * s, 1.2, { gain: 0.08, type: 'highpass', freq: 6000 });
  }),
  /** Барабанная дробь с нарастанием. Возвращает промис, который завершится на ударе тарелки. */
  drumroll(dur = 1.3) {
    return new Promise((resolve) => {
      if (!ctx) { setTimeout(resolve, dur * 1000); return; }
      const t0 = ctx.currentTime + 0.02;
      let t = t0;
      while (t < t0 + dur) {
        const k = (t - t0) / dur;
        noise(t, 0.04, { gain: 0.05 + 0.18 * k, freq: 1800, q: 0.8 });
        t += 0.055 - 0.02 * k;
      }
      kick(t0 + dur, 0.6, sfxBus);
      noise(t0 + dur, 1.2, { gain: 0.18, type: 'highpass', freq: 5000, q: 0.3 });
      setTimeout(resolve, dur * 1000);
    });
  }
};

/* ---------- музыка ---------- */

// Песни описаны как секвенсор по шестнадцатым: step(i, t) вызывается заранее
// с точным временем, поэтому ритм не «плывёт» даже при занятом процессоре.
const C = { C: [60, 64, 67], G: [55, 59, 62], G7: [55, 59, 65], F: [53, 57, 60], Am: [57, 60, 64], Em: [52, 55, 59], C7: [60, 64, 70], Dm: [50, 53, 57] };

const HB_MELODY = [ // [шаг, длина в шестнадцатых, нота] — сетка 3/4, 12 шагов в такте
  [8, 3, N.G4], [11, 1, N.G4],
  [12, 4, N.A4], [16, 4, N.G4], [20, 4, N.C5],
  [24, 8, N.B4], [32, 3, N.G4], [35, 1, N.G4],
  [36, 4, N.A4], [40, 4, N.G4], [44, 4, N.D5],
  [48, 8, N.C5], [56, 3, N.G4], [59, 1, N.G4],
  [60, 4, N.G5], [64, 4, N.E5], [68, 4, N.C5],
  [72, 4, N.B4], [76, 4, N.A4], [80, 3, N.F5], [83, 1, N.F5],
  [84, 4, N.E5], [88, 4, N.C5], [92, 4, N.D5],
  [96, 12, N.C5]
];
const HB_CHORDS = [null, 'C', 'G', 'G7', 'C', 'C7', 'F', ['C', 'G7'], 'C'];

const songs = {
  birthday: {
    bpm: 112, stepsPerBar: 12, length: 9 * 12, loop: false,
    step(i, t, sd) {
      const bar = Math.floor(i / 12), s = i % 12;
      HB_MELODY.forEach(([at, len, m]) => {
        if (at === i) { bell(midi(m + 12), t, len * sd * 1.6, 0.13, musicBus); lead(midi(m), t, len * sd * 0.92, 0.05); }
      });
      const ch = HB_CHORDS[bar];
      if (!ch) { if (s === 0) bell(midi(N.C6), t, 1, 0.05, musicBus); return; }
      const name = Array.isArray(ch) ? ch[s < 8 ? 0 : 1] : ch;
      const notes = C[name];
      if (s === 0) { bass(midi(notes[0] - 12), t, sd * 3.5); kick(t, 0.35); }
      if (s === 4 || s === 8) { notes.forEach((n) => pluck(midi(n), t, sd * 3, 0.05)); hat(t, false, 0.05); }
      if (bar === 8 && s === 0) { notes.forEach((n) => pluck(midi(n + 12), t, sd * 12, 0.05)); noise(t, 1.5, { gain: 0.1, type: 'highpass', freq: 6000, bus: musicBus }); }
    }
  },
  disco: {
    bpm: 118, stepsPerBar: 16, length: 64, loop: true,
    prog: ['C', 'Am', 'F', 'G'],
    riff: [76, null, 79, null, 81, null, 79, 76, null, 74, null, 72, 74, null, 76, null,
      null, null, 72, null, 74, 76, null, 79, null, 81, 84, null, 81, null, 79, null],
    step(i, t, sd) {
      const bar = Math.floor(i / 16) % 4, s = i % 16;
      const notes = C[this.prog[bar]];
      if (s % 4 === 0) kick(t, 0.45);
      if (s === 4 || s === 12) clap(t);
      if (s % 4 === 2) hat(t, true, 0.06); else if (s % 2 === 1) hat(t, false, 0.03);
      if (s % 2 === 0) bass(midi(notes[0] - 12 + (s % 4 === 2 ? 12 : 0)), t, sd * 1.6, 0.2);
      if (s === 3 || s === 6 || s === 11 || s === 14) stab(notes.map((n) => midi(n + 12)), t, sd * 0.9);
      if (bar >= 2) { const r = this.riff[((bar - 2) * 16 + s)]; if (r) lead(midi(r), t, sd * 1.7, 0.06); }
    }
  },
  potato: {
    bpm: 152, stepsPerBar: 8, length: 32, loop: true,
    mel: [72, 76, 79, 76, 74, 77, 79, 77, 72, 76, 79, 84, 83, 79, 74, 71],
    step(i, t, sd) {
      const s = i % 8, bar = Math.floor(i / 8) % 4;
      const lift = Math.floor(i / 32) % 3; // каждые 4 такта чуть выше — напряжение растёт
      const root = [48, 55, 48, 55][bar] + lift;
      if (s % 4 === 0) bass(midi(root - 12 + 12), t, sd * 1.4, 0.2);
      if (s % 4 === 2) stab([root + 16, root + 19, root + 24].map(midi), t, sd * 0.8, 0.04);
      if (s % 2 === 0) hat(t, false, 0.05);
      if (s % 4 === 0) kick(t, 0.3);
      const m = this.mel[(bar % 2) * 8 + s];
      if (m) pluck(midi(m + lift), t, sd * 0.9, 0.09);
    }
  }
};

let current = null; // { name, song, startTime, step, timer }

function scheduler() {
  if (!current) return;
  const { song } = current;
  const sd = 60 / song.bpm / (song.stepsPerBar === 12 ? 4 : song.stepsPerBar / 4);
  while (current.next < ctx.currentTime + 0.18) {
    if (!song.loop && current.step >= song.length) {
      const end = current.next;
      const name = current.name;
      setTimeout(() => { if (current && current.name === name) stopMusic(); }, Math.max(0, (end - ctx.currentTime) * 1000 + 1200));
      return;
    }
    try { song.step(current.step, current.next, sd); } catch (e) { console.warn(e); }
    current.step++;
    current.next += sd;
  }
}

export const music = {
  play(name) {
    unlock();
    if (!ctx) return null;
    if (current && current.name === name) return current;
    stopMusic(true);
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.55, ctx.currentTime);
    const song = songs[name];
    const sd = 60 / song.bpm / (song.stepsPerBar === 12 ? 4 : song.stepsPerBar / 4);
    current = { name, song, step: 0, startTime: ctx.currentTime + 0.08, next: ctx.currentTime + 0.08, sd };
    current.timer = setInterval(scheduler, 40);
    scheduler();
    return current;
  },
  stop: (hard) => stopMusic(hard),
  get playing() { return current ? current.name : null; },
  /** Для ритм-игры: когда началась песня и сколько длится одна доля. */
  clock() { return current ? { start: current.startTime, beat: 60 / current.song.bpm, now: ctx.currentTime } : null; }
};

function stopMusic(hard = false) {
  if (!current) return;
  clearInterval(current.timer);
  current = null;
  if (!ctx) return;
  // Резкий обрыв нужен для «Замри!», мягкий — для всего остального.
  const t = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setValueAtTime(musicBus.gain.value, t);
  musicBus.gain.linearRampToValueAtTime(0.0001, t + (hard ? 0.03 : 0.4));
  setTimeout(() => { if (!current && ctx) musicBus.gain.setValueAtTime(0.55, ctx.currentTime); }, hard ? 300 : 900);
}

/** Поток микрофона пропускаем через анализатор — для свечей. */
export async function micAnalyser() {
  unlock();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser(); an.fftSize = 1024;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 80;
  src.connect(hp); hp.connect(an);
  const buf = new Float32Array(an.fftSize);
  return {
    level() { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); },
    stop() { stream.getTracks().forEach((tr) => tr.stop()); try { src.disconnect(); } catch (e) { /* ignore */ } }
  };
}
