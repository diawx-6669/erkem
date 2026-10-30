// Сцены видео «Её Величество Еркем». Всё движение — в одном GSAP-таймлайне,
// поэтому каждый кадр можно получить точно: window.__seek(t).
// Музыка: 3/4, 120 BPM — такт 1.5 с. Смены кадров стоят на долях (см. music.py).
import { doodle } from '../js/core/doodles.js';

const qs = new URLSearchParams(location.search);
const V = (qs.get('o') || 'v') === 'v';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
const u = Math.min(W, H) / 100;
const DUR = 76;
const BAR = 1.5, BEAT = 0.5;

const stage = document.getElementById('stage');
stage.style.width = W + 'px'; stage.style.height = H + 'px';
stage.style.setProperty('--u', u + 'px');
document.body.style.width = W + 'px'; document.body.style.height = H + 'px';

let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const R = (a, b) => a + rnd() * (b - a);

function el(cls, parent = stage, html = '') {
  const e = document.createElement('div');
  e.className = cls; if (html) e.innerHTML = html;
  parent.append(e); return e;
}
const P = (f) => `../photos/${f}`;
const sizes = {};
function loadAll(files) {
  return Promise.all(files.map((f) => new Promise((res) => {
    const i = new Image(); i.onload = () => { sizes[f] = [i.naturalWidth, i.naturalHeight]; i.decode().then(res, res); }; i.onerror = res; i.src = P(f);
  })));
}
function fit(f, mw, mh) {
  const [w, h] = sizes[f] || [3, 4];
  const k = Math.min(mw / w, mh / h);
  return [w * k, h * k];
}
function sticker(parent, f, mw, mh, tapes = ['t1']) {
  const [w, h] = fit(f, mw, mh);
  const s = el('sticker', parent);
  s.style.width = w + 'px'; s.style.height = h + 'px';
  s.innerHTML = `<img src="${P(f)}">` + tapes.map((t) => `<span class="tape ${t}"></span>`).join('') + '<span class="sheen"></span>';
  s.w = w; s.h = h;
  gsap.set(s, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  return s;
}
const at = (e, x, y, extra = {}) => gsap.set(e, { x, y, ...extra });
function center(e) { gsap.set(e, { xPercent: -50, yPercent: -50 }); return e; }

const tl = gsap.timeline({ paused: true });
// fromTo по умолчанию сразу рисует начальное состояние — тогда будущие кадры видны раньше времени
const ft = (t, f, v, pos) => tl.fromTo(t, f, { immediateRender: false, ...v }, pos);
window.__tl = tl;

function scene(start, end) {
  const s = el('scene');
  tl.set(s, { visibility: 'visible' }, start);
  if (end < DUR) tl.set(s, { visibility: 'hidden' }, end);
  return s;
}
function typeText(e, text, t, dur) {
  const o = { n: 0 };
  e.textContent = '';
  tl.to(o, { n: text.length, duration: dur, ease: 'none', onUpdate: () => { e.textContent = text.slice(0, Math.round(o.n)); } }, t);
}
function sheen(s, t) { ft(s.querySelector('.sheen'), { backgroundPosition: '130% 0' }, { backgroundPosition: '-40% 0', duration: 0.9, ease: 'power1.inOut' }, t); }

const COLORS = ['#FF5FA2', '#FFC93C', '#3DDBB0', '#C2185B', '#ffffff', '#FF9CC6'];
function burst(parent, t, x, y, n = 30, power = 1, colors = COLORS) {
  for (let i = 0; i < n; i++) {
    const c = el('conf' + (rnd() < 0.35 ? ' star' : ''), parent);
    c.style.background = colors[i % colors.length];
    const a = R(0, Math.PI * 2), sp = R(20, 46) * u * power;
    const dx = Math.cos(a) * sp, dy = Math.sin(a) * sp * 0.8 - 18 * u * power;
    gsap.set(c, { x, y, opacity: 0, rotation: R(0, 360) });
    tl.set(c, { opacity: 1 }, t);
    tl.to(c, { keyframes: [{ x: x + dx * 0.7, y: y + dy, duration: 0.45, ease: 'power2.out' }, { x: x + dx, y: y + dy + R(40, 70) * u, duration: 1.3, ease: 'power1.in' }], rotation: `+=${R(200, 700)}`, duration: 1.75 }, t);
    tl.to(c, { opacity: 0, duration: 0.4 }, t + 1.35);
  }
}
function rain(parent, t0, t1, n, colors = ['#FFC93C', '#FFE07A', '#ffffff', '#FF5FA2']) {
  for (let i = 0; i < n; i++) {
    const c = el('conf' + (rnd() < 0.5 ? ' star' : ''), parent);
    c.style.background = colors[i % colors.length];
    const x = R(0, W), t = R(t0, t1 - 2.5);
    gsap.set(c, { x, y: -60, opacity: 1, rotation: R(0, 360) });
    tl.to(c, { y: H + 60, x: x + R(-12, 12) * u, rotation: `+=${R(300, 900)}`, duration: R(2.2, 3.4), ease: 'none' }, t);
  }
}
function wipe(t) {
  const w = el('wipe');
  const width = Math.max(W, H) * 1.4;
  w.style.width = width + 'px';
  gsap.set(w, { x: -width * 1.3, y: 0 });
  tl.to(w, { x: W + width * 0.3, duration: 0.8, ease: 'power2.inOut' }, t - 0.4);
}
function crownOn(parent, s, cx, top, tLand, scaleW = 0.5) {
  const c = el('abs', parent, doodle.crown());
  const cw = s.w * scaleW;
  c.style.width = cw + 'px';
  center(c);
  const y = top - cw * 0.18;
  gsap.set(c, { x: cx, y: -H, rotation: -25 });
  tl.to(c, { y, rotation: -8, duration: 0.5, ease: 'power2.in' }, tLand - 0.5);
  tl.to(c, { keyframes: [{ y: y - 4 * u, duration: 0.15, ease: 'power2.out' }, { y, duration: 0.15, ease: 'power2.in' }] }, tLand);
  return c;
}

/* ---------- плывущие на фоне сердечки (все сцены) ---------- */
function ambience() {
  const box = el('layer');
  const items = [];
  const kinds = [() => doodle.heart(), () => doodle.sparkle(), () => doodle.star(), () => doodle.heart({ fill: '#FFC93C' }), () => doodle.sparkle({ fill: '#3DDBB0' })];
  for (let i = 0; i < 18; i++) {
    const d = el('abs', box, kinds[i % kinds.length]());
    const s = R(3, 7) * u;
    d.style.width = s + 'px'; d.style.opacity = R(0.3, 0.6).toFixed(2);
    items.push({ d, x: R(0, W), sp: R(4, 9) * u, off: R(0, H + 200), sw: R(2, 5) * u, ph: R(0, 6) });
  }
  const o = { t: 0 };
  tl.to(o, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => {
    for (const it of items) {
      const y = H + 100 - ((o.t * it.sp + it.off) % (H + 250));
      gsap.set(it.d, { x: it.x + Math.sin(o.t * 0.8 + it.ph) * it.sw, y, rotation: Math.sin(o.t + it.ph) * 18 });
    }
  } }, 0);
  return box;
}

/* ---------- 1. Интро 0–6 ---------- */
function s1() {
  const s = scene(0, 6.4);
  const cam = el('layer', s);
  ft(cam, { scale: 1 }, { scale: 1.06, duration: 6.4, ease: 'none' }, 0);
  const pc = V ? [W * 0.5, H * 0.33] : [W * 0.28, H * 0.52];
  const ph = sticker(cam, '00-queen.jpg', V ? W * 0.62 : W * 0.34, V ? H * 0.4 : H * 0.7, ['t2', 't3']);
  gsap.set(ph, { x: pc[0], y: pc[1] + H, rotation: -4, scale: 0.5 });
  tl.to(ph, { y: pc[1], scale: 1, rotation: -3, duration: 1.1, ease: 'back.out(1.4)' }, 0.15);
  const top = pc[1] - ph.h / 2;
  crownOn(cam, ph, pc[0], top, 3.0, 0.56);
  tl.to(ph, { keyframes: [{ scaleY: 0.94, scaleX: 1.03, duration: 0.1 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' }] }, 3.0);
  burst(cam, 3.0, pc[0], top, 40, 1.1);
  sheen(ph, 3.4);

  const tx = V ? W * 0.5 : W * 0.68;
  const small = center(el('abs hand', cam)); small.style.cssText += `font-size:${8.5 * u}px;color:#C2185B;white-space:nowrap`;
  at(small, tx, V ? H * 0.64 : H * 0.24);
  typeText(small, 'Её Величество', 0.4, 0.9);
  const name = center(el('abs oi sticker-text', cam)); name.style.cssText += `font-size:${V ? 13.5 * u : 12 * u}px;white-space:nowrap;line-height:1`;
  name.innerHTML = [...'Еркем'].map((c) => `<span style="display:inline-block">${c}</span>`).join('');
  at(name, tx, V ? H * 0.73 : H * 0.43);
  const letters = [...name.children];
  letters.forEach((l, i) => { if (i % 2) l.style.color = '#C2185B'; if (i === 2) l.style.color = '#FFC93C'; });
  tl.from(letters, { y: -H * 0.6, rotation: (i) => [-20, 15, -10, 20, -15][i], duration: 0.8, ease: 'bounce.out', stagger: 0.12 }, 1.2);
  tl.to(letters, { y: -2 * u, duration: 0.5, ease: 'sine.inOut', stagger: { each: 0.1, yoyo: true, repeat: 5 } }, 3.2);
  const age = center(el('pill', cam)); age.innerHTML = '<span style="font-family:Nunito;font-weight:900">7</span> лет';
  age.style.fontSize = 9 * u + 'px';
  at(age, tx, V ? H * 0.83 : H * 0.63, { rotation: -5 });
  tl.from(age, { scale: 3.2, opacity: 0, rotation: 20, duration: 0.3, ease: 'power4.in' }, 4.2);
  burst(cam, 4.5, tx, V ? H * 0.83 : H * 0.63, 20, 0.6);
  const kz = center(el('abs hand', cam)); kz.style.cssText += `font-size:${8 * u}px;color:#1FA88A;white-space:nowrap`;
  at(kz, tx, V ? H * 0.91 : H * 0.8, { rotation: -3 });
  typeText(kz, 'Туған күніңмен!', 4.6, 0.7);
}

/* ---------- 2. Как росла королева 6–24 ---------- */
const GROW = [
  ['01-newborn.jpg', 'Новорождённая', 'Самая маленькая королева'],
  ['02-brother.jpg', '1 месяц', 'Первый день с братом'],
  ['03-dandelion.jpg', '1 годик', 'Желание на одуванчик'],
  ['04-family.jpg', '1 годик', 'Вся наша команда'],
  ['05-mountains.jpg', '2 годика', 'Кричит горам: «Я здесь!»'],
  ['06-apple.jpg', '3 годика', 'Яблоко больше головы'],
  ['00-queen.jpg', '6 лет', 'Почти королева'],
  ['07-now.jpg', '6 лет', 'В красном платье с мамой'],
  ['08-selfie.jpg', '6 лет', 'Брат, держись!']
];
function s2() {
  const s = scene(6, 24.4);
  const world = el('layer', s);
  const pts = GROW.map((_, i) => V ? [W * (i % 2 ? 0.66 : 0.34), H * 0.56 + i * H * 0.37] : [W * 0.5 + i * W * 0.34, H * (i % 2 ? 0.6 : 0.46)]);
  // нарисованная дорожка между фото
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const ww = V ? W : W * 0.5 + 9 * W * 0.34 + W, wh = V ? H * 0.56 + 9 * H * 0.37 + H : H;
  svg.setAttribute('width', ww); svg.setAttribute('height', wh);
  svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;filter:url(#w)';
  world.append(svg);
  pts.forEach((p, i) => {
    if (!i) return;
    const q = pts[i - 1];
    const path = document.createElementNS(svgNS, 'path');
    const mx = (p[0] + q[0]) / 2 + (V ? (i % 2 ? 1 : -1) * W * 0.12 : 0), my = (p[1] + q[1]) / 2 + (V ? 0 : (i % 2 ? 1 : -1) * H * 0.15);
    path.setAttribute('d', `M${q[0]} ${q[1]} Q${mx} ${my} ${p[0]} ${p[1]}`);
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#FF9CC6'); path.setAttribute('stroke-width', 1.2 * u); path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', `${2.5 * u} ${2.2 * u}`);
    svg.append(path);
    const len = path.getTotalLength();
    const mask = document.createElementNS(svgNS, 'path');
    // «рисуем» линию, плавно открывая её второй белой линией поверх
    mask.setAttribute('d', path.getAttribute('d')); mask.setAttribute('fill', 'none'); mask.setAttribute('stroke', '#FFE4EF'); mask.setAttribute('stroke-width', 2.2 * u);
    mask.setAttribute('stroke-dasharray', `${len} ${len}`); mask.style.strokeDashoffset = 0;
    svg.append(mask);
    tl.to(mask, { strokeDashoffset: -len, duration: 0.8, ease: 'power1.inOut' }, 6 + i * BAR - 0.6);
  });
  const head = center(el('head', s)); at(head, W * 0.5, V ? H * 0.075 : H * 0.1, { rotation: -2 });
  typeText(head, 'Как росла королева', 6.3, 1.0);
  tl.from(head, { y: -20 * u, duration: 0.6, ease: 'back.out(2)' }, 6.1);

  GROW.forEach(([f, age, note], i) => {
    const t = 6 + i * BAR;
    const [x, y] = pts[i];
    const st = sticker(world, f, V ? W * 0.52 : W * 0.28, V ? H * 0.27 : H * 0.52, [i % 2 ? 't2' : 't1', 't3']);
    const rot = [-4, 3, -3, 4, -2, 3, -4, 2, -3][i];
    gsap.set(st, { x, y, rotation: rot, opacity: 0 });
    ft(st, { opacity: 1, scale: 0.15, rotation: rot + (i % 2 ? 40 : -40), y: y - H * 0.25 }, { scale: 1, rotation: rot, y, duration: 0.75, ease: 'back.out(1.8)' }, t);
    sheen(st, t + 0.7);
    const pill = center(el('pill', world)); pill.textContent = age;
    at(pill, x + (i % 2 ? -1 : 1) * st.w * 0.18, y + st.h / 2 + 3 * u, { rotation: i % 2 ? 4 : -4 });
    tl.from(pill, { scale: 0, duration: 0.45, ease: 'back.out(3)' }, t + 0.35);
    const n = center(el('abs hand', world)); n.style.cssText += `font-size:${5.2 * u}px;color:#5B1A4A;white-space:nowrap`;
    at(n, x, y + st.h / 2 + 10 * u);
    typeText(n, note, t + 0.6, 0.7);
    tl.to(world, V ? { y: -(y - H * 0.5), duration: 0.7, ease: 'power2.inOut' } : { x: -(x - W * 0.5), duration: 0.7, ease: 'power2.inOut' }, Math.max(6, t - 0.2));
  });

  // «А теперь мне 7!» — на 13-м такте (19.5 с) удар тарелки
  const T7 = 19.5;
  tl.to(world, { scale: 0.6, opacity: 0, duration: 0.5, ease: 'power2.in' }, T7 - 0.4);
  tl.to(head, { opacity: 0, duration: 0.3 }, T7 - 0.4);
  const seven = center(el('abs', s, doodle.seven()));
  const sz = V ? W * 0.42 : H * 0.42;
  seven.style.width = sz + 'px';
  at(seven, W * 0.5, H * (V ? 0.47 : 0.47), { scale: 0, rotation: -30 });
  tl.to(seven, { scale: 1, rotation: -6, duration: 0.8, ease: 'elastic.out(1, 0.45)' }, T7);
  tl.to(seven, { scale: 1.08, duration: BEAT, yoyo: true, repeat: 7, ease: 'sine.inOut' }, T7 + 0.8);
  burst(s, T7, W * 0.5, H * 0.47, 60, 1.4);
  const t7 = center(el('abs oi sticker-text', s)); t7.style.cssText += `font-size:${V ? 6.6 * u : 7.5 * u}px;white-space:nowrap`;
  t7.textContent = 'А теперь мне 7!';
  at(t7, W * 0.5, V ? H * 0.12 : H * 0.12);
  tl.from(t7, { scale: 0, rotation: 10, duration: 0.6, ease: 'back.out(2.5)' }, T7 + 0.2);
  const now = ['more/13-orange-tee-smile.jpg', 'more/23-bandana.jpg', 'more/24-peace-closeup.jpg', 'more/25-hanging-smile.jpg', 'more/26-car-selfie.jpg'];
  const spots = V ? [[0.24, 0.3], [0.76, 0.32], [0.22, 0.7], [0.78, 0.68], [0.5, 0.86]] : [[0.14, 0.38], [0.86, 0.38], [0.24, 0.77], [0.76, 0.77], [0.5, 0.86]];
  now.forEach((f, k) => {
    const st = sticker(s, f, V ? W * 0.34 : W * 0.2, V ? H * (k === 4 ? 0.16 : 0.2) : H * (k === 4 ? 0.22 : 0.36), ['t1']);
    const rot = [-8, 7, 6, -7, 3][k];
    gsap.set(st, { x: W * 0.5, y: H * 0.47, scale: 0, rotation: rot * 4 });
    tl.to(st, { x: W * spots[k][0], y: H * spots[k][1], scale: 1, rotation: rot, duration: 0.7, ease: 'back.out(1.6)' }, T7 + 0.6 + k * BEAT);
  });
}

/* ---------- 3. Смешные моменты 24–36 ---------- */
function s3() {
  const s = scene(24, 36.4);
  const bg = el('layer', s); bg.style.background = 'radial-gradient(circle, rgba(61,219,176,.22) 0 9px, transparent 10px) 0 0 / 70px 70px';
  const head = center(el('head', s)); at(head, W * 0.5, V ? H * 0.075 : H * 0.1, { rotation: 2 });
  typeText(head, 'Самые смешные моменты', 24.2, 1.0);
  tl.from(head, { scale: 0, duration: 0.5, ease: 'back.out(2)' }, 24.0);
  const FUN = [
    ['more/17-crying-over-book.jpg', 'Эта книжка слишком грустная!', 'tears'],
    ['more/12-sleepy-pout.jpg', 'Не будите королеву…', 'zzz'],
    ['more/22-cap-kiss-mountains.jpg', 'Чмок горам!', 'hearts'],
    ['more/21-bob-hair-selfie.jpg', 'Новая причёска. Нравится?', 'sparkles']
  ];
  FUN.forEach(([f, cap, deco], i) => {
    const t = 24 + i * 2 * BAR;
    const c = V ? [W * 0.5, H * 0.47] : [W * 0.36, H * 0.55];
    const st = sticker(s, f, V ? W * 0.74 : W * 0.4, V ? H * 0.56 : H * 0.74, ['t2', 't3']);
    const rot = [-4, 3, -3, 4][i];
    gsap.set(st, { x: c[0], y: -H, rotation: rot - 25, opacity: 1 });
    tl.to(st, { y: c[1], rotation: rot, duration: 0.45, ease: 'power2.in' }, t - 0.45);
    tl.to(st, { keyframes: [{ scaleY: 0.82, scaleX: 1.12, duration: 0.09 }, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1.4,0.3)' }] }, t);
    sheen(st, t + 0.8);
    if (i < 3) tl.to(st, { x: c[0] + (i % 2 ? -1 : 1) * W * 1.1, rotation: rot + (i % 2 ? -40 : 40), duration: 0.4, ease: 'power2.in' }, t + 2 * BAR - 0.45);
    else tl.to(st, { scale: 0.4, opacity: 0, duration: 0.4 }, 36);
    const pill = center(el('pill pink', s));
    pill.style.fontSize = 7 * u + 'px';
    if (!V) { pill.style.whiteSpace = 'normal'; pill.style.width = W * 0.3 + 'px'; pill.style.textAlign = 'center'; pill.style.borderRadius = 4 * u + 'px'; pill.style.lineHeight = '1.05'; }
    at(pill, V ? W * 0.5 : W * 0.77, V ? H * 0.85 : H * 0.55, { rotation: i % 2 ? 3 : -3, opacity: 0 });
    tl.set(pill, { opacity: 1 }, t + 0.25);
    tl.from(pill, { scale: 0, duration: 0.4, ease: 'back.out(3)' }, t + 0.25);
    typeText(pill, cap, t + 0.35, 0.9);
    tl.to(pill, { opacity: 0, duration: 0.25 }, t + 2 * BAR - 0.3);
    // украшения
    const dx = c[0] + st.w * 0.42, dy = c[1] - st.h * 0.38;
    for (let k = 0; k < 4; k++) {
      let d;
      if (deco === 'tears') { d = el('abs', s, `<svg viewBox="0 0 40 60" class="doodle"><path d="M20 4 C30 22 36 32 36 42 C36 52 28 58 20 58 C12 58 4 52 4 42 C4 32 10 22 20 4Z" fill="#69A8E8" stroke="#5B1A4A" stroke-width="4"/></svg>`); d.style.width = 4 * u + 'px'; }
      else if (deco === 'zzz') { d = el('abs hand', s); d.textContent = 'z'; d.style.cssText += `font-size:${(8 + k * 3) * u}px;color:#C2185B;`; }
      else if (deco === 'hearts') { d = el('abs', s, doodle.heart({ fill: k % 2 ? '#FF5FA2' : '#FFC93C' })); d.style.width = 7 * u + 'px'; }
      else { d = el('abs', s, doodle.sparkle({ fill: ['#FFC93C', '#3DDBB0', '#FF5FA2', '#fff'][k] })); d.style.width = 7 * u + 'px'; }
      center(d);
      const x0 = deco === 'tears' ? c[0] - st.w * 0.12 + k * 3 * u : dx + R(-8, 8) * u;
      const y0 = deco === 'tears' ? c[1] - st.h * 0.05 : dy + k * 5 * u;
      gsap.set(d, { x: x0, y: y0, opacity: 0, scale: 0 });
      const tk = t + 0.6 + k * 0.45;
      if (deco === 'tears') ft(d, { opacity: 1, scale: 1, y: y0 }, { y: y0 + 16 * u, opacity: 0, duration: 0.9, ease: 'power1.in' }, tk);
      else if (deco === 'zzz') ft(d, { opacity: 1, scale: 0.6, x: dx, y: dy }, { x: dx + (k + 1) * 6 * u, y: dy - (k + 1) * 9 * u, scale: 1, opacity: 0, duration: 1.6, ease: 'sine.out' }, tk);
      else ft(d, { opacity: 1, scale: 0 }, { scale: 1.2, y: y0 - 12 * u, opacity: 0, rotation: R(-40, 40), duration: 1.4, ease: 'power1.out' }, tk);
    }
  });
}

/* ---------- 4. Звезда и модель 36–48 ---------- */
function s4() {
  const s = scene(36, 48.4);
  el('glam', s);
  for (let k = 0; k < 2; k++) {
    const cone = el('abs', s);
    cone.style.cssText += `width:${Math.max(W, H) * 0.9}px;height:${Math.max(W, H) * 1.4}px;background:linear-gradient(rgba(255,240,200,.28), transparent 80%);clip-path:polygon(48% 0,52% 0,100% 100%,0 100%);transform-origin:50% 0`;
    gsap.set(cone, { x: (k ? W * 0.85 : W * 0.15) - Math.max(W, H) * 0.45, y: -H * 0.05, rotation: k ? 25 : -25 });
    tl.to(cone, { rotation: k ? 5 : -5, duration: 3, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 36);
  }
  for (let k = 0; k < 16; k++) {
    const sp = center(el('abs', s, doodle.sparkle({ fill: k % 2 ? '#FFC93C' : '#fff' })));
    sp.style.width = R(2, 5) * u + 'px';
    gsap.set(sp, { x: R(0, W), y: R(0, H), opacity: 0 });
    tl.to(sp, { opacity: 1, scale: 1.3, duration: 0.5, yoyo: true, repeat: 11, ease: 'sine.inOut' }, 36 + R(0, 1));
  }
  const head = center(el('head', s)); head.style.background = '#FF5FA2'; head.style.color = '#fff';
  at(head, W * 0.5, V ? H * 0.07 : H * 0.09, { rotation: -2 });
  typeText(head, 'Звезда и модель', 36.2, 0.8);
  const MODEL = [['more/20-trench-coat-model.jpg', 'Модель года'], ['more/19-marble-stairs-sassy.jpg', 'Босс этой лестницы'], ['more/15-beach-night-peace.jpg', 'Звезда ночного пляжа'], ['more/27-mountains-red-bag.jpg', 'Путешественница']];
  const flash = el('flash', s);
  MODEL.forEach(([f, cap], i) => {
    const t = 36 + i * 2 * BAR;
    const [w, h] = fit(f, V ? W * 0.8 : W * 0.36, V ? H * 0.72 : H * 0.8);
    const cv = el('cover', s);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    cv.innerHTML = `<img src="${P(f)}"><div class="mast">Еркем</div><div class="cap"></div>`;
    center(cv);
    cv.querySelector('.mast').style.fontSize = (w / 7.6) + 'px';
    const cx = V ? W * 0.5 : W * (i % 2 ? 0.62 : 0.38), cy = V ? H * 0.54 : H * 0.55;
    gsap.set(cv, { x: cx, y: cy, rotation: i % 2 ? 3 : -3, opacity: 0 });
    ft(cv, { opacity: 1, scale: 1.25 }, { scale: 1, duration: 0.35, ease: 'power3.out' }, t);
    tl.to(cv, { scale: 1.05, duration: 2 * BAR - 0.4, ease: 'none' }, t + 0.35);
    tl.set(cv, { opacity: 0 }, t + 2 * BAR);
    typeText(cv.querySelector('.cap'), cap, t + 0.3, 0.7);
    if (!V) {
      const side = center(el('abs hand', s)); side.style.cssText += `font-size:${9 * u}px;color:#FFC93C;white-space:nowrap`;
      at(side, i % 2 ? W * 0.22 : W * 0.78, H * 0.55, { rotation: -6, opacity: 0 });
      side.textContent = ['Вау!', 'Ого!', 'Звезда!', 'Супер!'][i];
      ft(side, { opacity: 1, scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, t + 0.5);
      tl.set(side, { opacity: 0 }, t + 2 * BAR);
    }
  });
  // вспышки: на 1-й и 3-й доле каждого такта (как щелчки в музыке)
  for (let b = 24; b < 32; b++) {
    for (const beat of [0, 2]) {
      const t = b * BAR + beat * BEAT + 0.02;
      ft(flash, { opacity: 0.8 }, { opacity: 0, duration: 0.3, ease: 'power2.out' }, t);
      for (let k = 0; k < 2; k++) {
        const bu = el('burst', s);
        gsap.set(bu, { x: R(0.05, 0.85) * W, y: R(0.12, 0.85) * H, scale: 0 });
        ft(bu, { opacity: 1, scale: 0.2 }, { scale: R(1, 1.8), opacity: 0, rotation: 45, duration: 0.4, ease: 'power2.out' }, t);
      }
    }
  }
}

/* ---------- 5. С семьёй 48–60 ---------- */
function s5() {
  const s = scene(48, 60.4);
  const bg = el('layer', s); bg.style.background = 'radial-gradient(circle at 50% 40%, #FFF3F8, #FFD1E3)';
  const head = center(el('head', s)); at(head, W * 0.5, V ? H * 0.07 : H * 0.09, { rotation: -2 });
  typeText(head, 'С самыми любимыми', 48.2, 1.0);
  const FAM = [['more/18-selfie-with-mom.jpg', 'С мамой'], ['more/10-mall-with-mom.jpg', 'Прогулка с мамой'], ['more/11-with-sister-selfie.jpg', 'С сестрой'], ['more/14-beach-night-with-brother.jpg', 'Брат держит крепко']];
  const spots = V ? [[0.31, 0.3], [0.69, 0.42], [0.32, 0.64], [0.68, 0.77]] : [[0.18, 0.5], [0.4, 0.6], [0.61, 0.47], [0.82, 0.59]];
  const world = el('layer', s);
  FAM.forEach(([f, cap], i) => {
    const t = 48 + i * 2 * BAR;
    const [w, h] = fit(f, V ? W * 0.5 : W * 0.2, V ? H * 0.27 : H * 0.5);
    const p = el('polaroid', world);
    p.innerHTML = `<div style="width:${w}px;height:${h}px"><img src="${P(f)}"></div><div class="pc">${cap}</div><span class="tape t1"></span>`;
    center(p);
    const rot = [-6, 5, -4, 6][i];
    const [x, y] = [W * spots[i][0], H * spots[i][1]];
    gsap.set(p, { x: x + (i % 2 ? 1 : -1) * W * 0.3, y: -H * 0.5, rotation: rot * 5, opacity: 1 });
    tl.to(p, { x, y, rotation: rot, duration: 0.9, ease: 'power3.out' }, t - 0.2);
    ft(p, { scale: 1.2 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' }, t + 0.5);
    for (let k = 0; k < 5; k++) {
      const hh = center(el('abs', world, doodle.heart({ fill: ['#FF5FA2', '#FFC93C', '#C2185B', '#FF9CC6', '#3DDBB0'][k] })));
      hh.style.width = R(4, 7) * u + 'px';
      gsap.set(hh, { x: x + R(-12, 12) * u, y, opacity: 0, scale: 0 });
      tl.to(hh, { keyframes: [{ opacity: 1, scale: 1, duration: 0.2 }, { y: y - R(25, 40) * u, x: `+=${R(-10, 10) * u}`, opacity: 0, rotation: R(-30, 30), duration: 1.6, ease: 'sine.out' }] }, t + 0.6 + k * 0.15);
    }
  });
  tl.to(world, { scale: V ? 0.94 : 0.95, duration: 2, ease: 'sine.inOut' }, 58);
}

/* ---------- 6. Красная дорожка и финал 60–76 ---------- */
function s6() {
  const s = scene(60, DUR);
  const bg = el('layer', s); bg.style.background = 'linear-gradient(#FFE4EF, #FFF6E0)';
  const cw = V ? W * 0.56 : W * 0.3, ch = V ? H * 0.8 : H * 0.85;
  const carpet = el('carpet', s);
  carpet.style.width = cw + 'px'; carpet.style.height = ch + 'px';
  gsap.set(carpet, { x: W / 2 - cw / 2, y: H - ch, transformOrigin: '50% 100%', scaleY: 0 });
  tl.to(carpet, { scaleY: 1, duration: 1.0, ease: 'power2.out' }, 60.0);
  for (let k = 0; k < 4; k++) {
    const post = el('abs', s, `<svg viewBox="0 0 40 140" class="doodle"><rect x="12" y="20" width="16" height="110" rx="6" fill="#FFC93C" stroke="#5B1A4A" stroke-width="4"/><circle cx="20" cy="16" r="12" fill="#FFC93C" stroke="#5B1A4A" stroke-width="4"/><rect x="4" y="126" width="32" height="10" rx="4" fill="#E8A200" stroke="#5B1A4A" stroke-width="4"/></svg>`);
    post.style.width = 6 * u + 'px';
    const side = k % 2 ? 1 : -1, row = Math.floor(k / 2);
    gsap.set(post, { x: W / 2 + side * (cw / 2 + 6 * u) - 3 * u, y: H - ch * (0.32 + row * 0.42), opacity: 0 });
    ft(post, { opacity: 1, y: H }, { y: H - ch * (0.32 + row * 0.42), duration: 0.6, ease: 'back.out(1.6)' }, 60.6 + k * 0.12);
  }
  const pc = V ? [W * 0.5, H * 0.43] : [W * 0.5, H * 0.47];
  const st = sticker(s, 'more/16-red-carpet-white-dress.jpg', V ? W * 0.68 : W * 0.34, V ? H * 0.56 : H * 0.72, ['t2', 't3']);
  gsap.set(st, { x: pc[0], y: pc[1], scale: 0, rotation: -3 });
  tl.to(st, { scale: 0.92, duration: 0.9, ease: 'back.out(1.5)' }, 60.4);
  tl.to(st, { scale: 1.02, duration: 6, ease: 'none' }, 61.3);
  crownOn(s, st, pc[0], pc[1] - st.h * 0.46, 61.5, 0.42);
  burst(s, 61.5, pc[0], pc[1] - st.h * 0.46, 40, 1.2, ['#FFC93C', '#FFE07A', '#fff']);
  sheen(st, 62);
  rain(s, 61, 67.6, 70);
  const cap = center(el('head', s)); cap.style.fontSize = (V ? 7.4 : 6.6) * u + 'px';
  at(cap, W * 0.5, V ? H * 0.86 : H * 0.91, { rotation: -2, opacity: 0 });
  tl.set(cap, { opacity: 1 }, 62.2);
  tl.from(cap, { scale: 0, duration: 0.4, ease: 'back.out(2)' }, 62.2);
  typeText(cap, 'Королева идёт по красной дорожке', 62.3, 1.6);

  // признание
  const love = el('layer', s); love.style.background = 'radial-gradient(circle at 50% 45%, #FFD1E3, #FF9CC6 85%)'; love.style.opacity = 0;
  tl.to(love, { opacity: 1, duration: 0.5 }, 67.2);
  const bigHeart = center(el('abs', love, doodle.heart()));
  const hs = V ? W * 0.9 : H * 0.9;
  bigHeart.style.width = hs + 'px'; bigHeart.style.opacity = 0.25;
  at(bigHeart, W * 0.5, H * 0.5, { scale: 0 });
  tl.to(bigHeart, { scale: 1, duration: 0.8, ease: 'back.out(1.6)' }, 67.4);
  tl.to(bigHeart, { scale: 1.07, duration: BEAT, yoyo: true, repeat: 15, ease: 'sine.inOut' }, 68.2);
  const pic = sticker(love, '08-selfie.jpg', V ? W * 0.44 : W * 0.22, V ? H * 0.25 : H * 0.56, ['t1']);
  const picPos = V ? [W * 0.5, H * 0.24] : [W * 0.24, H * 0.5];
  gsap.set(pic, { x: picPos[0], y: picPos[1], scale: 0, rotation: 6 });
  tl.to(pic, { scale: 1, rotation: -4, duration: 0.8, ease: 'back.out(1.8)' }, 67.6);
  const tx = V ? W * 0.5 : W * 0.63;
  const lines = V ? ['Я люблю', 'тебя,', 'Еркем!'] : ['Я люблю тебя,', 'Еркем!'];
  lines.forEach((ln, k) => {
    const e = center(el('abs oi sticker-text', love));
    e.style.cssText += `font-size:${V ? 10 * u : 8 * u}px;white-space:nowrap`;
    e.innerHTML = ln.split(' ').map((w) => `<span style="display:inline-block">${w}</span>`).join(' ');
    at(e, tx, V ? H * (0.47 + k * 0.085) : H * (0.24 + k * 0.17));
    tl.from(e.children, { scale: 0, rotation: () => R(-25, 25), duration: 0.6, ease: 'back.out(2.6)', stagger: 0.15 }, 68.0 + k * 0.5);
  });
  const kz = center(el('abs hand', love)); kz.style.cssText += `font-size:${V ? 10 * u : 8.6 * u}px;color:#fff;white-space:nowrap;text-shadow:0 ${0.6 * u}px 0 #C2185B`;
  at(kz, tx, V ? H * 0.76 : H * 0.6, { rotation: -3 });
  typeText(kz, 'Сені жақсы көремін!', 69.6, 1.2);
  const sign = center(el('abs hand', love)); sign.style.cssText += `font-size:${V ? 9 * u : 8 * u}px;color:#5B1A4A;white-space:nowrap`;
  at(sign, tx, V ? H * 0.86 : H * 0.76, { rotation: -2 });
  typeText(sign, 'Твой брат Ералы', 71.0, 1.0);
  burst(love, 72, W * 0.5, H * 0.5, 80, 1.6);
  for (let k = 0; k < 10; k++) {
    const hh = center(el('abs', love, doodle.heart({ fill: ['#FF5FA2', '#FFC93C', '#C2185B', '#fff', '#3DDBB0'][k % 5] })));
    hh.style.width = R(5, 10) * u + 'px';
    gsap.set(hh, { x: R(0.05, 0.95) * W, y: H + 10 * u });
    tl.to(hh, { y: -15 * u, rotation: R(-40, 40), duration: R(2.5, 4), ease: 'none' }, 72 + k * 0.2);
  }
}

async function build() {
  const all = ['00-queen.jpg', ...GROW.map((g) => g[0]), 'more/13-orange-tee-smile.jpg', 'more/23-bandana.jpg', 'more/24-peace-closeup.jpg', 'more/25-hanging-smile.jpg', 'more/26-car-selfie.jpg',
    'more/17-crying-over-book.jpg', 'more/12-sleepy-pout.jpg', 'more/22-cap-kiss-mountains.jpg', 'more/21-bob-hair-selfie.jpg',
    'more/20-trench-coat-model.jpg', 'more/19-marble-stairs-sassy.jpg', 'more/15-beach-night-peace.jpg', 'more/27-mountains-red-bag.jpg',
    'more/18-selfie-with-mom.jpg', 'more/10-mall-with-mom.jpg', 'more/11-with-sister-selfie.jpg', 'more/14-beach-night-with-brother.jpg', 'more/16-red-carpet-white-dress.jpg'];
  await loadAll([...new Set(all)]);
  await document.fonts.load(`700 40px Caveat`); await document.fonts.load(`400 40px Oi`); await document.fonts.load(`900 40px Nunito`);
  await document.fonts.ready;
  stage.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute"><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter></svg>');
  ambience();
  s1(); s2(); s3(); s4(); s5(); s6();
  [6, 24, 36, 48, 60].forEach(wipe);
  tl.seek(0);
  window.__duration = DUR;
  window.__seek = (t) => { tl.seek(t, false); };
  window.__ready = true;
}
build();
