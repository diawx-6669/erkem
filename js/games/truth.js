// «Правда или задание: королевская версия» — только добрые вопросы и задания.
import { h, btn, sayBtn, shuffle, gsap, reduced, rand } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const names = ['Еркем', ...data.quiz.players];
    let truths = shuffle(data.games.truth || []), dares = shuffle(data.games.dare || []);
    let angle = 0, spinning = false, cards = 0, chosen = null;

    const ring = h('div.td-ring');
    names.forEach((n, i) => {
      const a = (i / names.length) * 360 - 90;
      ring.append(h('span.td-name', { style: `--a:${a}deg` }, h('span', {}, n)));
    });
    const crown = h('div.td-pointer', { html: doodle.crown() });
    const spinBtn = btn({ icon: '👑', text: 'Крутить', variant: 'gold', size: 'xl', onClick: () => spin() });
    const area = h('div.td-area');
    root.append(h('div.td-wrap', {}, ring, crown), h('div.center-col', {}, spinBtn), area);

    function spin() {
      if (spinning) return;
      unlock(); spinning = true; area.innerHTML = '';
      const pickI = Math.floor(Math.random() * names.length);
      const target = pickI * (360 / names.length);
      const turns = 3 + Math.floor(rand(0, 3));
      const cur = angle % 360;
      angle = angle - cur + turns * 360 + target;
      ring.querySelectorAll('.td-name').forEach((x) => x.classList.remove('on'));
      sfx.whoosh();
      const done = () => {
        spinning = false; chosen = names[pickI];
        ring.children[pickI].classList.add('on');
        sfx.ding(); choose();
      };
      if (gsap() && !reduced()) {
        let last = 0;
        gsap().to(crown, { rotation: angle, duration: 3.2, ease: 'power3.out', onUpdate() { const r = gsap().getProperty(crown, 'rotation'); if (Math.floor(r / 30) !== last) { last = Math.floor(r / 30); sfx.tick(); } }, onComplete: done });
      } else { crown.style.transform = `rotate(${angle}deg)`; done(); }
    }

    function choose() {
      area.innerHTML = '';
      area.append(h('p.hand.menu-title', {}, `${chosen}, что выбираешь?`),
        h('div.choose-row', {},
          btn({ icon: '💬', text: 'Правда', variant: 'pink', size: 'xl', onClick: () => card('truth') }),
          btn({ icon: '⭐', text: 'Задание', variant: 'mint', size: 'xl', onClick: () => card('dare') })));
      speak(`${chosen}, правда или задание?`);
    }

    function card(kind) {
      if (kind === 'truth' && !truths.length) truths = shuffle(data.games.truth || []);
      if (kind === 'dare' && !dares.length) dares = shuffle(data.games.dare || []);
      const text = kind === 'truth' ? truths.pop() : dares.pop();
      area.innerHTML = '';
      const c = h(`div.td-card.${kind}`, {}, h('p.td-kind', {}, kind === 'truth' ? 'Правда' : 'Задание'), h('p.td-text', {}, text), sayBtn(text));
      area.append(c, btn({ icon: '✅', text: 'Готово!', variant: 'gold', onClick: () => { sfx.fanfare(); area.innerHTML = ''; cards++; if (cards === 3) ctx.award(2); if (cards === 6) ctx.award(3); speak('Жарайсың! Крутим дальше!'); } }));
      if (gsap() && !reduced()) gsap().from(c, { rotationY: 180, scale: 0.5, duration: 0.7, ease: 'back.out(1.6)' });
      sfx.sparkle();
      speak(text);
    }

    return () => {};
  }
};
