// Общие кусочки интерфейса: кнопки, озвучка, конфетти, карточки-сюрпризы.
import { speak, canSpeak } from './speech.js';
import { sfx, unlock } from './audio.js';
import { doodle } from './doodles.js';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const gsap = () => window.gsap;
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Мини-конструктор DOM: h('div.cls#id', {attrs}, ...children) */
export function h(sel, attrs = {}, ...kids) {
  const [, tag = 'div', rest = ''] = sel.match(/^([a-z0-9-]*)(.*)$/i);
  const el = document.createElement(tag || 'div');
  rest.replace(/([.#])([\w-]+)/g, (_, t, v) => { if (t === '.') el.classList.add(v); else el.id = v; });
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
  return el;
}

/** Крупная кнопка: иконка + 1–3 слова. */
export function btn({ icon = '', text = '', onClick, variant = 'pink', cls = '', label, size = '' }) {
  const b = h(`button.btn.btn--${variant}${size ? '.btn--' + size : ''}${cls ? '.' + cls : ''}`, { type: 'button', 'aria-label': label || text || null });
  if (icon) b.append(h('span.btn-icon', { html: icon.startsWith('<') ? icon : icon, 'aria-hidden': 'true' }));
  if (text) b.append(h('span.btn-text', {}, text));
  b.addEventListener('click', (e) => { unlock(); sfx.click(); onClick && onClick(e); });
  return b;
}

/** Кнопка 🔊: читает текст вслух. */
export function sayBtn(text, { cls = '' } = {}) {
  const b = h(`button.say${cls ? '.' + cls : ''}`, { type: 'button', 'aria-label': 'Послушать' });
  b.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19 h8 l11 -9 v28 l-11 -9 h-8z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="3.5" stroke-linejoin="round"/><path d="M33 17 q5 7 0 14 M38 12 q9 12 0 24" fill="none" stroke="#5B1A4A" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  if (!canSpeak) b.hidden = true;
  b.addEventListener('click', (e) => {
    e.stopPropagation(); unlock();
    const t = typeof text === 'function' ? text() : text;
    b.classList.add('is-talking');
    speak(t).then(() => b.classList.remove('is-talking'));
  });
  return b;
}

/** Строка-инструкция с кнопкой озвучки. */
export function hint(text, { cls = '' } = {}) {
  const el = h(`div.hint${cls ? '.' + cls : ''}`);
  const p = h('p', {}, text);
  el.append(sayBtn(() => p.textContent), p);
  el.set = (t) => { p.textContent = t; };
  return el;
}

/** Фото-стикер с белой обводкой и скотчем. */
export function sticker(photo, { rot = 0, tape = 'top', cls = '', big = false, eager = false } = {}) {
  const fig = h(`figure.sticker${cls ? '.' + cls : ''}`, { style: `--rot:${rot}deg` });
  fig.append(h('img', { src: big ? photo.src : photo.thumb, alt: photo.note || 'Еркем', loading: eager ? 'eager' : 'lazy', decoding: 'async', draggable: 'false' }));
  if (tape) tape.split(' ').forEach((t) => fig.append(h(`span.tape.tape--${t}`)));
  return fig;
}

/* ---------- конфетти ---------- */
const PALETTE = ['#FF5FA2', '#C2185B', '#FFC93C', '#3DDBB0', '#ffffff', '#FF9CC6'];
export function confetti(opts = {}) {
  if (!window.confetti) return;
  const base = { colors: PALETTE, disableForReducedMotion: true, zIndex: 3000, scalar: 1.1 };
  try { window.confetti({ ...base, ...opts }); } catch (e) { /* ignore */ }
}
export function burstAt(el, opts = {}) {
  const r = el.getBoundingClientRect();
  confetti({ particleCount: 40, spread: 70, startVelocity: 28, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight }, ...opts });
}
export function salute() {
  if (reduced()) return confetti({ particleCount: 60, spread: 90, origin: { y: 0.6 } });
  confetti({ particleCount: 90, spread: 100, origin: { y: 0.65 } });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 250);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 400);
  setTimeout(() => confetti({ particleCount: 50, spread: 120, startVelocity: 45, shapes: ['star'], colors: ['#FFC93C', '#FFE07A'], origin: { y: 0.4 } }), 650);
}

/** Звёзды летят от элемента в счётчик звёзд. */
export function flyStars(n, fromEl) {
  const target = document.querySelector('.star-meter');
  if (!target || !gsap()) return Promise.resolve();
  const fr = fromEl ? fromEl.getBoundingClientRect() : { left: innerWidth / 2 - 30, top: innerHeight / 2 - 30, width: 60, height: 60 };
  const tr = target.getBoundingClientRect();
  const jobs = [];
  for (let i = 0; i < n; i++) {
    const s = h('div.fly-star', { html: doodle.star() });
    document.body.append(s);
    const x0 = fr.left + fr.width / 2 - 24, y0 = fr.top + fr.height / 2 - 24;
    gsap().set(s, { x: x0, y: y0, scale: 0.2 });
    jobs.push(new Promise((res) => {
      gsap().timeline({ delay: i * 0.25, onComplete: () => { s.remove(); sfx.star(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); res(); } })
        .to(s, { scale: 1.4, x: x0 + rand(-80, 80), y: y0 - rand(40, 120), rotation: rand(-90, 90), duration: 0.45, ease: 'back.out(2)' })
        .to(s, { x: tr.left + tr.width / 2 - 24, y: tr.top + tr.height / 2 - 24, scale: 0.6, rotation: 360, duration: 0.7, ease: 'power2.in' });
    }));
  }
  return Promise.all(jobs);
}

/* ---------- оверлеи ---------- */
export function overlay(content, { cls = '', closable = true, onClose } = {}) {
  const ov = h(`div.overlay${cls ? '.' + cls : ''}`, { role: 'dialog', 'aria-modal': 'true' });
  const box = h('div.overlay-box');
  box.append(content);
  ov.append(box);
  document.body.append(ov);
  const close = () => {
    if (!ov.isConnected) return;
    document.removeEventListener('keydown', onKey);
    if (gsap() && !reduced()) gsap().to(ov, { opacity: 0, duration: 0.2, onComplete: () => ov.remove() });
    else ov.remove();
    onClose && onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape' && closable) close(); };
  document.addEventListener('keydown', onKey);
  if (gsap() && !reduced()) {
    gsap().fromTo(ov, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap().fromTo(box, { scale: 0.6, rotation: -4 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.8)' });
  }
  setTimeout(() => (box.querySelector('button') || box).focus?.(), 60);
  ov.close = close;
  return ov;
}

/** Карточка приза или задания: подарок трясётся под барабанную дробь, раскрывается. */
export function revealCard(item, { onDone, extraButtons = [], doneText = 'Сделала!', kindText } = {}) {
  return new Promise((resolve) => {
    const isBonus = item.type === 'bonus';
    const wrap = h('div.reveal');
    const gift = h('div.reveal-gift', { html: doodle.gift({ color: isBonus ? '#FF5FA2' : '#3DDBB0', ribbon: '#FFC93C' }) });
    const card = h(`div.prize-card.${isBonus ? 'is-bonus' : 'is-task'}`);
    const label = kindText || (isBonus ? 'Королевский бонус' : 'Королевское задание');
    card.append(
      h('div.prize-kind', {}, label),
      h('div.prize-emoji', {}, item.emoji || '🎁'),
      h('p.prize-text', {}, item.text),
      h('div.prize-seal', { html: doodle.seal({ color: isBonus ? '#C2185B' : '#1FA88A' }) })
    );
    const actions = h('div.reveal-actions');
    wrap.append(gift, card, actions);
    const ov = overlay(wrap, { cls: 'overlay--reveal', closable: false });

    const finish = () => { ov.close(); onDone && onDone(); resolve(item); };
    const speakText = `${label}! ${item.text}`;
    actions.append(sayBtn(speakText));
    if (isBonus) actions.append(btn({ icon: '👑', text: 'В казну!', variant: 'gold', onClick: finish }));
    else actions.append(btn({ icon: '✅', text: doneText, variant: 'mint', onClick: () => { sfx.fanfare(); confetti({ particleCount: 70, spread: 80 }); speak('Жарайсың! Молодец!'); finish(); } }));
    extraButtons.forEach((b) => actions.prepend(b));

    const g = gsap();
    if (!g || reduced()) {
      gift.remove(); card.style.opacity = 1; actions.style.opacity = 1;
      (isBonus ? sfx.fanfare : sfx.sparkle)(); speak(speakText);
      return;
    }
    g.set(card, { opacity: 0, scale: 0.3, rotationY: 180 });
    g.set(actions, { opacity: 0 });
    const shake = g.to(gift, { rotation: 6, duration: 0.07, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    g.fromTo(gift, { scale: 0.4, y: 80 }, { scale: 1.15, y: 0, duration: 1.2, ease: 'power1.in' });
    sfx.drumroll(1.25).then(() => {
      shake.kill();
      g.timeline()
        .to(gift, { scale: 1.5, opacity: 0, rotation: 0, duration: 0.25, ease: 'power2.out' })
        .to(card, { opacity: 1, scale: 1, rotationY: 0, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.1')
        .to(actions, { opacity: 1, duration: 0.3 });
      burstAt(gift, { particleCount: 70, spread: 100 });
      (isBonus ? sfx.fanfare : sfx.sparkle)();
      setTimeout(() => speak(speakText), 400);
    });
  });
}

/** Экран победы. */
export function winScreen({ title = 'Жарайсың!', text = '', stars = 1, buttons = [], extra = null }) {
  const box = h('div.win');
  const starRow = h('div.win-stars');
  for (let i = 0; i < 3; i++) starRow.append(h(`span.win-star${i < stars ? '.on' : ''}`, { html: doodle.star({ fill: i < stars ? '#FFC93C' : '#F4D6E3' }) }));
  box.append(
    h('div.win-crown', { html: doodle.crown() }),
    h('h2.win-title', {}, title),
    text ? h('p.win-text', {}, text) : null,
    starRow,
    extra,
    h('div.win-actions', {}, sayBtn(`${title} ${text}`), ...buttons)
  );
  const ov = overlay(box, { cls: 'overlay--win' });
  sfx.fanfare(); salute();
  if (gsap() && !reduced()) gsap().from(box.querySelectorAll('.win-star.on'), { scale: 0, rotation: -180, stagger: 0.18, delay: 0.35, ease: 'back.out(2.5)', duration: 0.6 });
  setTimeout(() => speak(`${title} ${text}`), 500);
  return ov;
}

/** Взвешенный случайный выбор из призов/заданий. */
export function drawPrize(prizes, { type, isOnceWon = () => false, exclude = [] } = {}) {
  const kind = type || (Math.random() < prizes.bonusChance ? 'bonus' : 'task');
  const pool = prizes.items.filter((i) => i.type === kind && !(i.once && isOnceWon(i.id)) && !exclude.includes(i.id));
  const list = pool.length ? pool : prizes.items.filter((i) => i.type === kind);
  const total = list.reduce((a, i) => a + (i.weight || 1), 0);
  let r = Math.random() * total;
  for (const i of list) { r -= i.weight || 1; if (r <= 0) return i; }
  return list[0];
}

/** Таймер-кружок для заданий и челленджей. */
export function ringTimer(seconds, { onTick, onEnd } = {}) {
  const el = h('div.ring-timer');
  el.innerHTML = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" pathLength="100"/></svg><span class="ring-num">${seconds}</span>`;
  const fg = el.querySelector('.ring-fg'), num = el.querySelector('.ring-num');
  let left = seconds, t0 = 0, raf = 0, running = false, paused = 0;
  const frame = (ts) => {
    if (!running) return;
    if (!t0) t0 = ts;
    const el2 = (ts - t0) / 1000 + paused;
    const remain = Math.max(0, seconds - el2);
    fg.style.strokeDashoffset = String(100 - (remain / seconds) * 100);
    const s = Math.ceil(remain);
    if (s !== left) { left = s; num.textContent = s; onTick && onTick(s); if (s <= 3 && s > 0) sfx.beep(); }
    if (remain <= 0) { running = false; sfx.beep(true); onEnd && onEnd(); return; }
    raf = requestAnimationFrame(frame);
  };
  el.start = () => { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); };
  el.pause = () => { if (!running) return; running = false; cancelAnimationFrame(raf); paused += (performance.now() - (t0 || performance.now())) / 1000; };
  el.stop = () => { running = false; cancelAnimationFrame(raf); };
  el.reset = (s = seconds) => { el.stop(); seconds = s; left = s; paused = 0; num.textContent = s; fg.style.strokeDashoffset = '0'; };
  return el;
}

/** Выбор игроков (для семейных игр). */
export function playerChips(names, { onChange, selectable = true } = {}) {
  const wrap = h('div.players');
  const state = names.map((n) => ({ name: n, on: true, score: 0 }));
  state.forEach((p, i) => {
    const chip = h('button.player-chip', { type: 'button', 'aria-pressed': 'true' }, h('span.player-ini', {}, p.name[0]), h('span', {}, p.name));
    if (selectable) chip.addEventListener('click', () => { p.on = !p.on; chip.setAttribute('aria-pressed', String(p.on)); sfx.click(); onChange && onChange(state); });
    wrap.append(chip);
    p.el = chip;
  });
  wrap.state = state;
  return wrap;
}
