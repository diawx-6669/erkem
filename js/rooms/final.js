// Финал: семь коробочек-пожеланий и главные слова.
import { h, btn, sayBtn, gsap, reduced, salute, sticker, burstAt } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music } from '../core/audio.js';
import { speak } from '../core/speech.js';
import { photoByName } from '../core/data.js';

const COLORS = ['#FF5FA2', '#3DDBB0', '#FFC93C', '#C2185B', '#FF9CC6', '#3DDBB0', '#FF5FA2'];

export function mount(root, { data }) {
  const wishes = (data.games.wishes || []).slice(0, 7);
  root.append(h('div.hint', {}, sayBtn('Тут семь коробочек. В каждой пожелание от брата. Открой все семь!'), h('p', {}, 'Открой все 7 коробочек')));
  const grid = h('div.wishes');
  let opened = 0;
  wishes.forEach((w, i) => {
    const b = h('button.wish', { type: 'button', style: `--rot:${[-4, 3, -2, 4, -3, 2, -1][i]}deg`, 'aria-label': `Коробочка ${i + 1}` });
    b.innerHTML = `<span class="wish-gift">${doodle.gift({ color: COLORS[i], ribbon: i % 2 ? '#FF5FA2' : '#FFC93C' })}</span><span class="wish-num">${i + 1}</span>`;
    const txt = h('p.wish-text.hand', {}, w);
    b.append(txt);
    b.addEventListener('click', () => {
      if (b.classList.contains('is-open')) { speak(w); return; }
      b.classList.add('is-open'); opened++;
      sfx.pop(); burstAt(b, { particleCount: 25 });
      const g = gsap();
      if (g && !reduced()) {
        g.timeline().to(b.querySelector('.wish-gift'), { y: -30, scale: 1.2, opacity: 0, rotation: 20, duration: 0.35 })
          .fromTo(txt, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
      }
      speak(w);
      if (opened === wishes.length) setTimeout(grand, 1800);
    });
    grid.append(b);
  });
  root.append(grid);

  const love = h('section.love', {},
    h('div.love-photos', {},
      sticker(photoByName(data, '16-red'), { rot: -5, tape: 'top', cls: 'love-a' }),
      sticker(photoByName(data, '08-selfie'), { rot: 6, tape: 'tl', cls: 'love-b' })
    ),
    h('h2.love-title', {}, 'Я люблю тебя, Еркем!'),
    h('p.love-kz.hand', {}, 'Сені жақсы көремін!'),
    h('p.love-sign.hand', {}, 'Твой брат Ералы'),
    h('div.love-heart', { html: doodle.heart() }),
    h('div.win-actions', {}, sayBtn('Я люблю тебя, Еркем! Сені жақсы көремін! Твой брат Ералы.'),
      btn({ icon: '🎂', text: 'Песня', variant: 'gold', onClick: () => { music.stop(true); setTimeout(() => music.play('birthday'), 120); } }))
  );
  root.append(love);

  function grand() {
    love.classList.add('is-on');
    love.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    salute(); music.play('birthday');
    const g = gsap();
    if (g && !reduced()) {
      g.from(love.querySelectorAll('.sticker'), { scale: 0, rotation: (i) => (i ? 40 : -40), stagger: 0.2, ease: 'back.out(1.8)', duration: 0.7 });
      g.from(love.querySelector('.love-title'), { scale: 0.3, opacity: 0, ease: 'elastic.out(1,0.5)', duration: 1.2, delay: 0.3 });
      g.to(love.querySelector('.love-heart'), { scale: 1.15, repeat: -1, yoyo: true, duration: 0.45, ease: 'sine.inOut' });
    }
    setTimeout(() => speak('Я люблю тебя, Еркем! Сені жақсы көремін! Твой брат Ералы.'), 1200);
  }
  // Если пожеланий почему-то нет, сразу показываем финал.
  if (!wishes.length) grand();
  else love.classList.add('is-waiting');
  return () => {};
}
