// Дворец королевы Еркем: маршрутизатор комнат.
import { store } from './core/store.js';
import { loadAll } from './core/data.js';
import { unlock, sfx, music, isMuted, setMuted, onMute } from './core/audio.js';
import { stopSpeaking } from './core/speech.js';
import { h, btn, sayBtn, hint, gsap, reduced, flyStars, winScreen, overlay } from './core/ui.js';
import { doodle } from './core/doodles.js';

export const ROOMS = [
  { id: 'rain', title: 'Дождь сюрпризов', photo: '24-peace', wing: 'main', color: '#FFC93C', shape: 'gate',
    intro: 'Лови подарки золотой короной! Двигай корону пальцем. В каждом подарке сюрприз: приз или весёлое задание. Тучки лучше не ловить!' },
  { id: 'candles', title: 'Задуй свечи', photo: '13-orange', wing: 'erkem', color: '#FF5FA2', shape: 'arch',
    intro: 'Подуй на телефон, и свечи погаснут! Если не получается, нажми на свечку пальчиком.' },
  { id: 'wheel', title: 'Колесо фортуны', photo: '19-marble', wing: 'erkem', color: '#3DDBB0', shape: 'round',
    intro: 'Крути колесо! Где оно остановится, такой и сюрприз.' },
  { id: 'memory', title: 'Найди пару', photo: '21-bob', wing: 'erkem', color: '#C2185B', shape: 'pointed',
    intro: 'Открывай карточки и ищи две одинаковые фотографии.' },
  { id: 'puzzle', title: 'Пазл', photo: '06-apple', wing: 'erkem', color: '#FFC93C', shape: 'arch',
    intro: 'Выбери фото. Перетаскивай кусочки на свои места. Они сами прилипнут!' },
  { id: 'balloons', title: 'Лопни шарики', photo: '25-hanging', wing: 'erkem', color: '#FF5FA2', shape: 'round',
    intro: 'Лопай шарики по порядку: один, два, три, и так до семи!' },
  { id: 'dressup', title: 'Наряди королеву', photo: '20-trench', wing: 'erkem', color: '#3DDBB0', shape: 'pointed',
    intro: 'Выбери фото и укрась его: короны, очки, бантики. Потом сохрани картинку!' },
  { id: 'photobooth', title: 'Фотобудка', photo: '26-car', wing: 'erkem', color: '#C2185B', shape: 'arch',
    intro: 'Включи камеру, и на тебе появится корона! Нажми на кнопку, считаем три, два, один, и фото готово.' },
  { id: 'age', title: 'Сколько мне тут лет?', photo: '01-newborn', wing: 'erkem', color: '#FFC93C', shape: 'round',
    intro: 'Посмотри на фото и угадай, сколько тут Еркем лет.' },
  { id: 'rhythm', title: 'Ритм-сердечки', photo: '15-beach', wing: 'erkem', color: '#FF5FA2', shape: 'pointed',
    intro: 'Сердечки падают под музыку. Нажимай на кружок, когда сердечко в него попадает!' },
  { id: 'freeze', title: 'Замри!', photo: '22-cap', wing: 'family', color: '#3DDBB0', shape: 'arch',
    intro: 'Танцуйте, пока играет музыка! Когда музыка остановится, все замирают. Кто пошевелился, выбывает.' },
  { id: 'moves', title: 'Повтори движение', photo: '27-mountains', wing: 'family', color: '#C2185B', shape: 'round',
    intro: 'Повторяйте движение за человечком. Еркем — судья, она ставит короны!' },
  { id: 'crocodile', title: 'Крокодил', photo: '17-crying', wing: 'family', color: '#FFC93C', shape: 'pointed',
    intro: 'Покажи слово без слов! Твоя команда угадывает. Кто угадал больше, тот победил.' },
  { id: 'quiz', title: 'Кто знает Еркем?', photo: '04-family', wing: 'family', color: '#FF5FA2', shape: 'arch',
    intro: 'Кто лучше всех знает Еркем? Все отвечают на вопросы, а Еркем проверяет.' },
  { id: 'potato', title: 'Горячая картошка', photo: '12-sleepy', wing: 'family', color: '#3DDBB0', shape: 'round',
    intro: 'Передавайте телефон по кругу, пока играет музыка. У кого бахнет, тот выполняет задание!' },
  { id: 'challenges', title: 'Челленджи', photo: '11-with-sister', wing: 'family', color: '#C2185B', shape: 'pointed',
    intro: 'Открывай коробку с челленджем! Кто победит?' },
  { id: 'truth', title: 'Правда или задание', photo: '18-selfie', wing: 'family', color: '#FFC93C', shape: 'arch',
    intro: 'Крути корону: на кого она покажет, тот выбирает правду или задание.' }
];

export const SPECIAL = {
  treasury: { title: 'Королевская казна', photo: '00-queen' },
  album: { title: 'Как росла королева', photo: '05-mountains' },
  secret: { title: 'Секретная комната', photo: '14-beach-night' },
  final: { title: 'Письмо для Еркем', photo: '16-red' }
};

let DATA = null;
let cleanup = null;
const app = document.getElementById('app');

/* ---------- кнопка звука ---------- */
const soundBtn = document.getElementById('sound-toggle');
const paintSound = (m) => { soundBtn.classList.toggle('is-muted', m); soundBtn.setAttribute('aria-pressed', String(!m)); soundBtn.setAttribute('aria-label', m ? 'Включить звук' : 'Выключить звук'); };
paintSound(isMuted());
onMute(paintSound);
soundBtn.addEventListener('click', () => { unlock(); setMuted(!isMuted()); if (isMuted()) stopSpeaking(); else sfx.ding(); });
// Первое нажатие где угодно «будит» звук — раньше браузер не даст играть.
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { once: true, capture: true }));

/* ---------- переход «дверь открывается» ---------- */
const light = document.getElementById('door-light');
export async function openDoor(doorEl, hash) {
  sfx.door();
  const g = gsap();
  if (!g || reduced() || !doorEl) { location.hash = hash; return; }
  const leaves = [...doorEl.querySelectorAll('.door-leaf')];
  const r =(doorEl.querySelector('.door-frame') || doorEl).getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
  light.style.setProperty('--cx', cx + 'px');
  light.style.setProperty('--cy', cy + 'px');
  await g.timeline()
    .to(leaves, { rotationY: (i, el) => (el.classList.contains('r') ? 112 : -112), duration: 0.55, ease: 'power2.inOut' })
    .fromTo(light, { '--rad': '0px', opacity: 1, visibility: 'visible' }, { '--rad': radius + 'px', duration: 0.5, ease: 'power2.in' }, '-=0.15')
    .then();
  location.hash = hash;
}
function lightOut() {
  const g = gsap();
  if (!g || light.style.visibility !== 'visible') return;
  g.to(light, { opacity: 0, duration: 0.45, delay: 0.1, onComplete: () => { light.style.visibility = 'hidden'; } });
}

/* ---------- шапка комнаты ---------- */
export function starMeter(compact = false) {
  const total = store.totalStars();
  const el = h(`div.star-meter${compact ? '.star-meter--compact' : ''}`, { 'aria-label': `Звёзд: ${total} из 7` });
  if (compact) {
    el.append(h('span.sm-star', { html: doodle.star() }), h('span.sm-num', {}, `${total}`));
  } else {
    for (let i = 0; i < 7; i++) el.append(h(`span.sm-slot${i < total ? '.on' : ''}`, { html: doodle.star({ fill: i < total ? '#FFC93C' : '#FBE3EE', shine: i < total }) }));
    if (total > 7) el.append(h('span.sm-extra', {}, `+${total - 7}`));
  }
  const off = store.onChange(() => { off(); if (el.isConnected) el.replaceWith(starMeter(compact)); });
  return el;
}

function roomHeader(title, introText) {
  const head = h('header.room-head');
  head.append(
    btn({ icon: castleIcon(), text: 'Во дворец', variant: 'ghost', cls: 'back-btn', onClick: () => goHall() }),
    h('h1.room-title', {}, title),
    starMeter(true)
  );
  const wrap = h('div.room-top', {}, head);
  if (introText) wrap.append(hint(introText, { cls: 'room-hint' }));
  return wrap;
}
const castleIcon = () => `<svg viewBox="0 0 48 48"><path d="M8 42 V18 l5 -5 l5 5 v6 h4 v-8 l2-6 l2 6 v8 h4 v-6 l5-5 l5 5 v24 z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="3" stroke-linejoin="round"/><path d="M20 42 v-8 a4 4 0 0 1 8 0 v8" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="3"/></svg>`;

export function goHall() { location.hash = '#/hall'; }

/* ---------- маршруты ---------- */
async function render() {
  const hash = location.hash || '';
  if (cleanup) { try { cleanup(); } catch (e) { console.warn(e); } cleanup = null; }
  music.stop(); stopSpeaking();
  document.querySelectorAll('.overlay').forEach((o) => o.remove());
  app.innerHTML = '';
  app.className = '';
  window.scrollTo(0, 0);

  const [, route, arg] = hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/) || [];
  try {
    if (!route) {
      const m = await import('./rooms/intro.js');
      cleanup = m.mount(app, ctxBase());
    } else if (route === 'hall') {
      const m = await import('./rooms/hall.js');
      cleanup = m.mount(app, ctxBase());
    } else if (route === 'room' && ROOMS.some((r) => r.id === arg)) {
      await mountGame(ROOMS.find((r) => r.id === arg));
    } else if (SPECIAL[route]) {
      const m = await import(`./rooms/${route}.js`);
      app.className = `screen screen--${route}`;
      app.append(roomHeader(SPECIAL[route].title));
      const body = h('section.room-body');
      app.append(body);
      cleanup = m.mount(body, ctxBase());
    } else {
      goHall(); return;
    }
  } catch (e) {
    console.error(e);
    app.append(h('div.oops', {}, h('p', {}, 'Ой, эта дверь заела. Попробуй ещё раз!'), btn({ icon: '🏰', text: 'Во дворец', onClick: goHall })));
  }
  lightOut();
  app.focus?.({ preventScroll: true });
}

function ctxBase() {
  return { data: DATA, store, rooms: ROOMS, special: SPECIAL, openDoor, starMeter, goHall };
}

async function mountGame(room) {
  const mod = await import(`./games/${room.id}.js`);
  app.className = `screen screen--game game-${room.id}`;
  app.append(roomHeader(room.title, room.intro));
  const body = h('section.room-body.game-body');
  app.append(body);
  const cleanups = [];
  const ctx = {
    ...ctxBase(),
    room,
    root: body,
    onCleanup: (fn) => cleanups.push(fn),
    award(n) {
      const before = store.totalStars();
      const delta = store.awardStars(room.id, n);
      if (delta > 0) {
        flyStars(delta, body).then(() => {
          if (before < 7 && store.totalStars() >= 7) secretUnlocked();
        });
      }
      return delta;
    },
    win({ title, text, stars = 1, again, extra }) {
      ctx.award(stars);
      const buttons = [];
      if (again) buttons.push(btn({ icon: '🔁', text: 'Ещё раз', variant: 'mint', onClick: () => { ov.close(); again(); } }));
      buttons.push(btn({ icon: castleIcon(), text: 'Во дворец', variant: 'pink', onClick: () => { ov.close(); goHall(); } }));
      const ov = winScreen({ title, text, stars, buttons, extra });
      return ov;
    }
  };
  const ret = mod.default.mount(ctx);
  cleanup = () => { cleanups.forEach((f) => { try { f(); } catch (e) { console.warn(e); } }); if (typeof ret === 'function') ret(); };
}

function secretUnlocked() {
  const box = h('div.unlock', {},
    h('div.unlock-key', { html: doodle.key() }),
    h('h2', {}, 'Семь звёзд!'),
    h('p', {}, 'Секретная комната открыта. Там тебя ждёт письмо от брата.'),
    h('div.win-actions', {}, sayBtn('Семь звёзд! Секретная комната открыта. Там тебя ждёт письмо от брата.'),
      btn({ icon: '🗝️', text: 'Открыть', variant: 'gold', onClick: () => { ov.close(); location.hash = '#/secret'; } }))
  );
  const ov = overlay(box, { cls: 'overlay--win' });
  sfx.magic();
}

/* ---------- живой фон и искорки ---------- */
function ambient() {
  const box = document.querySelector('.ambient');
  if (!box || reduced()) return;
  const kinds = [() => doodle.heart(), () => doodle.sparkle(), () => doodle.star(), () => doodle.heart({ fill: '#FFC93C' }), () => doodle.sparkle({ fill: '#3DDBB0' }), () => doodle.heart({ fill: '#FF9CC6' })];
  const n = window.innerWidth > 1000 ? 16 : 10;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    const t = 16 + Math.random() * 18;
    s.style.cssText = `left:${(i / n) * 100 + Math.random() * 5}%;--s:${16 + Math.random() * 26}px;--o:${(0.25 + Math.random() * 0.4).toFixed(2)};--t:${t.toFixed(1)}s;--dl:${(-Math.random() * t).toFixed(1)}s;--x:${(Math.random() * 120 - 60).toFixed(0)}px`;
    s.innerHTML = kinds[i % kinds.length]();
    box.append(s);
  }
}
const SPARK_COLORS = ['#FFC93C', '#FF5FA2', '#3DDBB0', '#ffffff'];
window.addEventListener('pointerdown', (e) => {
  if (reduced() || e.pointerType === 'mouse' && e.button !== 0) return;
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.background = SPARK_COLORS[i % SPARK_COLORS.length];
    document.body.append(s);
    const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5, d = 26 + Math.random() * 34;
    const anim = s.animate([
      { transform: `translate(${e.clientX - 7}px, ${e.clientY - 7}px) scale(.4) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${e.clientX - 7 + Math.cos(a) * d}px, ${e.clientY - 7 + Math.sin(a) * d}px) scale(1.1) rotate(120deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${e.clientX - 7 + Math.cos(a) * d * 1.3}px, ${e.clientY + 6 + Math.sin(a) * d * 1.3}px) scale(0) rotate(200deg)`, opacity: 0 }
    ], { duration: 650, easing: 'cubic-bezier(.2,.8,.4,1)' });
    anim.onfinish = () => s.remove();
  }
}, { passive: true });

/** Мерцающие звёздочки возле заголовков. */
function twinkleTitles(root) {
  root.querySelectorAll('.room-title, .floor-name, .section-title').forEach((el, i) => {
    if (el.querySelector('.twinkle')) return;
    el.append(Object.assign(document.createElement('span'), { className: 'twinkle', style: `right:-14px;top:-8px;animation-delay:${-i * 0.7}s` }),
      Object.assign(document.createElement('span'), { className: 'twinkle t2', style: `left:-12px;bottom:-4px` }));
  });
}
new MutationObserver(() => twinkleTitles(app)).observe(app, { childList: true, subtree: true });

/* ---------- старт ---------- */
(async function start() {
  ambient();
  DATA = await loadAll();
  window.addEventListener('hashchange', render);
  render();
})();
