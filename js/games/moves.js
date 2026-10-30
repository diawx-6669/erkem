// «Повтори движение»: принцесса-человечек танцует, все повторяют, Еркем ставит короны.
import { h, btn, sayBtn, ringTimer, shuffle, gsap, reduced, burstAt } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

const ROUNDS = 5;

export function figureSVG() {
  return `<svg class="figure" viewBox="0 0 200 260" aria-hidden="true">
    <g class="fig-all">
      <g class="leg leg-l"><path d="M88 176 L76 236" stroke="#5B1A4A" stroke-width="9" stroke-linecap="round"/><ellipse cx="72" cy="240" rx="14" ry="8" fill="#C2185B" stroke="#5B1A4A" stroke-width="4"/></g>
      <g class="leg leg-r"><path d="M112 176 L124 236" stroke="#5B1A4A" stroke-width="9" stroke-linecap="round"/><ellipse cx="128" cy="240" rx="14" ry="8" fill="#C2185B" stroke="#5B1A4A" stroke-width="4"/></g>
      <g class="arm arm-l"><path d="M84 112 L46 140" stroke="#5B1A4A" stroke-width="9" stroke-linecap="round"/><circle cx="44" cy="142" r="9" fill="#FFE0CC" stroke="#5B1A4A" stroke-width="4"/></g>
      <g class="arm arm-r"><path d="M116 112 L154 140" stroke="#5B1A4A" stroke-width="9" stroke-linecap="round"/><circle cx="156" cy="142" r="9" fill="#FFE0CC" stroke="#5B1A4A" stroke-width="4"/></g>
      <path class="dress" d="M100 98 L66 186 Q100 198 134 186Z" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
      <path d="M74 168 Q100 178 126 168" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>
      <circle cx="100" cy="66" r="32" fill="#FFE0CC" stroke="#5B1A4A" stroke-width="5"/>
      <path d="M68 62 C70 36 92 30 100 34 C110 30 132 38 132 62 C124 50 112 46 100 48 C88 46 76 52 68 62Z" fill="#3A1B2E"/>
      <circle cx="89" cy="70" r="4" fill="#5B1A4A"/><circle cx="111" cy="70" r="4" fill="#5B1A4A"/>
      <path d="M90 82 Q100 90 110 82" stroke="#5B1A4A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="80" cy="80" rx="6" ry="4" fill="#FF9CC6"/><ellipse cx="120" cy="80" rx="6" ry="4" fill="#FF9CC6"/>
      <path d="M80 36 L76 14 L90 26 L100 8 L110 26 L124 14 L120 36Z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="4" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const moves = data.games.moves || [];
    const players = data.quiz.players;
    const box = h('div.moves');
    root.append(box);

    let deck = [], round = 0, totals = {};

    function start() {
      deck = shuffle(moves).slice(0, ROUNDS);
      round = 0;
      totals = Object.fromEntries(players.map((p) => [p, 0]));
      show();
    }

    function show() {
      box.innerHTML = '';
      const m = deck[round];
      const fig = h(`div.fig-stage.move-${m.id}`, { html: figureSVG() });
      const card = h('div.move-card.paper-card', {},
        h('p.move-round', {}, `Движение ${round + 1} из ${deck.length}`),
        fig,
        h('h2.move-title', {}, m.title),
        h('p.move-how', {}, m.how),
        sayBtn(`${m.title}. ${m.how}`));
      const timer = ringTimer(10, { onEnd: () => judge() });
      const go = btn({ icon: '🎵', text: 'Танцуем!', variant: 'gold', size: 'xl', onClick: () => {
        unlock(); music.play('disco'); fig.classList.add('is-dancing'); go.remove(); timer.hidden = false; timer.start();
        speak(m.title);
      } });
      timer.hidden = true;
      box.append(h('div.move-layout', {}, card, h('div.center-col', {}, go, timer, h('p.hand.move-judge-hint', {}, 'Еркем — судья! После танца она ставит короны.'))));
      fig.classList.add('is-dancing');
      if (gsap() && !reduced()) gsap().from(card, { rotationY: 90, duration: 0.6, ease: 'back.out(1.5)' });
      speak(`${m.title}! ${m.how}`);
    }

    function judge() {
      music.stop();
      const panel = h('div.judge.paper-card', {}, h('h2.section-title', {}, 'Еркем, ставь короны!'));
      players.forEach((p) => {
        const row = h('div.judge-row', {}, h('span.judge-name', {}, p));
        const crowns = h('div.judge-crowns');
        let score = 0;
        for (let i = 1; i <= 3; i++) {
          const c = h('button.judge-crown', { type: 'button', 'aria-label': `${p}: ${i}`, html: doodle.crown() });
          c.addEventListener('click', () => {
            score = i; sfx.ding();
            [...crowns.children].forEach((x, k) => x.classList.toggle('on', k < i));
            row.dataset.score = i;
            burstAt(c, { particleCount: 12, spread: 40 });
          });
          crowns.append(c);
        }
        row.append(crowns);
        panel.append(row);
      });
      panel.append(h('div.win-actions', {}, sayBtn('Еркем, ставь короны! Одна, две или три короны каждому.'),
        btn({ icon: '▶', text: round + 1 < deck.length ? 'Следующее' : 'Итоги', variant: 'pink', onClick: () => {
          panel.querySelectorAll('.judge-row').forEach((r, k) => { totals[players[k]] += Number(r.dataset.score || 0); });
          round++;
          if (round < deck.length) show(); else finish();
        } })));
      box.innerHTML = '';
      box.append(panel);
      speak('Еркем, ставь короны!');
    }

    function finish() {
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const best = sorted.filter((x) => x[1] === sorted[0][1]).map((x) => x[0]);
      const board = h('div.score-board', {}, ...sorted.map(([n, s], i) => h(`span.score-pill${i === 0 ? '.is-lead' : ''}`, {}, n, h('b', {}, `${s} 👑`))));
      ctx.win({ title: best.length > 1 ? `Ничья: ${best.join(' и ')}!` : `Лучше всех: ${best[0]}!`, text: 'Танцевальный король дворца!', stars: 3, extra: board, again: start });
    }

    if (!moves.length) { box.append(h('p', {}, 'Добавьте движения в data/games.json')); return () => {}; }
    start();
    return () => music.stop();
  }
};
