// «Угадай, сколько мне тут лет»: фото и три варианта ответа.
import { h, btn, sticker, shuffle, burstAt, gsap, reduced, wait } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

const EXTRA = ['4 годика', '5 лет', '7 лет'];

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const pool = data.photos.filter((p) => p.age);
    const labels = [...new Set([...pool.map((p) => p.age), ...EXTRA])];
    const box = h('div.age-game');
    root.append(box);

    let rounds = [], i = 0, score = 0;

    function start() {
      rounds = shuffle(pool).slice(0, Math.min(7, pool.length));
      i = 0; score = 0;
      next();
    }

    function next() {
      box.innerHTML = '';
      if (i >= rounds.length) { finish(); return; }
      const p = rounds[i];
      const wrong = shuffle(labels.filter((l) => l !== p.age)).slice(0, 2);
      const opts = shuffle([p.age, ...wrong]);
      const progress = h('div.age-progress', {}, ...rounds.map((_, k) => h(`span${k < i ? '.done' : k === i ? '.now' : ''}`)));
      const photo = sticker(p, { rot: [-3, 2, -2, 3][i % 4], tape: 'top', cls: 'age-photo' });
      const q = h('p.hand.age-q', {}, 'Сколько мне тут лет?');
      const answers = h('div.age-answers');
      let done = false;
      opts.forEach((o) => {
        const b = btn({ text: o, variant: 'ghost', size: 'xl', cls: 'age-opt', onClick: async () => {
          if (done) return;
          if (o === p.age) {
            done = true; score++;
            b.classList.add('is-right');
            sfx.ding(); burstAt(b, { particleCount: 40 });
            speak(`Жарайсың! Тут мне ${p.age}.`);
            await wait(1500);
            i++; next();
          } else {
            b.classList.add('is-wrong', 'wiggle');
            sfx.boop();
            speak('Почти! Попробуй ещё.');
            setTimeout(() => b.classList.remove('wiggle'), 500);
            // со второй ошибки подсвечиваем правильный ответ
            if (answers.querySelectorAll('.is-wrong').length >= 2) {
              done = true;
              const right = [...answers.children].find((x) => x.textContent.includes(p.age));
              right.classList.add('is-right');
              speak(`Тут мне ${p.age}.`);
              await wait(1800);
              i++; next();
            }
          }
        } });
        answers.append(b);
      });
      box.append(progress, h('div.age-row', {}, h('div.age-photo-wrap', {}, photo), h('div.age-side', {}, q, h('div.age-note.hand', {}, p.note), answers)));
      if (gsap() && !reduced()) {
        gsap().from(photo, { scale: 0.3, rotation: -25, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' });
        gsap().from(answers.children, { y: 40, opacity: 0, stagger: 0.1, duration: 0.4, delay: 0.2, ease: 'back.out(2)' });
      }
      if (i > 0) progress.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      speak('Сколько мне тут лет?');
    }

    function finish() {
      const n = rounds.length;
      const stars = score >= n - 1 ? 3 : score >= Math.ceil(n / 2) ? 2 : 1;
      ctx.win({ title: 'Жарайсың!', text: `Угадано ${score} из ${n}.`, stars, again: start });
    }

    start();
    return () => {};
  }
};
