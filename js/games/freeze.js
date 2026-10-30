// «Замри!»: танцуем, пока играет музыка. Музыка обрывается — все замирают.
import { h, btn, hint, playerChips, rand, gsap, reduced } from '../core/ui.js';
import { sfx, music, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const names = ['Еркем', ...data.quiz.players];
    const floor = h('div.disco');
    floor.innerHTML = `<div class="disco-beams"><span></span><span></span><span></span><span></span></div>
      <div class="disco-ball"><div class="disco-ball-tiles"></div></div>
      <div class="disco-floor"></div>
      <div class="disco-label"></div>`;
    const label = floor.querySelector('.disco-label');
    const freezeBig = h('div.freeze-big', { 'aria-live': 'assertive' }, h('span', {}, 'ЗАМРИ!'));
    floor.append(freezeBig);

    const players = playerChips(names, { onChange: (st) => checkWinner(st) });
    const tip = hint('Кто пошевелился, когда все замерли? Нажми на его имя.');
    const startBtn = btn({ icon: '🎵', text: 'Музыка!', variant: 'gold', size: 'xl', onClick: () => go() });
    const partyBtn = btn({ icon: '🪩', text: 'Просто дискотека', variant: 'ghost', size: 'sm', onClick: () => party() });
    const controls = h('div.center-col', {}, h('div.choose-row', {}, startBtn, partyBtn), tip, players);
    root.append(floor, controls);

    let timer = null, state = 'idle';
    label.textContent = 'Нажми «Музыка!»';

    function go() {
      unlock();
      clearTimeout(timer);
      state = 'dance';
      floor.classList.add('is-on'); floor.classList.remove('is-frozen');
      freezeBig.classList.remove('show');
      label.textContent = 'Танцуем!';
      music.play('disco');
      startBtn.disabled = true;
      const t = rand(6, 15) * 1000;
      timer = setTimeout(freeze, t);
    }

    function freeze() {
      state = 'frozen';
      music.stop(true);
      floor.classList.add('is-frozen');
      freezeBig.classList.add('show');
      label.textContent = '';
      speak('Замри!', { rate: 1.1, pitch: 1.3 });
      if (gsap() && !reduced()) gsap().fromTo(freezeBig.firstChild, { scale: 3, rotation: -12 }, { scale: 1, rotation: -4, duration: 0.35, ease: 'back.out(3)' });
      timer = setTimeout(() => {
        freezeBig.classList.remove('show');
        label.textContent = 'Кто пошевелился?';
        startBtn.disabled = false;
        startBtn.querySelector('.btn-text').textContent = 'Дальше!';
        speak('Кто пошевелился? Нажми на имя. Потом — дальше!');
      }, 3500);
    }

    function party() {
      unlock();
      clearTimeout(timer);
      state = 'party';
      floor.classList.add('is-on'); floor.classList.remove('is-frozen');
      freezeBig.classList.remove('show');
      label.textContent = 'Дискотека!';
      music.play('disco');
      startBtn.disabled = false;
    }

    function checkWinner(st) {
      const left = st.filter((p) => p.on);
      if (left.length === 1 && state !== 'idle') {
        clearTimeout(timer);
        music.stop();
        state = 'idle';
        const w = left[0].name;
        ctx.win({ title: `${w} — чемпион!`, text: 'Лучше всех замирает!', stars: 3, again: () => {
          players.state.forEach((p) => { p.on = true; p.el.setAttribute('aria-pressed', 'true'); });
          startBtn.querySelector('.btn-text').textContent = 'Музыка!';
          floor.classList.remove('is-on', 'is-frozen');
          label.textContent = 'Нажми «Музыка!»';
        } });
      } else if (state !== 'idle' && st.some((p) => !p.on)) {
        sfx.boop();
      }
    }

    return () => clearTimeout(timer);
  }
};
