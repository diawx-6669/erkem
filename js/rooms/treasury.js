// Королевская казна: выигранные купоны. Родители гасят их штампом «ИСПОЛНЕНО».
import { h, btn, sayBtn, overlay, gsap, reduced, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';

const fmt = (ts) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const SOURCES = { rain: 'Дождь сюрпризов', wheel: 'Колесо фортуны' };

export function mount(root, { store }) {
  const render = () => {
    root.innerHTML = '';
    const list = store.state.coupons;
    const active = list.filter((c) => !c.used), used = list.filter((c) => c.used);

    root.append(h('div.treasury-intro', {},
      h('div.chest', { html: chestSVG(active.length > 0) }),
      h('div', {},
        h('p.hand.treasury-lead', {}, active.length ? `В казне ${active.length} ${plural(active.length, 'купон', 'купона', 'купонов')}!` : 'Казна пока пустая'),
        h('p.treasury-sub', {}, active.length ? 'Покажи купон маме или папе. Когда желание исполнят, они нажмут «Использовать».' : 'Сыграй в «Дождь сюрпризов» или покрути «Колесо фортуны» — призы попадут сюда.')
      ),
      sayBtn(() => active.length ? `В казне ${active.length} купонов! Покажи купон маме или папе.` : 'Казна пока пустая. Сыграй в Дождь сюрпризов или покрути Колесо фортуны.')
    ));
    if (!list.length) {
      root.append(h('div.treasury-empty', {}, btn({ icon: '🎁', text: 'Дождь сюрпризов', variant: 'gold', onClick: () => { location.hash = '#/room/rain'; } })));
      return;
    }
    const grid = h('div.tickets');
    [...active, ...used].forEach((c, i) => grid.append(ticket(c, i)));
    root.append(grid);
  };

  const ticket = (c, i) => {
    const t = h(`article.ticket${c.used ? '.is-used' : ''}`, { style: `--rot:${[-1.5, 1, -0.5, 1.6][i % 4]}deg` });
    const textParts = c.text.split('___');
    const text = h('p.ticket-text');
    text.append(textParts[0]);
    if (textParts.length > 1) {
      const inp = h('input.ticket-fill', { type: 'text', inputmode: 'numeric', value: c.fill || '', placeholder: '___', 'aria-label': 'Сумма', size: 5 });
      inp.addEventListener('change', () => store.fillCoupon(c.uid, inp.value));
      text.append(inp, textParts.slice(1).join(''));
    }
    t.append(
      h('div.ticket-stub', {}, h('span.ticket-emoji', {}, c.emoji || '🎁'), h('span.ticket-no', {}, '№ ' + c.uid.slice(-4).toUpperCase())),
      h('div.ticket-main', {},
        h('p.ticket-kind', {}, 'Купон королевы'),
        text,
        h('p.ticket-meta', {}, `${SOURCES[c.source] || 'Подарок'}, ${fmt(c.wonAt)}`),
        h('span.ticket-seal', { html: doodle.seal() })
      )
    );
    if (c.used) {
      t.append(h('div.stamp', {}, h('span', {}, 'ИСПОЛНЕНО'), h('small', {}, fmt(c.usedAt))));
    } else {
      t.querySelector('.ticket-main').append(h('div.ticket-actions', {},
        sayBtn(`Купон королевы: ${c.text.replace('___', c.fill || 'сколько-то')}`),
        btn({ icon: '✔️', text: 'Использовать', variant: 'ghost', size: 'sm', onClick: () => confirmUse(c, t) })
      ));
    }
    return t;
  };

  const confirmUse = (c, el) => {
    const box = h('div.confirm', {},
      h('p.confirm-q', {}, 'Родители, желание исполнено?'),
      h('p.confirm-what', {}, `${c.emoji} ${c.text.replace('___', c.fill || '___')}`),
      h('div.win-actions', {},
        btn({ icon: '↩️', text: 'Пока нет', variant: 'ghost', onClick: () => ov.close() }),
        btn({ icon: '✔️', text: 'Да, исполнено', variant: 'pink', onClick: () => { ov.close(); stampIt(c, el); } })
      )
    );
    const ov = overlay(box);
  };

  const stampIt = (c, el) => {
    store.useCoupon(c.uid);
    const s = h('div.stamp', {}, h('span', {}, 'ИСПОЛНЕНО'), h('small', {}, fmt(Date.now())));
    el.classList.add('is-used');
    el.querySelector('.ticket-actions')?.remove();
    el.append(s);
    const g = gsap();
    if (g && !reduced()) {
      g.fromTo(s, { scale: 3, opacity: 0, rotation: -40 }, { scale: 1, opacity: 1, rotation: -14, duration: 0.3, ease: 'power4.in', onComplete: () => { sfx.stamp(); g.fromTo(el, { y: 4 }, { y: 0, duration: 0.3, ease: 'elastic.out(1.4,0.3)' }); confetti({ particleCount: 30, spread: 60, origin: { y: 0.5 } }); } });
    } else sfx.stamp();
    setTimeout(render, 1600);
  };

  render();
  const off = store.onChange(() => {});
  return () => off();
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function chestSVG(full) {
  return `<svg viewBox="0 0 120 100" aria-hidden="true">
    ${full ? '<g class="chest-glow"><path d="M30 40 L18 10 M60 34 V2 M90 40 L102 10" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/></g>' : ''}
    <path d="M14 50 H106 V90 Q106 94 102 94 H18 Q14 94 14 90Z" fill="#7A4DEB" stroke="#5B1A4A" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M14 50 C14 24 106 24 106 50Z" fill="#A47BFF" stroke="#5B1A4A" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M30 32 V94 M90 32 V94" stroke="#FFC93C" stroke-width="7"/><path d="M30 32 V94 M90 32 V94" stroke="#5B1A4A" stroke-width="2" opacity=".4"/>
    <rect x="50" y="46" width="20" height="22" rx="4" fill="#FFC93C" stroke="#5B1A4A" stroke-width="4"/><circle cx="60" cy="56" r="3" fill="#5B1A4A"/>
  </svg>`;
}
