// «Найди пару»: карточки с фото Еркем переворачиваются в 3D.
import { h, btn, shuffle, gsap, reduced, burstAt, wait } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

const LEVELS = [
  { pairs: 6, cols: [3, 4], label: 'Лёгкий' },
  { pairs: 8, cols: [4, 4], label: 'Средний' },
  { pairs: 12, cols: [4, 6], label: 'Трудный' }
];

export default {
  mount(ctx) {
    const { root, data, store } = ctx;
    const menu = h('div.center-col.memory-menu');
    const board = h('div.memory-board');
    const status = h('div.memory-status');
    root.append(menu, status, board);

    function showMenu() {
      board.innerHTML = ''; status.innerHTML = '';
      menu.innerHTML = '';
      menu.append(h('p.hand.menu-title', {}, 'Выбери уровень'));
      const row = h('div.level-row');
      LEVELS.forEach((lv, i) => {
        const b = h('button.level-card', { type: 'button', style: `--rot:${[-3, 2, -1][i]}deg` },
          h('span.level-num', {}, String(lv.pairs)),
          h('span.level-txt', {}, 'пар'),
          h('span.level-lbl', {}, lv.label),
          h('span.level-crowns', { html: Array.from({ length: i + 1 }, () => doodle.crown()).join('') })
        );
        b.addEventListener('click', () => { sfx.click(); play(i); });
        row.append(b);
      });
      menu.append(row);
      menu.hidden = false;
    }

    let busy = false, open = [], found = 0, moves = 0, level = 0;

    function play(li) {
      level = li;
      const lv = LEVELS[li];
      menu.hidden = true;
      found = 0; moves = 0; open = []; busy = false;
      const pics = shuffle(data.photos).slice(0, lv.pairs);
      const deck = shuffle([...pics, ...pics].map((p, i) => ({ p, key: p.name, i })));
      const mobile = window.innerWidth < 700;
      const cols = mobile ? lv.cols[0] : lv.cols[1];
      const rows = Math.ceil(deck.length / cols);
      const avail = Math.max(320, window.innerHeight - 240);
      const maxW = Math.min(root.clientWidth, (avail / rows) * cols * 0.78 + (cols - 1) * 10);
      board.style.setProperty('--cols', cols);
      board.style.maxWidth = Math.max(280, maxW) + 'px';
      board.innerHTML = '';
      status.innerHTML = '';
      const movesEl = h('span.score-pill', {}, 'Ходы: ', h('b', {}, '0'));
      const foundEl = h('span.score-pill', {}, 'Пары: ', h('b', {}, `0 / ${lv.pairs}`));
      status.append(movesEl, foundEl, btn({ icon: '↩', text: 'Уровни', variant: 'ghost', size: 'sm', onClick: showMenu }));

      deck.forEach((card, i) => {
        const el = h('button.mcard', { type: 'button', 'aria-label': `Карточка ${i + 1}`, style: `--d:${i * 0.03}s` });
        el.innerHTML = `<span class="mcard-inner"><span class="mcard-back">${doodle.crown()}</span><span class="mcard-front"><img src="${card.p.thumb}" alt="" loading="lazy" draggable="false"></span></span>`;
        el.card = card;
        el.addEventListener('click', () => flip(el, movesEl, foundEl, lv));
        board.append(el);
      });
      status.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      if (gsap() && !reduced()) gsap().from(board.children, { scale: 0, rotation: () => Math.random() * 40 - 20, stagger: 0.025, duration: 0.4, ease: 'back.out(2)' });
    }

    async function flip(el, movesEl, foundEl, lv) {
      if (busy || el.classList.contains('is-flipped')) return;
      sfx.flip();
      el.classList.add('is-flipped');
      open.push(el);
      if (open.length < 2) return;
      busy = true; moves++;
      movesEl.querySelector('b').textContent = moves;
      const [a, b] = open;
      if (a.card.key === b.card.key) {
        await wait(350);
        [a, b].forEach((x) => x.classList.add('is-matched'));
        sfx.ding(); burstAt(b, { particleCount: 22, spread: 60 });
        found++;
        foundEl.querySelector('b').textContent = `${found} / ${lv.pairs}`;
        open = []; busy = false;
        if (found === lv.pairs) {
          await wait(700);
          const stars = level + 1;
          ctx.win({ title: 'Жарайсың!', text: `Все пары найдены за ${moves} ходов!`, stars, again: showMenu });
        } else if (found === 1) speak('Пара!');
      } else {
        await wait(950);
        [a, b].forEach((x) => { x.classList.remove('is-flipped'); x.classList.add('wiggle'); setTimeout(() => x.classList.remove('wiggle'), 500); });
        open = []; busy = false;
      }
    }

    showMenu();
    return () => {};
  }
};
