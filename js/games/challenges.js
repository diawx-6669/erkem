// «Челленджи как у блогеров»: коробки-сюрпризы, внутри челлендж, таймер, экран победителя.
import { h, btn, sayBtn, ringTimer, overlay, gsap, reduced, salute } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music } from '../core/audio.js';
import { speak } from '../core/speech.js';

const BOX = ['#FF5FA2', '#3DDBB0', '#FFC93C', '#C2185B', '#FF9CC6'];

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const list = data.games.challenges || [];
    const names = ['Еркем', ...data.quiz.players];
    let score = Object.fromEntries(names.map((n) => [n, 0]));
    const opened = new Set();
    const box = h('div.chal');
    root.append(box);

    function grid() {
      box.innerHTML = '';
      const g = h('div.chal-grid');
      list.forEach((c, i) => {
        const b = h(`button.chal-box${opened.has(i) ? '.is-open' : ''}`, { type: 'button', style: `--rot:${[-4, 3, -2, 4, -1][i % 5]}deg`, 'aria-label': opened.has(i) ? c.title : `Коробка ${i + 1}` });
        b.innerHTML = `<span class="cb-gift">${doodle.gift({ color: BOX[i % BOX.length], ribbon: i % 2 ? '#FF5FA2' : '#FFC93C' })}</span><span class="cb-q">?</span><span class="cb-done">${c.emoji}<small>${c.title}</small></span>`;
        b.addEventListener('click', () => unbox(i, b));
        g.append(b);
      });
      box.append(h('p.hand.menu-title', {}, 'Выбери коробку — внутри челлендж!'), g, board(),
        btn({ icon: '🏆', text: 'Итоги', variant: 'ghost', size: 'sm', onClick: finish }));
    }

    async function unbox(i, el) {
      sfx.click();
      const g = gsap();
      if (g && !reduced()) {
        const gift = el.querySelector('.cb-gift');
        const sh = g.to(gift, { rotation: 8, duration: 0.06, yoyo: true, repeat: -1 });
        await sfx.drumroll(0.9);
        sh.kill();
        await g.to(gift, { y: -40, scale: 1.3, opacity: 0, duration: 0.3 }).then();
      } else await sfx.drumroll(0.5);
      opened.add(i);
      showChallenge(list[i]);
    }

    function showChallenge(c) {
      box.innerHTML = '';
      const timer = ringTimer(c.seconds || 30, { onEnd: () => { music.stop(); sfx.boom(); pickWinner(c); } });
      const card = h('div.chal-card.paper-card', {},
        h('div.quiz-emoji', {}, c.emoji),
        h('h2.move-title', {}, c.title),
        h('p.move-how', {}, c.how),
        sayBtn(`${c.title}. ${c.how}`));
      const go = btn({ icon: '⏱', text: 'Старт!', variant: 'gold', size: 'xl', onClick: () => { go.remove(); stop.hidden = false; timer.start(); music.play('disco'); speak('Старт!'); } });
      const stop = btn({ icon: '🏁', text: 'Готово!', variant: 'pink', onClick: () => { timer.stop(); music.stop(); pickWinner(c); } });
      stop.hidden = true;
      box.append(h('div.move-layout', {}, card, h('div.center-col', {}, timer, go, stop)));
      if (gsap() && !reduced()) gsap().from(card, { scale: 0.3, rotation: 15, duration: 0.6, ease: 'back.out(1.8)' });
      sfx.sparkle();
      speak(`${c.title}! ${c.how}`);
    }

    function pickWinner(c) {
      const row = h('div.players');
      names.forEach((n) => {
        const b = h('button.player-chip', { type: 'button' }, h('span.player-ini', {}, n[0]), h('span', {}, n));
        b.addEventListener('click', () => { score[n]++; ov.close(); celebrate(n); });
        row.append(b);
      });
      const ov = overlay(h('div', {}, h('h2.win-title', {}, 'Кто победил?'), h('p.win-text', {}, c.title), row,
        h('div.win-actions', {}, sayBtn('Кто победил? Нажми на имя.'), btn({ icon: '🤝', text: 'Ничья', variant: 'ghost', size: 'sm', onClick: () => { ov.close(); grid(); } }))));
      speak('Кто победил?');
    }

    function celebrate(n) {
      sfx.fanfare(); salute();
      const ov = overlay(h('div.chal-winner', {}, h('div.win-crown', { html: doodle.crown() }), h('h2.win-title', {}, `${n} — победитель!`),
        h('div.win-actions', {}, btn({ icon: '🎁', text: 'Следующий', variant: 'gold', onClick: () => { ov.close(); grid(); } }))), { onClose: () => grid() });
      speak(`${n} — победитель! Жарайсың!`);
      const played = opened.size;
      ctx.award(played >= 3 ? 3 : 2);
    }

    function board() {
      const top = Math.max(...Object.values(score));
      return h('div.score-board', {}, ...names.map((n) => h(`span.score-pill${score[n] === top && top > 0 ? '.is-lead' : ''}`, {}, n, h('b', {}, String(score[n])))));
    }

    function finish() {
      const top = Math.max(...Object.values(score));
      const best = names.filter((n) => score[n] === top);
      if (!top) { speak('Сначала открой коробку!'); return; }
      ctx.win({ title: best.length > 1 ? `Ничья: ${best.join(' и ')}!` : `${best[0]} — звезда челленджей!`, text: `Побед: ${top}`, stars: 3, extra: board(), again: () => { opened.clear(); score = Object.fromEntries(names.map((x) => [x, 0])); grid(); } });
    }

    grid();
    return () => music.stop();
  }
};
