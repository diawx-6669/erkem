// «Крокодил семейный»: покажи слово без слов, две команды, таймер, счёт.
import { h, btn, sayBtn, ringTimer, shuffle, gsap, reduced, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

const GOAL = 7;
const TEAMS = [{ name: 'Корона', icon: () => doodle.crown(), color: '#FFC93C' }, { name: 'Сердечко', icon: () => doodle.heart(), color: '#FF5FA2' }];

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const cats = data.games.crocodile || {};
    const box = h('div.croc');
    root.append(box);
    let score = [0, 0], team = 0, words = [], cat = 'Всё вперемешку';

    function setup() {
      score = [0, 0]; team = 0;
      box.innerHTML = '';
      const row = h('div.choose-row');
      ['Всё вперемешку', ...Object.keys(cats)].forEach((c) => {
        const b = btn({ icon: { 'Животные': '🐧', 'Профессии': '👩‍🍳', 'Действия': '🚲' }[c] || '🎲', text: c, variant: c === cat ? 'pink' : 'ghost', size: 'sm', onClick: () => { cat = c; setup(); } });
        row.append(b);
      });
      box.append(
        h('div.croc-teams', {}, ...TEAMS.map((t, i) => h('div.croc-team', { style: `--c:${t.color}` }, h('span.ct-icon', { html: t.icon() }), h('span.ct-name', {}, `Команда «${t.name}»`)))),
        h('p.hand.menu-title', {}, 'Что показываем?'), row,
        h('p.croc-rule', {}, `Разделитесь на две команды. Кто первым наберёт ${GOAL} очков — победил!`),
        btn({ icon: '▶', text: 'Начать', variant: 'gold', size: 'xl', onClick: () => turn() })
      );
    }

    function nextWord() {
      if (!words.length) {
        const pool = cat === 'Всё вперемешку' ? Object.values(cats).flat() : (cats[cat] || []);
        words = shuffle(pool);
      }
      return words.pop();
    }

    function turn() {
      box.innerHTML = '';
      const t = TEAMS[team];
      box.append(h('div.croc-pass.paper-card', { style: `--c:${t.color}` },
        h('span.ct-icon.big', { html: t.icon() }),
        h('h2.section-title', {}, `Ход команды «${t.name}»`),
        h('p', {}, 'Отдай телефон тому, кто будет показывать. Остальные не подглядывают!'),
        h('div.win-actions', {}, sayBtn(`Ход команды ${t.name}. Отдай телефон тому, кто будет показывать.`), btn({ icon: '👀', text: 'Я показываю', variant: 'pink', onClick: play }))),
        scoreBoard());
      speak(`Ход команды ${t.name}!`);
    }

    function play() {
      box.innerHTML = '';
      let word = nextWord();
      let got = 0;
      const card = h('button.croc-card', { type: 'button' }, h('span.cc-back', {}, h('span.cc-q', {}, '?'), h('span.cc-tap', {}, 'Нажми — посмотри слово')), h('span.cc-front', {}, h('span.cc-word', {}, word)));
      let shown = false;
      card.addEventListener('click', () => { shown = !shown; card.classList.toggle('is-shown', shown); sfx.flip(); });
      const timer = ringTimer(60, { onEnd: () => timeUp() });
      const yes = btn({ icon: '✅', text: 'Угадали!', variant: 'mint', size: 'xl', onClick: () => {
        got++; score[team]++; sfx.ding(); confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
        board.replaceWith(board = scoreBoard());
        if (score[team] >= GOAL) { timer.stop(); win(); return; }
        word = nextWord(); swap();
      } });
      const skip = btn({ icon: '⏭', text: 'Другое слово', variant: 'ghost', size: 'sm', onClick: () => { word = nextWord(); swap(); sfx.whoosh(); } });
      const swap = () => {
        card.querySelector('.cc-word').textContent = word;
        shown = true; card.classList.add('is-shown');
        if (gsap() && !reduced()) gsap().fromTo(card, { rotationY: -90 }, { rotationY: 0, duration: 0.4, ease: 'back.out(2)' });
      };
      let board = scoreBoard();
      box.append(h('div.croc-play', {}, card, h('div.center-col', {}, timer, yes, skip, board)));
      timer.start();
      function timeUp() {
        sfx.boom();
        box.innerHTML = '';
        box.append(h('div.croc-pass.paper-card', {}, h('h2.section-title', {}, 'Время вышло!'), h('p', {}, `Команда «${TEAMS[team].name}» угадала: ${got}`), scoreBoard(),
          h('div.win-actions', {}, btn({ icon: '🔁', text: 'Ход другой команды', variant: 'gold', onClick: () => { team = 1 - team; turn(); } }))));
        speak(`Время вышло! Угадали ${got}.`);
      }
    }

    function scoreBoard() {
      return h('div.score-board', {}, ...TEAMS.map((t, i) => h(`span.score-pill${score[i] >= score[1 - i] && score[i] > 0 ? '.is-lead' : ''}`, {}, h('span.sp-icon', { html: t.icon() }), t.name, h('b', {}, String(score[i])))));
    }

    function win() {
      ctx.win({ title: `Победила команда «${TEAMS[team].name}»!`, text: `Счёт ${score[0]} : ${score[1]}`, stars: 3, again: setup });
    }

    setup();
    return () => {};
  }
};
