// Вход во дворец: подарок → лента → крышка → корона падает на фото → салют.
import { h, btn, sayBtn, sticker, gsap, reduced, salute, confetti, wait } from '../core/ui.js';
import { doodle, scatter } from '../core/doodles.js';
import { sfx, music, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';
import { photoByName } from '../core/data.js';

const DECREE = [
  'Каждый день танцевать.',
  'Смеяться громко и часто.',
  'Брату Ералы — слушаться королеву. Хотя бы иногда.',
  'Маме и папе — обнимать королеву утром и вечером.',
  'Сестре — делиться с королевой секретами.',
  'Всем — называть её «Ваше Величество».',
  'Розовый объявляется главным цветом дворца.'
];

export function mount(app, { data, store }) {
  app.className = 'screen screen--intro';
  const queen = photoByName(data, '00-queen');

  const stage = h('div.intro-stage');
  const deco = h('div.intro-deco', { html: scatter(['sparkle', 'heart', 'star', 'sparkle'], 10, 7) });

  const note = h('div.intro-note', {},
    h('p.hand', {}, 'Еркем, это тебе!'),
    h('span.intro-arrow', { html: doodle.arrow() })
  );

  const gift = h('button.gift', { type: 'button', 'aria-label': 'Открыть подарок' });
  gift.innerHTML = `
    <div class="gift-rays" aria-hidden="true"></div>
    <div class="gift-reveal">
      <div class="gift-crown">${doodle.crown()}</div>
    </div>
    <div class="gift-box"><span class="ribbon-v"></span><span class="gift-dots"></span></div>
    <div class="gift-lid"><span class="ribbon-v"></span>
      <div class="gift-bow">
        <svg viewBox="0 0 160 90" aria-hidden="true">
          <path class="loop-l" d="M80 58 C56 18 14 16 18 44 C21 66 56 70 80 58Z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
          <path class="loop-r" d="M80 58 C104 18 146 16 142 44 C139 66 104 70 80 58Z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/>
          <path d="M40 40 q10 -10 22 -4 M98 36 q12 -6 22 4" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
          <ellipse class="knot" cx="80" cy="58" rx="13" ry="12" fill="#FFB020" stroke="#5B1A4A" stroke-width="5"/>
        </svg>
      </div>
    </div>`;
  const reveal = gift.querySelector('.gift-reveal');
  const photo = sticker(queen, { rot: -3, tape: 'tl tr', cls: 'intro-photo', big: true, eager: true });
  reveal.prepend(photo);
  photo.append(h('span.photo-glints', { 'aria-hidden': 'true' }, h('span.twinkle'), h('span.twinkle.t2'), h('span.twinkle.t3'), h('span.twinkle')));

  const tapHint = h('div.intro-tap', {}, sayBtn('Еркем, это тебе! Нажми на подарок.'), h('span', {}, 'Нажми на подарок'));

  const title = h('div.intro-title', { 'aria-hidden': 'true' },
    h('p.it-small.hand', {}, 'Её Величество'),
    h('p.it-mid', {}, 'королева'),
    h('h1.it-name', {}, ...[...'Еркем'].map((c, i) => h('span.ch', { style: `--i:${i}` }, c))),
    h('div.it-age', {}, h('span.it-seven', { html: doodle.seven() }), h('span.it-age-txt', {}, 'лет')),
    h('p.it-kz.hand', {}, 'Туған күніңмен!')
  );
  const srTitle = h('h1.sr-only', {}, 'Её Величество королева Еркем, 7 лет');

  const go = btn({ icon: doodle.crown(), text: 'Во дворец', variant: 'gold', size: 'xl', cls: 'intro-go', onClick: () => { location.hash = '#/hall'; } });
  const decree = buildDecree();
  const after = h('div.intro-after', {}, title, h('div.intro-actions', {}, sayBtn('Её Величество королева Еркем, семь лет! Туған күніңмен!'), go), decree);

  stage.append(deco, note, gift, tapHint);
  app.append(srTitle, stage, after);

  if (store.get('seenIntro')) {
    app.append(h('a.intro-skip', { href: '#/hall' }, 'Сразу во дворец'));
  }

  const g = gsap();
  let opened = false;
  let raysSpin = null;
  // Подарок зовёт: подпрыгивает раз в пару секунд.
  let idle = null;
  if (g && !reduced()) {
    g.from(gift, { y: -window.innerHeight, rotation: -12, duration: 1, ease: 'bounce.out', delay: 0.15 });
    g.from(note, { opacity: 0, x: -30, duration: 0.6, delay: 1 });
    idle = g.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.6 })
      .to(gift, { y: -18, scaleY: 1.04, duration: 0.18, ease: 'power2.out' })
      .to(gift, { y: 0, scaleY: 0.96, duration: 0.18, ease: 'power2.in' })
      .to(gift, { rotation: -4, scaleY: 1, duration: 0.08 })
      .to(gift, { rotation: 4, duration: 0.08, yoyo: true, repeat: 3 })
      .to(gift, { rotation: 0, duration: 0.08 });
  }

  gift.addEventListener('click', async () => {
    if (opened) return;
    opened = true;
    unlock();
    idle && idle.kill();
    store.set('seenIntro', true);
    tapHint.remove();
    await openSequence();
  });

  async function openSequence() {
    const lid = gift.querySelector('.gift-lid');
    const box = gift.querySelector('.gift-box');
    const bow = gift.querySelector('.gift-bow');
    const crown = gift.querySelector('.gift-crown');
    const rays = gift.querySelector('.gift-rays');
    const finishText = () => {
      after.classList.add('is-on');
      speak('С днём рождения, королева Еркем!');
    };

    if (!g || reduced()) {
      lid.remove(); box.remove(); note.remove();
      title.querySelector('.it-name').classList.add('is-waving');
      gift.classList.add('is-open');
      sfx.fanfare(); music.play('birthday'); confetti({ particleCount: 80, spread: 90 });
      finishText();
      return;
    }

    // 1. барабанная дробь, подарок трясётся всё сильнее
    g.to(note, { opacity: 0, y: -20, duration: 0.3 });
    const shake = g.to(gift, { rotation: 5, x: 3, duration: 0.06, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    g.to(gift, { scale: 1.08, duration: 1.2, ease: 'power1.in' });
    await sfx.drumroll(1.2);
    shake.kill();
    g.set(gift, { rotation: 0, x: 0 });

    // 2. лента развязывается
    sfx.whoosh();
    await g.timeline()
      .to(bow.querySelector('.loop-l'), { rotation: -70, x: -40, y: 30, opacity: 0, transformOrigin: '80px 58px', duration: 0.45, ease: 'power2.in' }, 0)
      .to(bow.querySelector('.loop-r'), { rotation: 70, x: 40, y: 30, opacity: 0, transformOrigin: '80px 58px', duration: 0.45, ease: 'power2.in' }, 0)
      .to(bow.querySelector('.knot'), { scale: 0, transformOrigin: '80px 58px', duration: 0.3 }, 0.2)
      .to(gift.querySelectorAll('.ribbon-v'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.35, ease: 'power2.in' }, 0.15)
      .then();

    // 3. крышка улетает, из коробки бьёт свет
    sfx.magic();
    g.set(rays, { opacity: 1 });
    await g.timeline()
      .to(lid, { y: -window.innerHeight * 0.7, x: 160, rotation: 38, duration: 0.8, ease: 'power3.out' }, 0)
      .to(lid, { opacity: 0, duration: 0.3 }, 0.5)
      .fromTo(rays, { scale: 0.2 }, { scale: 1.4, duration: 0.8, ease: 'power2.out' }, 0)
      .then();
    raysSpin = g.to(rays, { rotation: '+=360', duration: 24, ease: 'none', repeat: -1 });

    // 4. фото поднимается из коробки, коробка уходит вниз
    gift.classList.add('is-open');
    g.set(reveal, { visibility: 'visible' });
    sfx.sparkle();
    await g.timeline()
      .fromTo(photo, { y: 140, scale: 0.35, rotation: 0 }, { y: 0, scale: 1, rotation: -3, duration: 0.9, ease: 'back.out(1.4)' }, 0)
      .to(box, { y: 260, opacity: 0, duration: 0.7, ease: 'power2.in' }, 0.1)
      .then();

    // 5. корона падает на голову
    g.set(crown, { visibility: 'visible' });
    await g.fromTo(crown, { y: -window.innerHeight, rotation: -30 }, { y: 0, rotation: -8, duration: 0.9, ease: 'bounce.out' }).then();
    sfx.ding();
    g.fromTo(photo, { scaleY: 0.94 }, { scaleY: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
    salute();
    music.play('birthday');

    // 6. титул
    after.classList.add('is-on');
    const tl = g.timeline();
    tl.from(title.querySelector('.it-small'), { opacity: 0, y: 20, duration: 0.4 })
      .from(title.querySelector('.it-mid'), { opacity: 0, y: 20, duration: 0.4 }, '-=0.2')
      .from(title.querySelectorAll('.ch'), { y: -120, opacity: 0, rotation: () => (Math.random() * 40 - 20), stagger: 0.08, ease: 'bounce.out', duration: 0.7 }, '-=0.1')
      .from(title.querySelector('.it-age'), { scale: 3, opacity: 0, rotation: 25, duration: 0.35, ease: 'power4.in', onComplete: () => sfx.stamp() })
      .from(title.querySelector('.it-kz'), { opacity: 0, x: -20, duration: 0.5 })
      .from(after.querySelector('.intro-actions'), { opacity: 0, y: 30, duration: 0.5 });
    tl.call(() => title.querySelector('.it-name').classList.add('is-waving'));
    await wait(500);
    finishText();
    await wait(2500);
    g.to(rays, { opacity: 0.35, duration: 1 });
  }

  return () => { idle && idle.kill(); raysSpin && raysSpin.kill(); };
}

function buildDecree() {
  const d = h('article.decree');
  d.append(
    h('div.decree-roll.top'),
    h('h2.decree-title', {}, 'Королевский указ'),
    h('p.decree-lead', {}, 'С 30 октября Еркем — королева нашего дома. Королева повелевает:'),
    h('ol.decree-list', {}, ...DECREE.map((t) => h('li', {}, t))),
    h('div.decree-sign', {}, h('span.hand', {}, 'Подписал брат Ералы'), h('span.decree-seal', { html: doodle.seal() })),
    h('div.decree-roll.bottom')
  );
  d.querySelector('.decree-title').after(sayBtn(() => 'Королевский указ. С 30 октября Еркем — королева нашего дома. Королева повелевает: ' + DECREE.join(' ') + ' Подписал брат Ералы.', { cls: 'decree-say' }));
  return d;
}
