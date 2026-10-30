// «Задуй 7 свечей»: дуем в микрофон — пламя клонится и гаснет. Без микрофона — тапом.
import { h, btn, hint, gsap, reduced, salute, wait } from '../core/ui.js';
import { sfx, music, micAnalyser, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

const COLORS = ['#FF5FA2', '#3DDBB0', '#FFC93C', '#C2185B', '#FF9CC6', '#3DDBB0', '#FFC93C'];

export default {
  mount(ctx) {
    const { root } = ctx;
    const scene = h('div.cake-scene');
    const cake = h('div.cake');
    cake.innerHTML = cakeSVG();
    const candles = h('div.candles');
    const list = COLORS.map((c, i) => {
      const el = h('button.candle', { type: 'button', style: `--c:${c};--h:${[62, 74, 68, 80, 70, 76, 64][i]}px;--d:${i * 0.13}s`, 'aria-label': `Свеча ${i + 1}` });
      el.innerHTML = `<span class="flame"><svg viewBox="0 0 40 64"><path class="fl-o" d="M20 2 C30 18 38 30 36 44 C34 56 26 62 20 62 C14 62 6 56 4 44 C2 30 12 20 20 2Z"/><path class="fl-i" d="M20 22 C26 32 29 40 28 48 C27 55 23 58 20 58 C17 58 13 55 12 48 C11 40 15 32 20 22Z"/></svg></span><span class="wick"></span><span class="stick"></span><span class="smoke"><svg viewBox="0 0 40 120"><path d="M20 118 C8 100 32 88 20 70 C8 52 32 40 20 22 C14 12 20 4 22 2"/></svg></span>`;
      el.lit = true; el.hp = 1;
      el.addEventListener('click', () => { unlock(); if (el.lit) { el.hp = 0; out(el); } });
      candles.append(el);
      return el;
    });
    cake.prepend(candles);
    const wind = h('div.wind', { 'aria-hidden': 'true' }, h('span'), h('span'), h('span'));
    scene.append(wind, cake);

    const tip = hint('Нажми «Дуть», а потом подуй на телефон, как на свечки!');
    const modes = h('div.choose-row', {},
      btn({ icon: '🎤', text: 'Дуть', variant: 'pink', size: 'xl', onClick: () => useMic() }),
      btn({ icon: '👆', text: 'Пальчиком', variant: 'mint', onClick: () => useTap() })
    );
    const meter = h('div.blow-meter', { hidden: true }, h('span.blow-fill'), h('span.blow-label', {}, 'Сила ветра'));
    const panel = h('div.center-col.candle-panel', {}, tip, modes, meter);
    root.append(scene, panel);

    let mic = null, raf = 0, floor = 0.01, done = false;

    async function useMic() {
      try {
        mic = await micAnalyser();
      } catch (e) {
        tip.set('Микрофон не включился. Ничего страшного — гаси свечки пальчиком!');
        speak('Микрофон не включился. Гаси свечки пальчиком!');
        useTap();
        return;
      }
      modes.remove();
      meter.hidden = false;
      tip.set('Подожди секундочку… А теперь дуй!');
      // калибровка: слушаем тишину
      let sum = 0, n = 0;
      const t0 = performance.now();
      while (performance.now() - t0 < 700) { sum += mic.level(); n++; await wait(30); }
      floor = Math.max(0.006, sum / Math.max(1, n));
      speak('Дуй!');
      tip.set('Дуй на телефон! Ещё можно нажимать на свечки.');
      loop();
    }

    function useTap() {
      modes.remove();
      tip.set('Нажимай на огоньки, чтобы погасить свечи!');
      speak('Нажимай на огоньки, чтобы погасить свечи!');
      candles.classList.add('is-tappable');
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      if (!mic) return;
      const lvl = mic.level();
      const thr = Math.max(0.035, floor * 3.2);
      const power = Math.max(0, Math.min(1, (lvl - thr) / (thr * 3)));
      meter.firstChild.style.transform = `scaleX(${Math.min(1, lvl / (thr * 4))})`;
      scene.style.setProperty('--lean', power.toFixed(3));
      wind.classList.toggle('is-on', power > 0.05);
      if (power > 0.05) {
        list.forEach((c, i) => {
          if (!c.lit) return;
          c.hp -= power * (0.035 + 0.03 * Math.sin(i * 1.7 + performance.now() / 300) ** 2);
          if (c.hp <= 0) out(c);
        });
      }
    }

    function out(c) {
      c.lit = false;
      c.classList.add('is-out');
      sfx.puff();
      const smoke = c.querySelector('.smoke');
      if (gsap() && !reduced()) gsap().fromTo(smoke, { opacity: 0.9, y: 0, scaleX: 0.6 }, { opacity: 0, y: -60, scaleX: 1.4, duration: 2.4, ease: 'power1.out' });
      if (list.every((x) => !x.lit)) finish();
    }

    async function finish() {
      if (done) return; done = true;
      cancelAnimationFrame(raf);
      if (mic) { mic.stop(); mic = null; }
      scene.style.setProperty('--lean', 0);
      wind.classList.remove('is-on');
      meter.hidden = true;
      await wait(900);
      salute();
      music.play('birthday');
      tip.set('Ура! Загадай желание!');
      speak('Ура! Все свечи погасли! Загадай желание! Туған күніңмен!');
      await wait(6500);
      ctx.win({ title: 'Желание загадано!', text: 'Все семь свечей погасли.', stars: 3, again: relight });
    }

    function relight() {
      done = false;
      list.forEach((c) => { c.lit = true; c.hp = 1; c.classList.remove('is-out'); });
      music.stop();
      tip.set('Свечи снова горят! Выбери, как гасить.');
      panel.insertBefore(modes, meter);
      candles.classList.remove('is-tappable');
    }

    if (gsap() && !reduced()) gsap().from(cake, { y: 60, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' });
    return () => { cancelAnimationFrame(raf); if (mic) mic.stop(); };
  }
};

function cakeSVG() {
  return `<svg class="cake-svg" viewBox="0 0 320 230" aria-hidden="true">
    <ellipse cx="160" cy="214" rx="150" ry="14" fill="#5B1A4A" opacity=".15"/>
    <path d="M14 206 h292" stroke="#5B1A4A" stroke-width="6" stroke-linecap="round"/>
    <path d="M10 202 Q160 222 310 202 L300 196 Q160 214 20 196Z" fill="#fff" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <rect x="40" y="96" width="240" height="102" rx="14" fill="#FF9CC6" stroke="#5B1A4A" stroke-width="5"/>
    <path d="M42 140 Q160 156 278 140" stroke="#fff" stroke-width="8" fill="none" opacity=".7"/>
    <g fill="#FFC93C" stroke="#5B1A4A" stroke-width="3">
      <circle cx="70" cy="170" r="7"/><circle cx="120" cy="178" r="7"/><circle cx="170" cy="174" r="7"/><circle cx="220" cy="178" r="7"/><circle cx="256" cy="168" r="7"/>
    </g>
    <path d="M36 104 C36 80 284 80 284 104 L284 112 C276 132 262 112 254 124 C244 140 232 112 222 126 C212 140 200 112 190 128 C180 142 170 112 160 126 C150 142 136 112 126 128 C116 142 104 112 94 124 C84 136 72 110 62 126 C52 140 42 120 36 112Z" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
    <g fill="#fff"><circle cx="80" cy="96" r="3"/><circle cx="130" cy="92" r="3"/><circle cx="190" cy="94" r="3"/><circle cx="240" cy="96" r="3"/><circle cx="104" cy="104" r="2.5"/><circle cx="214" cy="104" r="2.5"/></g>
    <text x="160" y="166" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="44" fill="#C2185B" stroke="#fff" stroke-width="5" paint-order="stroke" transform="rotate(-3 160 160)">Еркем, 7!</text>
  </svg>`;
}
