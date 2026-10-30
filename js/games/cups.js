// «Где корона?»: корону прячут под стаканчик и перемешивают. Найди её!
import { h, btn, gsap, reduced, burstAt, wait } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

const ROUNDS = 5;
const CUP_COLORS = ['#8C5BFF', '#2FC49C', '#E94C8F'];

export default {
  mount(ctx) {
    const { root } = ctx;
    const table = h('div.cups-table');
    const crown = h('div.cups-crown', { html: doodle.crown() });
    table.append(crown);
    const cups = CUP_COLORS.map((c, i) => {
      const b = h('button.cup', { type: 'button', 'aria-label': `Стаканчик ${i + 1}`, html: cupSVG(c) });
      table.append(b);
      return b;
    });
    const info = h('div.center-col', {}, h('div.score-board', {}, h('span.score-pill', {}, 'Раунд: ', h('b.c-round', {}, '1')), h('span.score-pill', {}, 'Нашла: ', h('b.c-score', {}, '0'))));
    const go = btn({ icon: '▶', text: 'Прятать!', variant: 'gold', size: 'xl', onClick: () => play() });
    info.append(go);
    root.append(table, info);

    let slots = [0, 1, 2], crownAt = 1, round = 0, score = 0, canPick = false;
    const W = () => table.clientWidth;
    const xOf = (slot) => (W() / 3) * slot + W() / 6;

    function layout(animate = false) {
      cups.forEach((c, i) => {
        const x = xOf(slots[i]) - c.offsetWidth / 2;
        if (animate && gsap()) gsap().to(c, { x, duration: 0.3 }); else if (gsap()) gsap().set(c, { x, y: 0 }); else c.style.transform = `translateX(${x}px)`;
      });
      if (gsap()) gsap().set(crown, { x: xOf(slots[crownAt]) - crown.offsetWidth / 2 });
    }

    async function play() {
      go.disabled = true; canPick = false;
      const g = gsap();
      crownAt = Math.floor(Math.random() * 3);
      layout();
      speak('Смотри, где корона!');
      // показываем корону, потом накрываем
      g.set(cups[crownAt], { y: -120 });
      g.set(crown, { opacity: 1 });
      await wait(1100);
      await g.to(cups[crownAt], { y: 0, duration: 0.35, ease: 'bounce.out' }).then();
      g.set(crown, { opacity: 0 });
      const swaps = 4 + round * 2, speed = Math.max(0.22, 0.5 - round * 0.06);
      for (let s = 0; s < swaps; s++) {
        let a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
        const ia = slots.indexOf(a), ib = slots.indexOf(b);
        slots[ia] = b; slots[ib] = a;
        sfx.whoosh();
        await Promise.all([
          g.to(cups[ia], { x: xOf(b) - cups[ia].offsetWidth / 2, keyframes: { y: [0, -50, 0] }, duration: speed, ease: 'power1.inOut' }).then(),
          g.to(cups[ib], { x: xOf(a) - cups[ib].offsetWidth / 2, keyframes: { y: [0, 30, 0] }, duration: speed, ease: 'power1.inOut' }).then()
        ]);
      }
      canPick = true;
      speak('Где корона?');
    }

    cups.forEach((c, i) => c.addEventListener('click', async () => {
      if (!canPick) return;
      canPick = false;
      const g = gsap();
      g.set(crown, { x: xOf(slots[crownAt]) - crown.offsetWidth / 2, opacity: 1 });
      await g.to(c, { y: -120, duration: 0.35, ease: 'power2.out' }).then();
      if (i === crownAt) { score++; sfx.fanfare(); burstAt(c, { particleCount: 60 }); speak('Жарайсың! Нашла!'); }
      else { sfx.boop(); speak('Почти! Вот она где!'); await g.to(cups[crownAt], { y: -120, duration: 0.35 }).then(); }
      root.querySelector('.c-score').textContent = score;
      await wait(1300);
      g.to(cups, { y: 0, duration: 0.3 });
      round++;
      if (round >= ROUNDS) {
        ctx.win({ title: 'Глазастая королева!', text: `Нашла корону ${score} раз из ${ROUNDS}.`, stars: score >= 4 ? 3 : score >= 2 ? 2 : 1, again: () => { round = 0; score = 0; root.querySelector('.c-score').textContent = 0; root.querySelector('.c-round').textContent = 1; go.disabled = false; } });
        return;
      }
      root.querySelector('.c-round').textContent = round + 1;
      go.disabled = false;
      go.querySelector('.btn-text').textContent = 'Дальше!';
    }));

    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => { layout(); gsap() && gsap().set(crown, { opacity: 0 }); });
    if (gsap() && !reduced()) gsap().from(table, { y: -80, opacity: 0, duration: 0.7, ease: 'bounce.out' });
    return () => window.removeEventListener('resize', onResize);
  }
};

function cupSVG(c) {
  return `<svg class="doodle" viewBox="0 0 100 120" aria-hidden="true"><path d="M14 8 H86 L74 112 H26Z" fill="${c}" stroke="#2A1340" stroke-width="5" stroke-linejoin="round"/>
    <path d="M10 8 H90" stroke="#2A1340" stroke-width="8" stroke-linecap="round"/><path d="M26 30 L32 96" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>
    <path d="M38 56 L50 44 L62 56 L50 68Z" fill="#FFC93C" stroke="#2A1340" stroke-width="3.5"/></svg>`;
}
