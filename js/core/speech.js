import { store } from './store.js';
// Озвучка инструкций: Еркем читает медленно, поэтому всё можно послушать.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voice = null;

function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  voice = voices.find((v) => /ru(-|_)RU/i.test(v.lang) && /female|milena|alena|irina|anna|google/i.test(v.name))
    || voices.find((v) => /^ru/i.test(v.lang)) || null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const canSpeak = !!synth;

export function speak(text, { rate = 0.92, pitch = 1.12 } = {}) {
  if (!synth || !text || store.get('voiceOff') || store.get('muted')) return Promise.resolve();
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
    u.lang = 'ru-RU';
    if (voice) u.voice = voice;
    u.rate = rate; u.pitch = pitch;
    return new Promise((resolve) => {
      u.onend = resolve; u.onerror = resolve;
      synth.speak(u);
      setTimeout(resolve, 12000);
    });
  } catch (e) {
    return Promise.resolve();
  }
}

export function stopSpeaking() {
  try { synth && synth.cancel(); } catch (e) { /* ignore */ }
}
