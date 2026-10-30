// Альбом «Как росла королева»: настоящая книжка, страницы переворачиваются.
import { h, btn, sayBtn, gsap, reduced } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

export function mount(root, { data }) {
  const photos = data.photos;
  const pages = [
    { kind: 'cover' },
    { kind: 'dedication' },
    ...photos.map((p, i) => ({ kind: 'photo', p, i })),
    { kind: 'end' }
  ];

  const stage = h('div.book-stage');
  const book = h('div.book');
  const inner = h('div.book-inner');
  book.append(inner);
  stage.append(book);
  const counter = h('span.book-count');
  const prev = btn({ icon: '◀', text: 'Назад', variant: 'ghost', onClick: () => flip(-1) });
  const next = btn({ icon: '▶', text: 'Дальше', variant: 'pink', onClick: () => flip(1) });
  const readBtn = sayBtn(() => readCurrent());
  const controls = h('div.book-controls', {}, prev, counter, readBtn, next);
  root.append(stage, controls);

  let mode = '', leaves = [], current = 0;

  function pageEl(pg) {
    const el = h(`div.page.page--${pg.kind}`);
    if (pg.kind === 'cover') {
      el.append(
        h('div.cover-crown', { html: doodle.crown() }),
        h('h2.cover-title', {}, 'Как росла королева'),
        h('p.hand.cover-sub', {}, 'Альбом Еркем, от 0 до 7'),
        h('div.cover-hearts', { html: doodle.heart() + doodle.sparkle() + doodle.heart({ fill: '#FFC93C' }) })
      );
    } else if (pg.kind === 'dedication') {
      el.append(h('p.hand.dedi', {}, 'Каждую страницу этой книжки я собирал для тебя. Листай медленно и улыбайся.'), h('p.hand.dedi-sign', {}, 'Твой брат Ералы'), h('span.dedi-swirl', { html: doodle.swirl() }));
    } else if (pg.kind === 'end') {
      el.append(h('div.end-seven', { html: doodle.seven() }), h('p.hand.end-txt', {}, 'Продолжение следует!'), h('p.end-kz.hand', {}, 'Сені жақсы көремін!'), h('span.end-heart', { html: doodle.heart() }));
    } else {
      const { p, i } = pg;
      const fig = h('figure.page-photo', { style: `--rot:${[-3, 2, -1.5, 3, -2.5, 1][i % 6]}deg` },
        h('img', { src: p.thumb, alt: p.note, loading: 'lazy', decoding: 'async' }),
        h('span.tape.tape--tl'), h('span.tape.tape--br'));
      el.append(fig);
      if (p.age) el.append(h('p.page-age', {}, p.age));
      el.append(h('p.hand.page-note', {}, p.note));
      el.append(h('span.page-doodle', { html: [doodle.heart(), doodle.star(), doodle.sparkle(), doodle.flower()][i % 4] }));
    }
    return el;
  }

  function build() {
    const spread = window.innerWidth >= 820 && window.innerHeight >= 560;
    const m = spread ? 'spread' : 'single';
    if (m === mode && leaves.length) return;
    const atPage = mode === 'spread' ? current * 2 : current;
    mode = m;
    inner.innerHTML = '';
    book.className = `book book--${mode}`;
    leaves = [];
    const n = spread ? Math.ceil(pages.length / 2) : pages.length;
    for (let i = 0; i < n; i++) {
      const leaf = h('div.leaf');
      const front = h('div.face.front'), back = h('div.face.back');
      if (spread) {
        front.append(pageEl(pages[i * 2]));
        if (pages[i * 2 + 1]) back.append(pageEl(pages[i * 2 + 1]));
      } else {
        front.append(pageEl(pages[i]));
      }
      leaf.append(front, back);
      inner.append(leaf);
      leaves.push(leaf);
    }
    current = Math.min(spread ? Math.floor(atPage / 2) : atPage, leaves.length);
    layout(false);
  }

  function layout(animate, dir) {
    leaves.forEach((leaf, i) => {
      const flipped = i < current;
      leaf.style.zIndex = flipped ? i + 1 : leaves.length - i + 1;
      const target = flipped ? -180 : 0;
      const g = gsap();
      const isMoving = animate && ((dir > 0 && i === current - 1) || (dir < 0 && i === current));
      // в режиме одной страницы перевёрнутые листы прячем, чтобы не торчали слева
      const hide = mode === 'single' && flipped;
      leaf.style.visibility = hide && !isMoving ? 'hidden' : 'visible';
      if (g && isMoving && !reduced()) {
        leaf.style.zIndex = leaves.length + 5;
        leaf.style.visibility = 'visible';
        g.to(leaf, { rotationY: target, duration: 0.9, ease: 'power2.inOut', onComplete: () => { leaf.style.zIndex = flipped ? i + 1 : leaves.length - i + 1; if (hide) leaf.style.visibility = 'hidden'; } });
        g.fromTo(leaf.querySelectorAll('.face'), { '--shade': 0 }, { '--shade': 0.35, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut' });
      } else if (g) g.set(leaf, { rotationY: target });
      else leaf.style.transform = `rotateY(${target}deg)`;
    });
    if (mode === 'spread') {
      const shift = current === 0 ? -25 : current >= leaves.length ? 25 : 0;
      gsap() ? gsap().to(inner, { xPercent: shift, duration: animate ? 0.9 : 0, ease: 'power2.inOut' }) : (inner.style.transform = `translateX(${shift}%)`);
    }
    prev.disabled = current === 0;
    next.disabled = current >= (mode === 'spread' ? leaves.length : leaves.length - 1);
    const total = mode === 'spread' ? leaves.length : leaves.length - 1;
    counter.textContent = `${current} / ${total}`;
  }

  function flip(d) {
    const max = mode === 'spread' ? leaves.length : leaves.length - 1;
    const nc = Math.max(0, Math.min(max, current + d));
    if (nc === current) { sfx.boop(); return; }
    current = nc;
    sfx.flip();
    layout(true, d);
  }

  function visiblePages() {
    if (mode === 'spread') return [pages[current * 2 - 1], pages[current * 2]].filter(Boolean);
    return [pages[current]];
  }
  function readCurrent() {
    return visiblePages().map((pg) => {
      if (!pg) return '';
      if (pg.kind === 'cover') return 'Как росла королева. Альбом Еркем, от нуля до семи.';
      if (pg.kind === 'dedication') return 'Каждую страницу этой книжки я собирал для тебя. Листай медленно и улыбайся. Твой брат Ералы.';
      if (pg.kind === 'end') return 'Продолжение следует! Сені жақсы көремін!';
      return `${pg.p.age ? pg.p.age + '. ' : ''}${pg.p.note}`;
    }).join(' ');
  }

  // Листаем касанием края, свайпом или стрелками.
  let sx = null;
  book.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  book.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { flip(dx < 0 ? 1 : -1); return; }
    const r = book.getBoundingClientRect();
    flip(e.clientX > r.left + r.width / 2 ? 1 : -1);
  });
  const onKey = (e) => { if (e.key === 'ArrowRight') flip(1); if (e.key === 'ArrowLeft') flip(-1); };
  document.addEventListener('keydown', onKey);
  let rt;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(build, 150); };
  window.addEventListener('resize', onResize);
  build();
  setTimeout(() => speak('Как росла королева. Листай страницы!'), 600);

  return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
}
