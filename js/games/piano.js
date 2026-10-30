// «Королевское пианино»: свободная игра и «Песенка» с подсветкой следующей клавиши.
import { h, btn, gsap, reduced, burstAt } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { playNote, sfx, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

const KEYS = [
  { m: 67, name: 'соль', c: '#8C5BFF' }, { m: 69, name: 'ля', c: '#4F8DFF' }, { m: 71, name: 'си', c: '#22C3D6' }, { m: 72, name: 'до', c: '#2FC49C' },
  { m: 74, name: 'ре', c: '#FFC93C' }, { m: 76, name: 'ми', c: '#FFB020' }, { m: 77, name: 'фа', c: '#FF7A45' }, { m: 79, name: 'соль', c: '#E94C8F' }
];
// «С днём рождения тебя» — номера клавиш
const SONG = [0, 0, 1, 0, 3, 2, 0, 0, 1, 0, 4, 3, 0, 0, 7, 5, 3, 2, 1, 6, 6, 5, 3, 4, 3];
const KEYMAP = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];

export default {
  mount(ctx) {
    const { root } = ctx;
    let mode = 'free', pos = 0, presses = 0;
    const modeRow = h('div.choose-row');
    const freeB = btn({ icon: '🎹', text: 'Играю сама', variant: 'ghost', size: 'sm', onClick: () => setMode('free') });
    const songB = btn({ icon: '🎂', text: 'Песенка', variant: 'ghost', size: 'sm', onClick: () => setMode('song') });
    modeRow.append(freeB, songB);
    const status = h('p.piano-status.hand');
    const notesLayer = h('div.piano-notes', { 'aria-hidden': 'true' });
    const board = h('div.piano');
    const keys = KEYS.map((k, i) => {
      const b = h('button.pkey', { type: 'button', style: `--c:${k.c}`, 'aria-label': k.name }, h('span.pk-gem'), h('span.pk-name', {}, k.name));
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(i); });
      board.append(b);
      return b;
    });
    root.append(h('div.center-col', {}, modeRow, status), h('div.piano-wrap', {}, notesLayer, board));

    function setMode(m) {
      unlock();
      mode = m; pos = 0;
      freeB.setAttribute('aria-pressed', String(m === 'free')); songB.setAttribute('aria-pressed', String(m === 'song'));
      status.textContent = m === 'song' ? 'Нажимай на светящуюся клавишу!' : 'Играй что хочешь!';
      if (m === 'song') speak('Нажимай на светящуюся клавишу, и получится песенка!');
      highlight();
    }
    function highlight() { keys.forEach((k, i) => k.classList.toggle('is-next', mode === 'song' && SONG[pos] === i)); }

    function press(i) {
      const k = KEYS[i];
      playNote(k.m, 0.7);
      const el = keys[i];
      el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      flyNote(el, k.c);
      presses++;
      if (mode === 'song') {
        if (SONG[pos] === i) {
          pos++;
          if (pos >= SONG.length) {
            highlight();
            burstAt(board, { particleCount: 90, spread: 110 });
            ctx.win({ title: 'Ты сыграла песенку!', text: 'С днём рождения, королева!', stars: 3, again: () => setMode('song') });
            pos = 0;
            return;
          }
          highlight();
        } else {
          keys[SONG[pos]].classList.remove('wiggle'); void keys[SONG[pos]].offsetWidth; keys[SONG[pos]].classList.add('wiggle');
        }
      } else if (presses === 20) ctx.award(1);
    }

    function flyNote(el, color) {
      if (reduced() || !gsap()) return;
      const r = el.getBoundingClientRect(), pr = notesLayer.getBoundingClientRect();
      const n = h('span.fly-note', { html: `<svg viewBox="0 0 40 50" class="doodle"><path d="M14 40 V8 L34 4 V34" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="9" cy="40" rx="8" ry="6" fill="${color}"/><ellipse cx="29" cy="35" rx="8" ry="6" fill="${color}"/></svg>` });
      notesLayer.append(n);
      gsap().fromTo(n, { x: r.left - pr.left + r.width / 2 - 18, y: r.top - pr.top, scale: 0.4, opacity: 1, rotation: -20 },
        { y: `-=${140 + Math.random() * 80}`, x: `+=${Math.random() * 60 - 30}`, scale: 1.2, opacity: 0, rotation: 20, duration: 1.2, ease: 'power1.out', onComplete: () => n.remove() });
    }

    const kd = (e) => { const i = KEYMAP.indexOf(e.key.toLowerCase()); if (i >= 0 && !e.repeat) press(i); };
    document.addEventListener('keydown', kd);
    setMode('free');
    if (gsap() && !reduced()) gsap().from(board, { y: 60, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' });
    return () => document.removeEventListener('keydown', kd);
  }
};
