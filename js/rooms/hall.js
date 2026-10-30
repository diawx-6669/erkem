// Тронный зал: дворец в разрезе, как кукольный домик. Каждая дверь — комната-игра.
import { h, sayBtn, gsap, reduced } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { photoByName } from '../core/data.js';
import { sfx } from '../core/audio.js';

const tilt = (i) => [-2.5, 1.8, -1.2, 2.4, -0.6, 1.2, -2, 0.8][i % 8];

export function mount(app, { data, store, rooms, special, openDoor, starMeter }) {
  app.className = 'screen screen--hall';
  const total = store.totalStars();

  const palace = h('div.palace');
  palace.append(roof());

  const plaque = h('div.plaque', {},
    h('p.plaque-hi.hand', {}, 'Привет, Ваше Величество!'),
    starMeter(false),
    h('p.plaque-note', {}, total >= 7 ? 'Секретная комната открыта!' : `Собери 7 звёзд — откроется секретная комната`),
    sayBtn(() => total >= 7 ? 'Привет, Ваше Величество! Семь звёзд собраны, секретная комната открыта!' : `Привет, Ваше Величество! Выбирай дверь и играй. За игры дают звёзды. Собери семь звёзд, и откроется секретная комната. У тебя ${total}.`, { cls: 'plaque-say' })
  );
  palace.append(plaque);

  const door = (room, i, extra = {}) => {
    const photo = photoByName(data, room.photo);
    const shape = extra.shape || room.shape;
    const a = h(`a.door.door--${shape}`, { href: extra.href || `#/room/${room.id}`, style: `--c:${room.color || '#FF5FA2'};--rot:${tilt(i)}deg`, 'data-room': room.id || extra.key });
    const frame = h('span.door-frame');
    const inside = h('span.door-inside');
    const leaves = shape === 'gate' ? ['l', 'r'] : ['l'];
    frame.append(inside);
    leaves.forEach((side, k) => {
      const leaf = h(`span.door-leaf.${side}`);
      if (k === 0) {
        const st = h('span.door-photo', { style: `--rot:${tilt(i + 3) * 1.6}deg` }, h('img', { src: photo.thumb, alt: '', loading: 'lazy', decoding: 'async' }), h('span.tape.tape--top'));
        leaf.append(st);
      }
      if (shape === 'gate' && k === 1) leaf.append(h('span.gate-crest', { html: doodle.crown() }));
      leaf.append(h('span.door-knob'));
      frame.append(leaf);
    });
    if (extra.badge) frame.append(extra.badge);
    a.append(frame);
    const stars = store.starsFor(room.id);
    const plate = h('span.door-plate', {}, h('span.door-name', {}, extra.title || room.title));
    if (!extra.noStars) {
      const s = h('span.door-stars', { 'aria-label': `${stars} из 3 звёзд` });
      for (let k = 0; k < 3; k++) s.append(h(`span${k < stars ? '.on' : ''}`, { html: doodle.star({ fill: k < stars ? '#FFC93C' : '#ffffff', w: 7, shine: false }) }));
      plate.append(s);
    }
    a.append(plate);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (extra.locked) {
        sfx.boop();
        if (gsap() && !reduced()) gsap().fromTo(a, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.5,0.2)' });
        extra.onLocked && extra.onLocked();
        return;
      }
      openDoor(a, a.getAttribute('href'));
    });
    return a;
  };

  // Главный зал: большие золотые ворота
  const main = rooms.find((r) => r.wing === 'main');
  const f1 = floor('floor--gate', 'Главный зал', 'Лови подарки, выигрывай призы!');
  f1.body.append(door(main, 0));
  palace.append(f1.el);

  const f2 = floor('floor--erkem', 'Комнаты королевы', 'Игры для Еркем');
  rooms.filter((r) => r.wing === 'erkem').forEach((r, i) => f2.body.append(door(r, i + 1)));
  palace.append(f2.el);

  const f3 = floor('floor--family', 'Семейный зал', 'Играем все вместе: мама, папа, брат, сестра');
  rooms.filter((r) => r.wing === 'family').forEach((r, i) => f3.body.append(door(r, i + 2)));
  palace.append(f3.el);

  const f4 = floor('floor--vault', 'Сокровищница', 'Призы, альбом и секреты');
  const coupons = store.state.coupons.filter((c) => !c.used).length;
  f4.body.append(door({ id: 'treasury', ...special.treasury, color: '#FFC93C' }, 1, {
    href: '#/treasury', shape: 'vault', noStars: true, title: 'Казна',
    badge: coupons ? h('span.door-badge', {}, String(coupons)) : null
  }));
  f4.body.append(door({ id: 'album', ...special.album, color: '#FF5FA2' }, 2, { href: '#/album', shape: 'book', noStars: true, title: 'Альбом' }));
  const locked = total < 7;
  f4.body.append(door({ id: 'secret', ...special.secret, color: '#5B1A4A' }, 3, {
    href: '#/secret', shape: locked ? 'locked' : 'arch', noStars: true, title: locked ? `Секрет: ещё ${7 - total}` : 'Секретная комната', locked,
    badge: locked ? h('span.door-lock', { html: doodle.lock() }) : null,
    onLocked: () => import('../core/speech.js').then((m) => m.speak(`Эта дверь закрыта. Нужно ещё ${7 - total} звёзд.`))
  }));
  f4.body.append(door({ id: 'final', ...special.final, color: '#C2185B' }, 4, { href: '#/final', shape: 'heart', noStars: true, title: 'Письмо' }));
  palace.append(f4.el);

  palace.append(h('div.palace-ground', { html: groundSVG() }));
  palace.append(h('p.palace-sign.hand', {}, 'Построил для тебя брат Ералы ♥'));
  app.append(palace);

  if (gsap() && !reduced()) {
    gsap().from(palace.querySelectorAll('.door'), { y: 30, opacity: 0, rotation: (i) => (i % 2 ? 6 : -6), stagger: 0.04, duration: 0.5, ease: 'back.out(1.7)', clearProps: 'transform,opacity' });
  }
  return () => {};
}

function floor(cls, name, sub) {
  const el = h(`section.floor.${cls}`);
  el.append(h('div.bunting', { 'aria-hidden': 'true' }));
  const head = h('div.floor-head', {}, h('h2.floor-name', {}, name), h('p.floor-sub.hand', {}, sub));
  const body = h('div.floor-body');
  el.append(head, body, h('div.floor-ledge', { 'aria-hidden': 'true' }));
  return { el, body };
}

function roof() {
  const el = h('div.roof', { 'aria-hidden': 'false' });
  el.innerHTML = `
  <svg class="roof-svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <g class="flag f1"><path d="M96 20 V64" stroke="#5B1A4A" stroke-width="4"/><path d="M98 22 Q118 16 134 26 Q118 34 98 38Z" fill="#3DDBB0" stroke="#5B1A4A" stroke-width="3.5" stroke-linejoin="round"/></g>
    <g class="flag f2"><path d="M300 0 V54" stroke="#5B1A4A" stroke-width="4"/><path d="M302 2 Q330 -6 352 8 Q330 20 302 24Z" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="3.5" stroke-linejoin="round"/></g>
    <g class="flag f3"><path d="M504 20 V64" stroke="#5B1A4A" stroke-width="4"/><path d="M506 22 Q526 16 542 26 Q526 34 506 38Z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="3.5" stroke-linejoin="round"/></g>
    <!-- левая башня -->
    <path d="M60 140 L96 60 L132 140Z" fill="#C2185B" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <path d="M78 120 L96 76 M96 140 L110 104" stroke="#FF5FA2" stroke-width="5" stroke-linecap="round"/>
    <rect x="66" y="138" width="60" height="162" fill="#FFB8D5" stroke="#5B1A4A" stroke-width="5"/>
    <path d="M86 200 a10 10 0 0 1 20 0 v24 h-20z" fill="#5B1A4A"/>
    <!-- правая башня -->
    <path d="M468 140 L504 60 L540 140Z" fill="#C2185B" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <path d="M486 120 L504 76 M504 140 L518 104" stroke="#FF5FA2" stroke-width="5" stroke-linecap="round"/>
    <rect x="474" y="138" width="60" height="162" fill="#FFB8D5" stroke="#5B1A4A" stroke-width="5"/>
    <path d="M494 200 a10 10 0 0 1 20 0 v24 h-20z" fill="#5B1A4A"/>
    <!-- центральный купол -->
    <path d="M200 170 C200 90 258 58 300 52 C342 58 400 90 400 170Z" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <path d="M240 160 C240 110 270 84 300 76" stroke="#FF9CC6" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="300" cy="50" r="9" fill="#FFC93C" stroke="#5B1A4A" stroke-width="4"/>
    <!-- стена с зубцами -->
    <path d="M40 300 V196 h26 v-16 h22 v16 h22 v-16 h22 v16 h340 v-16 h22 v16 h22 v-16 h22 v16 h26 V300Z" fill="#FFD1E3" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <path d="M150 196 v-22 h300 v22" fill="#FFD1E3" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="300" cy="226" r="26" fill="#FFF6FA" stroke="#5B1A4A" stroke-width="5"/>
    <path d="M300 208 v18 l12 8" stroke="#5B1A4A" stroke-width="4" stroke-linecap="round" fill="none"/>
  </svg>
  <div class="roof-banner"><span>Дворец королевы Еркем</span></div>`;
  return el;
}

function groundSVG() {
  return `<svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 18 C60 6 120 26 180 14 C240 4 300 24 360 12 C420 2 480 22 540 12 C570 8 590 12 600 14 V60 H0Z" fill="#3DDBB0" stroke="#5B1A4A" stroke-width="4"/>
    <path d="M0 30 C80 22 160 36 240 28 C320 20 400 36 480 28 C540 22 580 30 600 28 V60 H0Z" fill="#2FC49C"/>
  </svg>`;
}
