// Секретная комната: открывается за 7 звёзд. Письмо от брата и видео.
import { h, btn, sayBtn, gsap, reduced, salute, sticker } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music } from '../core/audio.js';
import { photoByName } from '../core/data.js';

export const LETTER = [
  'Дорогая Еркем!',
  'Сегодня тебе 7 лет. Когда ты родилась, ты была совсем крошечной, в розовом чепчике, а я лежал рядом и смотрел на тебя.',
  'Теперь ты танцуешь, смеёшься громче всех и иногда держишь меня за волосы.',
  'Я построил для тебя этот дворец, потому что ты — наша настоящая королева.',
  'Будь смелой, доброй и весёлой. Танцуй сколько хочешь. А если что-то случится, я всегда рядом.',
  'Туған күніңмен, қарындасым! Сені жақсы көремін!'
];

export function mount(root, { store, data }) {
  const total = store.totalStars();
  if (total < 7) {
    root.append(h('div.locked-room', {},
      h('div.locked-icon', { html: doodle.lock() }),
      h('p.hand.locked-txt', {}, `Эта дверь откроется, когда будет 7 звёзд. Сейчас у тебя ${total}.`),
      h('div.win-actions', {}, sayBtn(`Эта дверь откроется, когда будет семь звёзд. Сейчас у тебя ${total}. Играй в игры и собирай звёзды!`),
        btn({ icon: '🎮', text: 'Играть', variant: 'pink', onClick: () => { location.hash = '#/hall'; } }))
    ));
    return () => {};
  }

  const env = h('button.envelope', { type: 'button', 'aria-label': 'Открыть письмо' });
  env.innerHTML = `<div class="env-back"></div><div class="env-letter"><span class="hand">Для Еркем</span></div><div class="env-front"></div><div class="env-flap"></div><div class="env-heart">${doodle.heart()}</div>`;
  const prompt = h('div.hint', {}, sayBtn('Тут письмо от брата. Нажми на конверт!'), h('p', {}, 'Нажми на конверт'));
  const letter = h('article.letter', {},
    ...LETTER.map((t, i) => h(i === 0 ? 'h2.hand.letter-hi' : 'p.hand', {}, t)),
    h('p.hand.letter-sign', {}, 'Твой брат Ералы'),
    h('div.letter-photo', {}, sticker(photoByName(data, '14-beach-night'), { rot: 4, tape: 'top' })),
    h('div.letter-say', {}, sayBtn(() => LETTER.join(' ') + ' Твой брат Ералы.'))
  );
  const videoBox = h('section.video-box', {},
    h('h2.section-title', {}, 'Видео для королевы'),
    videoPlayer()
  );
  const content = h('div.secret-content', {}, letter, videoBox);
  root.append(h('div.secret-stage', {}, env, prompt), content);

  let opened = false;
  env.addEventListener('click', () => {
    if (opened) return; opened = true;
    sfx.magic();
    prompt.remove();
    const g = gsap();
    const done = () => { content.classList.add('is-on'); salute(); music.play('birthday'); content.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };
    if (!g || reduced()) { env.classList.add('is-open'); done(); return; }
    g.timeline()
      .to(env.querySelector('.env-heart'), { scale: 0, rotation: 90, duration: 0.3 })
      .to(env.querySelector('.env-flap'), { rotationX: 180, duration: 0.5, ease: 'power2.inOut' })
      .set(env.querySelector('.env-flap'), { zIndex: 0 })
      .to(env.querySelector('.env-letter'), { y: '-70%', duration: 0.6, ease: 'back.out(1.5)' })
      .to(env, { scale: 0.6, opacity: 0, y: -60, duration: 0.5, delay: 0.4, onComplete: () => { env.parentElement.style.display = 'none'; done(); } });
  });
  return () => {};
}

export function videoPlayer() {
  const land = window.matchMedia('(orientation: landscape)').matches;
  const v = h('video.queen-video', { controls: true, playsinline: true, preload: 'metadata', poster: 'photos/thumbs/16-red-carpet-white-dress.jpg' });
  const set = (tv) => {
    v.src = tv ? 'erkem-video-tv.mp4' : 'erkem-video.mp4';
    v.classList.toggle('is-tv', tv);
    a.setAttribute('aria-pressed', String(!tv)); b.setAttribute('aria-pressed', String(tv));
  };
  const a = btn({ icon: '📱', text: 'Телефон', variant: 'ghost', size: 'sm', onClick: () => set(false) });
  const b = btn({ icon: '📺', text: 'Телевизор', variant: 'ghost', size: 'sm', onClick: () => set(true) });
  const wrap = h('div.video-wrap', {}, v, h('div.video-switch', {}, a, b));
  set(land);
  return wrap;
}
