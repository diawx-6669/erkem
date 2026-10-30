// «Кто лучше знает Еркем?»: квиз для семьи. Ответы — в data/quiz.json, проверяет Еркем.
import { h, btn, sayBtn, gsap, reduced, burstAt } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const qs = data.quiz.questions;
    const players = data.quiz.players;
    const box = h('div.quiz');
    root.append(box);
    let i = 0, score = {};

    function start() { i = 0; score = Object.fromEntries(players.map((p) => [p, 0])); show(); }

    function show() {
      box.innerHTML = '';
      if (i >= qs.length) { finish(); return; }
      const q = qs[i];
      const card = h('div.quiz-card.paper-card', {},
        h('p.move-round', {}, `Вопрос ${i + 1} из ${qs.length}`),
        h('div.quiz-emoji', {}, q.emoji || '❓'),
        h('h2.quiz-q', {}, q.q),
        sayBtn(q.q));
      const reveal = btn({ icon: '👀', text: 'Показать ответ', variant: 'gold', size: 'xl', onClick: () => showAnswer() });
      const note = h('p.hand.quiz-note', {}, 'Каждый говорит свой ответ вслух. Потом открываем!');
      box.append(card, h('div.center-col', {}, note, reveal));
      if (gsap() && !reduced()) gsap().from(card, { rotation: -6, y: 40, opacity: 0, duration: 0.5, ease: 'back.out(1.8)' });
      speak(q.q);

      function showAnswer() {
        reveal.remove(); note.remove();
        const ans = (q.answer || '').trim();
        const a = h('div.quiz-answer', {}, ans ? h('span', {}, ans) : h('span.hand', {}, 'Еркем, скажи правильный ответ!'));
        card.append(a);
        sfx.drumroll(0.6).then(() => { sfx.sparkle(); burstAt(a, { particleCount: 30 }); });
        if (gsap() && !reduced()) gsap().from(a, { scale: 0, rotation: 20, duration: 0.5, delay: 0.6, ease: 'back.out(2)' });
        speak(ans ? `Правильный ответ: ${ans}` : 'Еркем, скажи правильный ответ!');
        const who = h('div.players.quiz-who');
        const right = new Set();
        players.forEach((p) => {
          const chip = h('button.player-chip', { type: 'button', 'aria-pressed': 'false' }, h('span.player-ini', {}, p[0]), h('span', {}, p));
          chip.addEventListener('click', () => {
            if (right.has(p)) right.delete(p); else { right.add(p); sfx.ding(); }
            chip.setAttribute('aria-pressed', String(right.has(p)));
          });
          who.append(chip);
        });
        box.append(h('div.center-col.quiz-judge', {},
          h('p.hand.quiz-note', {}, 'Еркем, кто ответил правильно?'),
          who,
          btn({ icon: '▶', text: i + 1 < qs.length ? 'Дальше' : 'Итоги', variant: 'pink', onClick: () => { right.forEach((p) => score[p]++); i++; show(); } }),
          board()));
      }
    }

    function board() {
      const top = Math.max(...Object.values(score));
      return h('div.score-board', {}, ...players.map((p) => h(`span.score-pill${score[p] === top && top > 0 ? '.is-lead' : ''}`, {}, p, h('b', {}, String(score[p])))));
    }

    function finish() {
      const top = Math.max(...Object.values(score));
      const best = players.filter((p) => score[p] === top);
      ctx.win({ title: best.length > 1 ? `Ничья: ${best.join(' и ')}!` : `${best[0]} знает Еркем лучше всех!`, text: `Правильных ответов: ${top}`, stars: 3, extra: board(), again: start });
    }

    if (!qs.length) { box.append(h('p', {}, 'Добавьте вопросы в data/quiz.json')); return () => {}; }
    start();
    return () => {};
  }
};
