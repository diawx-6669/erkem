// «Поймай звёздочку»: Еркем выглядывает из окошек дворца — лови! Тучки не трогать.
import { h, btn, pick, rand, gsap, reduced, burstAt } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

const TIME = 30;

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const faces = data.photos.filter((p) => /13-|21-|24-|25-|26-|22-|00-|23-/.test(p.name));
    const hud = h('div.rain-hud', {}, h('div.rain-score', {}, h('span.rain-score-ico', { html: doodle.star() }), h('span.rain-score-num.w-score', {}, '0')), h('div.rain-time', {}, h('span.rain-time-fill.w-time')), h('div.rain-gifts', {}, h('span.w-sec', {}, String(TIME))));
    const grid = h('div.whack');
    const holes = Array.from({ length: 9 }, (_, i) => {
      const hole = h('div.hole');
      const pop = h('button.pop', { type: 'button', 'aria-label': 'Окошко' }, h('img', { alt: '' }), h('span.pop-cloud', { html: doodle.cloud() }));
      hole.append(h('span.hole-arch'), pop);
      pop.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(i); });
      grid.append(hole);
      return { hole, pop, up: false, cloud: false, timer: null };
    });
    const startCard = h('div.center-col', {}, btn({ icon: '▶', text: 'Начать!', variant: 'gold', size: 'xl', onClick: () => start() }));
    root.append(hud, grid, startCard);

    let score = 0, left = TIME, running = false, spawnT = null, clock = null;

    function start() {
      unlock();
      startCard.hidden = true;
      score = 0; left = TIME; running = true;
      root.querySelector('.w-score').textContent = '0';
      music.play('disco');
      speak('Лови!');
      clock = setInterval(() => {
        left--;
        root.querySelector('.w-sec').textContent = String(left);
        root.querySelector('.w-time').style.transform = `scaleX(${left / TIME})`;
        if (left <= 0) end();
      }, 1000);
      spawn();
    }
    function spawn() {
      if (!running) return;
      const free = holes.filter((x) => !x.up);
      if (free.length) show(pick(free));
      const k = 1 - left / TIME;
      spawnT = setTimeout(spawn, rand(650, 1000) - k * 350);
    }
    function show(x) {
      x.up = true;
      x.cloud = Math.random() < 0.2;
      x.pop.classList.toggle('is-cloud', x.cloud);
      x.pop.querySelector('img').src = pick(faces).thumb;
      x.hole.classList.add('is-up');
      const stay = Math.max(650, 1300 - (1 - left / TIME) * 600);
      x.timer = setTimeout(() => hide(x), stay);
    }
    function hide(x) { x.up = false; clearTimeout(x.timer); x.hole.classList.remove('is-up', 'is-hit'); }
    function hit(i) {
      const x = holes[i];
      if (!running || !x.up || x.hole.classList.contains('is-hit')) return;
      if (x.cloud) { sfx.boop(); x.hole.classList.add('wiggle'); setTimeout(() => x.hole.classList.remove('wiggle'), 450); hide(x); return; }
      score++;
      root.querySelector('.w-score').textContent = String(score);
      x.hole.classList.add('is-hit');
      sfx.pop(); burstAt(x.pop, { particleCount: 18, spread: 70 });
      setTimeout(() => hide(x), 260);
    }
    function end() {
      running = false;
      clearInterval(clock); clearTimeout(spawnT);
      holes.forEach(hide);
      music.stop();
      startCard.hidden = false;
      ctx.win({ title: 'Жарайсың!', text: `Поймано звёздочек: ${score}`, stars: score >= 18 ? 3 : score >= 9 ? 2 : 1 });
    }
    if (gsap() && !reduced()) gsap().from(grid.children, { scale: 0, stagger: 0.05, duration: 0.4, ease: 'back.out(2)' });
    return () => { running = false; clearInterval(clock); clearTimeout(spawnT); holes.forEach((x) => clearTimeout(x.timer)); music.stop(); };
  }
};
