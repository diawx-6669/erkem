// «Горячая картошка»: передаём телефон под музыку. У кого «бахнет» — получает задание.
import { h, btn, hint, rand, drawPrize, revealCard, pick, gsap, reduced, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const stage = h('div.potato-stage');
    const potato = h('button.potato', { type: 'button', 'aria-label': 'Картошка', html: doodle.potato() });
    const steam = h('div.steam', { 'aria-hidden': 'true' }, h('span'), h('span'), h('span'));
    const bang = h('div.bang', { 'aria-hidden': 'true' }, h('span', {}, 'БАХ!'));
    stage.append(steam, potato, bang);
    const tip = hint('Нажми «Поехали!» и передавайте телефон по кругу. Быстрее, она горячая!');
    const go = btn({ icon: '🥔', text: 'Поехали!', variant: 'gold', size: 'xl', onClick: () => start() });
    root.append(stage, h('div.center-col', {}, go, tip));

    let timer = null, tickT = null, rounds = 0, running = false;

    function start() {
      if (running) return;
      unlock();
      running = true; go.disabled = true;
      stage.classList.add('is-hot'); stage.classList.remove('is-bang');
      music.play('potato');
      tip.set('Передавай! Передавай!');
      speak('Передавай!');
      const total = rand(8, 22) * 1000;
      const t0 = performance.now();
      const tick = () => {
        const k = (performance.now() - t0) / total;
        sfx.tick();
        stage.style.setProperty('--heat', Math.min(1, k).toFixed(2));
        tickT = setTimeout(tick, Math.max(90, 520 - k * 430));
      };
      tick();
      timer = setTimeout(boom, total);
    }

    async function boom() {
      clearTimeout(tickT);
      music.stop(true);
      sfx.boom();
      running = false;
      stage.classList.remove('is-hot'); stage.classList.add('is-bang');
      if (gsap() && !reduced()) {
        gsap().fromTo(bang.firstChild, { scale: 0.2, rotation: -20 }, { scale: 1, rotation: -6, duration: 0.4, ease: 'back.out(3)' });
        gsap().fromTo(stage, { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(2, 0.2)' });
      }
      confetti({ particleCount: 120, spread: 120, startVelocity: 40, colors: ['#E0A85E', '#FFC93C', '#FFF6E0', '#FF5FA2'], origin: { y: 0.45 } });
      speak('Бах! У кого телефон — тот выполняет задание!');
      rounds++;
      await new Promise((r) => setTimeout(r, 1300));
      const useDare = Math.random() < 0.5 && (data.games.dare || []).length;
      const item = useDare ? { type: 'task', emoji: '🔥', text: pick(data.games.dare) } : drawPrize(data.prizes, { type: 'task' });
      await revealCard(item, { doneText: 'Готово!', kindText: 'Горячее задание' });
      ctx.award(rounds >= 3 ? 2 : 1);
      go.disabled = false;
      go.querySelector('.btn-text').textContent = 'Ещё раунд!';
      stage.classList.remove('is-bang');
      stage.style.setProperty('--heat', 0);
      tip.set('Ещё раунд? Нажми и передавай!');
    }

    return () => { clearTimeout(timer); clearTimeout(tickT); };
  }
};
