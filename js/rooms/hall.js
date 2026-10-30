// Тронный зал — панель королевы: профиль, прогресс, главная игра, вкладки игр, сокровищница.
import { h, sayBtn, gsap, reduced } from '../core/ui.js';
import { doodle, nightScene } from '../core/doodles.js';
import { photoByName } from '../core/data.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

const JEWELS = ['#8C5BFF', '#4F8DFF', '#2FC49C', '#E94C8F', '#FFB020', '#22C3D6'];
const ICONS = { candles: '🎂', wheel: '🎡', memory: '🃏', puzzle: '🧩', balloons: '🎈', dressup: '👗', photobooth: '📸', age: '🍼', rhythm: '💗',
  piano: '🎹', cups: '🥤', whack: '🌟', draw: '🖍️', freeze: '🧊', moves: '💃', crocodile: '🐊', quiz: '❓', potato: '🥔', challenges: '🎁', truth: '💬' };
let lastTab = 'all';

export function mount(app, { data, store, rooms, special, openDoor }) {
  app.className = 'screen screen--home';
  const total = store.totalStars();
  const coupons = store.state.coupons.filter((c) => !c.used).length;
  const queen = photoByName(data, '00-queen');

  /* профиль */
  const avatar = h('div.avatar', {}, h('img', { src: queen.thumb, alt: 'Еркем' }), h('span.avatar-crown', { html: doodle.crown() }), h('span.avatar-ring'));
  const slots = h('div.prog-stars');
  for (let i = 0; i < 7; i++) slots.append(h(`span${i < total ? '.on' : ''}`, { html: doodle.star({ fill: i < total ? '#FFC93C' : 'rgba(255,255,255,.18)', shine: i < total }) }));
  const left = Math.max(0, 7 - total);
  const profile = h('section.profile', {},
    avatar,
    h('div.who', {},
      h('p.who-hi.hand', {}, 'Ваше Величество'),
      h('h1.who-name', {}, 'Еркем'),
      h('div.who-chips', {}, h('span.chip', {}, '7 лет'), h('span.chip.chip--gold', {}, `★ ${total}`), h('span.chip.chip--mint', {}, `Купонов: ${coupons}`))),
    h('div.prog', {}, slots, h('p.prog-txt', {}, left ? `Ещё ${left} ${left === 1 ? 'звезда' : left < 5 ? 'звезды' : 'звёзд'} — и откроется секретная комната` : 'Секретная комната открыта!')),
    sayBtn(() => left ? `Привет, Ваше Величество! Выбирай игру. Собери ещё ${left} звёзд, и откроется секретная комната.` : 'Привет, Ваше Величество! Секретная комната открыта!', { cls: 'profile-say' })
  );

  /* главная игра */
  const main = rooms.find((r) => r.wing === 'main');
  const heroRain = h('div.hero-rain', { 'aria-hidden': 'true' }, ...Array.from({ length: 9 }, (_, i) => h('span', { style: `--x:${(i * 11 + 4) % 96}%;--d:${(i * 0.37) % 2.6}s;--t:${2.6 + (i % 4) * 0.5}s`, html: [doodle.gift(), doodle.star(), doodle.heart(), doodle.candy(), doodle.crown()][i % 5] })));
  const hero = h('a.hero', { href: '#/room/rain', 'data-room': 'rain' },
    heroRain,
    h('div.hero-text', {},
      h('p.hero-kicker.hand', {}, 'Главная игра'),
      h('h2.hero-title', {}, main.title),
      h('p.hero-sub', {}, 'Лови подарки короной — внутри призы и весёлые задания'),
      h('span.hero-play', {}, h('span.hp-ico', {}, '▶'), 'Играть')),
    h('div.hero-photo', {}, h('div.door-frame.hero-door', {}, h('span.door-inside'), h('span.door-leaf.l', {}, h('img', { src: photoByName(data, main.photo).thumb, alt: '' })))),
    starsRow(store.starsFor('rain'))
  );
  hero.addEventListener('click', (e) => { e.preventDefault(); openDoor(hero, '#/room/rain'); });

  /* вкладки */
  const tabs = [['all', 'Все игры'], ['erkem', 'Для Еркем'], ['family', 'Всей семьёй']];
  const tabBar = h('div.tabs', { role: 'tablist' });
  const grid = h('div.tiles');
  const renderTiles = (tab) => {
    lastTab = tab;
    [...tabBar.children].forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    grid.innerHTML = '';
    const list = rooms.filter((r) => r.wing !== 'main' && (tab === 'all' || r.wing === tab));
    list.forEach((r, i) => grid.append(tile(r, i)));
    if (gsap() && !reduced()) gsap().from(grid.children, { y: 40, opacity: 0, scale: 0.9, rotation: (i) => (i % 2 ? 3 : -3), stagger: 0.035, duration: 0.5, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
  };
  tabs.forEach(([k, label]) => {
    const b = h('button.tab', { type: 'button', role: 'tab', 'data-tab': k }, label);
    b.addEventListener('click', () => { sfx.click(); renderTiles(k); });
    tabBar.append(b);
  });

  const tile = (r, i) => {
    const c = JEWELS[(rooms.indexOf(r) + 1) % JEWELS.length];
    const photo = photoByName(data, r.photo);
    const a = h('a.tile', { href: `#/room/${r.id}`, style: `--c:${c}` },
      h('div.tile-arch', {}, h('span.door-inside'), h('span.door-leaf.l', {}, h('img', { src: photo.thumb, alt: '', loading: 'lazy', decoding: 'async' }), h('span.tile-knob'))),
      h('div.tile-body', {},
        h('span.tile-ico', {}, ICONS[r.id] || '✨'),
        h('span.tile-name', {}, r.title),
        r.wing === 'family' ? h('span.tile-tag', {}, 'семья') : null,
        starsRow(store.starsFor(r.id))));
    a.addEventListener('click', (e) => { e.preventDefault(); openDoor(a, a.getAttribute('href')); });
    tilt(a);
    return a;
  };

  /* сокровищница */
  const locked = total < 7;
  const treasure = (href, title, sub, art, cls = '') => {
    const a = h(`a.treasure${cls}`, { href }, h('span.tr-art', { html: art }), h('span.tr-title', {}, title), h('span.tr-sub', {}, sub));
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (cls.includes('is-locked')) { sfx.boop(); speak(`Эта дверь закрыта. Нужно ещё ${7 - total} звёзд.`); if (gsap()) gsap().fromTo(a, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1.5,0.2)' }); return; }
      sfx.door(); location.hash = href;
    });
    tilt(a);
    return a;
  };
  const treasures = h('div.treasures', {},
    treasure('#/treasury', 'Казна', coupons ? `Купонов: ${coupons}` : 'Тут будут призы', chest()),
    treasure('#/album', 'Альбом', 'Как росла королева', doodle.book()),
    treasure('#/secret', 'Секрет', locked ? `Нужно 7 звёзд, есть ${total}` : 'Письмо и видео', locked ? doodle.lock() : doodle.key(), locked ? '.is-locked' : '.is-open'),
    treasure('#/final', 'Пожелания', '7 коробочек от брата', doodle.envelope())
  );

  app.insertAdjacentHTML('beforeend', nightScene());
  app.append(profile, hero,
    h('div.sec-head', {}, h('h2.sec-title', {}, 'Комнаты дворца'), tabBar), grid,
    h('div.sec-head', {}, h('h2.sec-title', {}, 'Сокровищница')), treasures,
    h('p.home-sign.hand', {}, 'Построил для тебя брат Ералы'));
  renderTiles(lastTab);

  if (gsap() && !reduced()) {
    const g = gsap();
    g.from(profile, { y: -30, opacity: 0, duration: 0.6, ease: 'power3.out' });
    g.from(avatar, { scale: 0, rotation: -40, duration: 0.8, ease: 'back.out(1.8)', delay: 0.1 });
    g.from(slots.children, { scale: 0, rotation: 180, stagger: 0.06, duration: 0.5, ease: 'back.out(2.4)', delay: 0.3 });
    g.from(hero, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.15 });
    g.from(treasures.children, { y: 30, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'back.out(1.6)', delay: 0.4, clearProps: 'transform,opacity' });
  }
  return () => {};
}

function starsRow(n) {
  const s = h('span.mini-stars', { 'aria-label': `${n} из 3 звёзд` });
  for (let k = 0; k < 3; k++) s.append(h(`span${k < n ? '.on' : ''}`, { html: doodle.star({ fill: k < n ? '#FFC93C' : 'rgba(255,255,255,.35)', w: 6, shine: false }) }));
  return s;
}

// Карточка чуть наклоняется за пальцем или мышкой
function tilt(el) {
  if (reduced()) return;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
    el.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -12}deg`);
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
}

function chest() {
  return `<svg class="doodle" viewBox="0 0 120 100" aria-hidden="true">
    <path d="M30 40 L18 10 M60 34 V2 M90 40 L102 10" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/>
    <path d="M14 50 H106 V90 Q106 94 102 94 H18 Q14 94 14 90Z" fill="#8C5BFF" stroke="#2A1340" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M14 50 C14 24 106 24 106 50Z" fill="#A47BFF" stroke="#2A1340" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M30 32 V94 M90 32 V94" stroke="#FFC93C" stroke-width="7"/>
    <rect x="50" y="46" width="20" height="22" rx="4" fill="#FFC93C" stroke="#2A1340" stroke-width="4"/><circle cx="60" cy="56" r="3" fill="#2A1340"/></svg>`;
}
