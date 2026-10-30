// «Лопни шарики»: шарики с цифрами 1–7, лопаем по порядку.
import { h, btn, rand, shuffle, burstAt, gsap, reduced } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

const WORDS = ['', 'Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь'];
const COLORS = ['#FF5FA2', '#FFC93C', '#3DDBB0', '#C2185B', '#FF9CC6', '#9B7BEA', '#FF8A3D'];

export default {
  mount(ctx) {
    const { root } = ctx;
    const top = h('div.balloon-top');
    const target = h('div.balloon-target');
    const sky = h('div.balloon-sky');
    root.append(top, sky);

    let order = [], idx = 0, balloons = [], raf = 0, level = 1, running = false, last = 0;

    function menu() {
      running = false; cancelAnimationFrame(raf);
      sky.innerHTML = ''; top.innerHTML = '';
      const m = h('div.center-col.balloon-menu', {},
        h('p.hand.menu-title', {}, 'Как будем лопать?'),
        h('div.level-row', {},
          levelBtn(1, '1 → 7', 'По порядку', '#FFE9F2'),
          levelBtn(2, '7 → 1', 'Обратный отсчёт', '#DDF8EF')
        ));
      sky.append(m);
    }
    function levelBtn(lv, big, small, bg) {
      const b = h('button.level-card.level-card--wide', { type: 'button', style: `background:${bg};--rot:${lv === 1 ? -2 : 2}deg` },
        h('span.level-num', {}, big), h('span.level-lbl', {}, small));
      b.addEventListener('click', () => { sfx.click(); start(lv); });
      return b;
    }

    function start(lv) {
      level = lv; idx = 0;
      order = lv === 1 ? [1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1];
      sky.innerHTML = '';
      top.innerHTML = '';
      top.append(target);
      updateTarget();
      const W = sky.clientWidth, H = sky.clientHeight;
      const size = Math.max(70, Math.min(120, W / 4.4));
      const slots = shuffle([...Array(7).keys()]);
      balloons = shuffle([1, 2, 3, 4, 5, 6, 7]).map((n, i) => {
        const el = h('button.balloon', { type: 'button', 'aria-label': `Шарик ${n}`, style: `width:${size}px`, html: doodle.balloon({ color: COLORS[n - 1], text: String(n) }) });
        const b = { el, n, x: (slots[i] + 0.5) * (W - size) / 7, y: H * rand(0.25, 1.05), vy: rand(22, 40) * (lv === 2 ? 1.3 : 1), ph: rand(0, 6.28), size, alive: true };
        el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(b); } });
        sky.append(el);
        return b;
      });
      running = true; last = 0;
      raf = requestAnimationFrame(loop);
      speak(lv === 1 ? 'Найди шарик с цифрой один!' : 'Обратный отсчёт! Найди семь!');
    }

    function updateTarget() {
      const n = order[idx];
      target.innerHTML = '';
      target.append(h('span.bt-label', {}, 'Ищем:'), h('span.bt-num', { style: `background:${COLORS[n - 1]}` }, String(n)),
        h('span.bt-dots', {}, ...order.map((x, i) => h(`span${i < idx ? '.done' : ''}`, {}, String(x)))));
    }

    function loop(ts) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      const H = sky.clientHeight;
      for (const b of balloons) {
        if (!b.alive) continue;
        b.y -= b.vy * dt;
        b.ph += dt * 1.3;
        if (b.y < -b.size * 1.5) b.y = H + rand(10, 60);
        const sway = Math.sin(b.ph) * 12;
        b.el.style.transform = `translate(${b.x + sway}px, ${b.y}px) rotate(${Math.sin(b.ph * 0.8) * 6}deg)`;
      }
    }

    function tap(b) {
      if (!b.alive || !running) return;
      if (b.n !== order[idx]) {
        sfx.boop();
        b.el.classList.remove('wiggle'); void b.el.offsetWidth; b.el.classList.add('wiggle');
        speak(`Это ${WORDS[b.n].toLowerCase()}. Ищем ${WORDS[order[idx]].toLowerCase()}!`);
        return;
      }
      b.alive = false;
      sfx.pop();
      burstAt(b.el, { particleCount: 30, spread: 80, colors: [COLORS[b.n - 1], '#fff', '#FFC93C'] });
      speak(WORDS[b.n] + '!');
      if (gsap() && !reduced()) gsap().to(b.el, { scale: 1.6, opacity: 0, duration: 0.18, onComplete: () => b.el.remove() });
      else b.el.remove();
      idx++;
      if (idx >= order.length) { finish(); return; }
      updateTarget();
    }

    function finish() {
      running = false;
      cancelAnimationFrame(raf);
      updateTarget();
      setTimeout(() => ctx.win({
        title: level === 1 ? 'Все шарики лопнули!' : 'Пуск! Ракета взлетела!',
        text: level === 1 ? 'Один, два, три, четыре, пять, шесть, семь!' : 'Семь, шесть, пять, четыре, три, два, один!',
        stars: level === 1 ? 2 : 3, again: menu
      }), 600);
    }

    menu();
    return () => { running = false; cancelAnimationFrame(raf); };
  }
};
