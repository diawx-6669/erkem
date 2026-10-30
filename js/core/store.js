// Сохранение прогресса. localStorage может быть недоступен (приватный режим,
// запрет cookies) — тогда всё живёт в памяти до перезагрузки.
const KEY = 'erkem-palace-v2';
const memory = { stars: {}, coupons: [], onceWon: [], seenIntro: false, muted: false };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(memory, JSON.parse(raw));
  } catch (e) { /* без сохранения */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (e) { /* без сохранения */ }
}
load();

const listeners = new Set();
const emit = () => [...listeners].forEach((fn) => { try { fn(memory); } catch (e) { console.warn(e); } });

export const store = {
  get state() { return memory; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  totalStars() { return Object.values(memory.stars).reduce((a, b) => a + b, 0); },
  starsFor(id) { return memory.stars[id] || 0; },
  /** Сохраняет лучший результат игры. Возвращает, сколько звёзд добавилось к общему счёту. */
  awardStars(id, n) {
    const before = memory.stars[id] || 0;
    if (n <= before) return 0;
    memory.stars[id] = n;
    save(); emit();
    return n - before;
  },

  addCoupon(item, source) {
    const c = {
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      id: item.id, emoji: item.emoji, text: item.text,
      source, wonAt: Date.now(), used: false, usedAt: null, fill: ''
    };
    memory.coupons.unshift(c);
    if (item.once && !memory.onceWon.includes(item.id)) memory.onceWon.push(item.id);
    save(); emit();
    return c;
  },
  useCoupon(uid) {
    const c = memory.coupons.find((x) => x.uid === uid);
    if (c) { c.used = true; c.usedAt = Date.now(); save(); emit(); }
  },
  fillCoupon(uid, value) {
    const c = memory.coupons.find((x) => x.uid === uid);
    if (c) { c.fill = value; save(); }
  },
  isOnceWon(id) { return memory.onceWon.includes(id); },

  set(key, value) { memory[key] = value; save(); emit(); },
  get(key) { return memory[key]; },
  reset() {
    memory.stars = {}; memory.coupons = []; memory.onceWon = []; memory.seenIntro = false;
    save(); emit();
  }
};
