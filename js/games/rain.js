// Главная игра: «Королевский дождь сюрпризов».
// Сверху падают подарки, звёзды, сердечки, конфеты и хитрые тучки.
// Пойманный подарок раскрывается: приз попадает в казну, задание — выполняем.
import { h, btn, revealCard, drawPrize, gsap, reduced, rand, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, music } from '../core/audio.js';
import { speak } from '../core/speech.js';

const ROUND = 45;
const KINDS = [
  { k: 'star', w: 22, pts: 1, svg: () => doodle.star() },
  { k: 'heart', w: 22, pts: 1, svg: () => doodle.heart() },
  { k: 'candy', w: 18, pts: 1, svg: () => doodle.candy() },
  { k: 'crown', w: 12, pts: 3, svg: () => doodle.crown() },
  { k: 'cloud', w: 14, pts: 0, svg: () => doodle.cloud() }
];
const GIFT_COLORS = [['#FF5FA2', '#FFC93C'], ['#3DDBB0', '#FF5FA2'], ['#C2185B', '#FFC93C'], ['#FFC93C', '#C2185B']];

function svgImage(markup) {
  return new Promise((resolve) => {
    // Убираем CSS-фильтр «дрожания»: в canvas он не нужен.
    const src = markup.replace('class="doodle ', 'class="').replace('<svg ', '<svg width="200" height="200" ');
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  });
}

export default {
  mount(ctx) {
    const { root, data, store } = ctx;
    const hud = h('div.rain-hud');
    const timeBar = h('div.rain-time', {}, h('span.rain-time-fill'));
    const score = h('div.rain-score', {}, h('span.rain-score-ico', { html: doodle.star() }), h('span.rain-score-num', {}, '0'));
    const gifts = h('div.rain-gifts', {}, h('span.rain-gifts-ico', { html: doodle.gift() }), h('span.rain-gifts-num', {}, '0'));
    hud.append(score, timeBar, gifts);
    const stage = h('div.rain-stage');
    const canvas = h('canvas.rain-canvas', { 'aria-label': 'Игровое поле: лови подарки короной' });
    stage.append(h('div.rain-sky', { 'aria-hidden': 'true' }), canvas);
    const startCard = h('div.rain-start', {},
      h('div.rain-start-art', { html: doodle.gift({ color: '#FF5FA2' }) + doodle.crown() }),
      h('p.hand', {}, '45 секунд. Лови всё, кроме тучек!'),
      btn({ icon: '▶', text: 'Начать!', variant: 'gold', size: 'xl', onClick: () => start() }),
      h('p.rain-keys', {}, 'На компьютере: стрелки ← →')
    );
    stage.append(startCard);
    root.append(hud, stage);

    const c2 = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      basket.w = Math.max(96, Math.min(180, W * 0.26));
      basket.y = H - basket.w * 0.6 - 30;
      basket.x = Math.min(Math.max(basket.x || W / 2, basket.w / 2), W - basket.w / 2);
    };

    const imgs = {};
    const basket = { x: 0, y: 0, w: 120, tx: null, squash: 0, wet: 0 };
    let items = [], parts = [], floaters = [];
    let running = false, paused = false, timeLeft = ROUND, pts = 0, raf = 0, last = 0, spawnT = 0, giftT = 0;
    let won = [];
    const keys = { l: false, r: false };

    const ready = Promise.all([
      ...KINDS.map(async (k) => { imgs[k.k] = await svgImage(k.svg()); }),
      ...GIFT_COLORS.map(async ([c, r], i) => { imgs['gift' + i] = await svgImage(doodle.gift({ color: c, ribbon: r })); }),
      (async () => { imgs.basket = await svgImage(basketSVG()); })()
    ]);

    function spawn(kind) {
      const isGift = kind === 'gift';
      const base = isGift ? null : pickKind();
      const size = Math.max(46, Math.min(78, W * 0.13)) * (isGift ? 1.25 : base.k === 'crown' ? 1.1 : 1);
      items.push({
        kind: isGift ? 'gift' : base.k, pts: isGift ? 2 : base.pts,
        img: isGift ? 'gift' + Math.floor(Math.random() * GIFT_COLORS.length) : base.k,
        x: rand(size / 2 + 6, W - size / 2 - 6), y: -size, size,
        vy: (H / 4.2) * (1 + (1 - timeLeft / ROUND) * 1.25) * rand(0.85, 1.15) * (isGift ? 0.8 : 1),
        rot: rand(-0.4, 0.4), vr: rand(-1.4, 1.4), sway: rand(0, Math.PI * 2)
      });
    }
    function pickKind() {
      const total = KINDS.reduce((a, k) => a + k.w, 0);
      let r = Math.random() * total;
      for (const k of KINDS) { r -= k.w; if (r <= 0) return k; }
      return KINDS[0];
    }

    function burst(x, y, color, n = 12) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = rand(80, 260);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 1, color, r: rand(3, 7), star: Math.random() < 0.4 });
      }
    }

    function frame(ts) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
      last = ts;
      if (paused) { draw(); return; }

      timeLeft -= dt;
      timeBar.firstChild.style.transform = `scaleX(${Math.max(0, timeLeft / ROUND)})`;
      timeBar.classList.toggle('is-ending', timeLeft < 8);
      if (timeLeft <= 0) { end(); return; }

      // корзина за пальцем или стрелками
      const speed = W * 1.6 * (basket.wet > 0 ? 0.45 : 1);
      if (keys.l) basket.tx = (basket.tx ?? basket.x) - speed * dt;
      if (keys.r) basket.tx = (basket.tx ?? basket.x) + speed * dt;
      if (basket.tx != null) {
        basket.tx = Math.min(Math.max(basket.tx, basket.w / 2), W - basket.w / 2);
        const follow = basket.wet > 0 ? 6 : 18;
        basket.x += (basket.tx - basket.x) * Math.min(1, follow * dt);
      }
      basket.squash *= Math.pow(0.02, dt);
      basket.wet = Math.max(0, basket.wet - dt);

      // появление
      const progress = 1 - timeLeft / ROUND;
      spawnT -= dt; giftT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = 0.95 - progress * 0.5; }
      if (giftT <= 0) { spawn('gift'); giftT = rand(5.5, 7.5); }

      // движение и ловля
      const bTop = basket.y + basket.w * 0.08, bL = basket.x - basket.w * 0.48, bR = basket.x + basket.w * 0.48;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;
        it.sway += dt * 2;
        it.x += Math.sin(it.sway) * 18 * dt;
        it.rot += it.vr * dt;
        if (it.y + it.size * 0.3 > bTop && it.y < bTop + basket.w * 0.25 && it.x > bL && it.x < bR) {
          items.splice(i, 1);
          catchItem(it);
          continue;
        }
        if (it.y - it.size > H) items.splice(i, 1);
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.life -= dt * 1.4;
        if (p.life <= 0) parts.splice(i, 1);
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i]; f.y -= 70 * dt; f.life -= dt * 1.2;
        if (f.life <= 0) floaters.splice(i, 1);
      }
      draw();
    }

    function catchItem(it) {
      basket.squash = 1;
      if (it.kind === 'cloud') {
        basket.wet = 1.6;
        sfx.boop();
        floaters.push({ x: it.x, y: basket.y - 10, text: 'Ой, дождик!', color: '#6C7BB8', life: 1 });
        for (let i = 0; i < 14; i++) parts.push({ x: it.x + rand(-30, 30), y: it.y, vx: rand(-30, 30), vy: rand(100, 260), life: 1, color: '#69A8E8', r: rand(2, 4) });
        return;
      }
      pts += it.pts;
      score.lastChild.textContent = pts;
      score.classList.remove('bump'); void score.offsetWidth; score.classList.add('bump');
      if (it.kind === 'gift') { openGift(it); return; }
      (it.kind === 'crown' ? sfx.star : sfx.ding)();
      burst(it.x, basket.y, it.kind === 'heart' ? '#FF5FA2' : it.kind === 'candy' ? '#3DDBB0' : '#FFC93C');
      floaters.push({ x: it.x, y: basket.y - 6, text: '+' + it.pts, color: '#C2185B', life: 1 });
    }

    async function openGift(it) {
      paused = true;
      sfx.pop();
      burst(it.x, basket.y, '#FFC93C', 24);
      const item = drawPrize(data.prizes, { isOnceWon: (id) => store.isOnceWon(id) || won.some((w) => w.id === id && w.once) });
      won.push(item);
      if (item.type === 'bonus') store.addCoupon(item, 'rain');
      gifts.lastChild.textContent = String(won.length);
      await revealCard(item);
      // пара секунд, чтобы снова взять корону
      floaters.push({ x: W / 2, y: H / 2, text: 'Продолжаем!', color: '#C2185B', life: 1.2, big: true });
      last = 0;
      setTimeout(() => { paused = false; }, 500);
    }

    function draw() {
      c2.clearRect(0, 0, W, H);
      for (const it of items) {
        const img = imgs[it.img];
        if (!img) continue;
        c2.save(); c2.translate(it.x, it.y); c2.rotate(it.rot);
        if (it.kind === 'gift') { c2.shadowColor = 'rgba(255,201,60,.9)'; c2.shadowBlur = 18; }
        c2.drawImage(img, -it.size / 2, -it.size / 2, it.size, it.size);
        c2.restore();
      }
      // корзина-корона
      const bw = basket.w, sq = basket.squash;
      c2.save();
      c2.translate(basket.x, basket.y + bw * 0.3);
      c2.scale(1 + sq * 0.12, 1 - sq * 0.14);
      if (basket.wet > 0) { c2.filter = 'saturate(.4) brightness(.9)'; }
      if (imgs.basket) c2.drawImage(imgs.basket, -bw / 2, -bw * 0.3, bw, bw * 0.6);
      c2.restore();
      c2.filter = 'none';
      if (basket.wet > 0) {
        const img = imgs.cloud;
        if (img) c2.drawImage(img, basket.x - bw * 0.35, basket.y - bw * 0.7, bw * 0.7, bw * 0.7);
      }
      for (const p of parts) {
        c2.globalAlpha = Math.max(0, p.life);
        c2.fillStyle = p.color;
        c2.beginPath();
        if (p.star) { drawStar(c2, p.x, p.y, p.r * 1.6); } else c2.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c2.fill();
      }
      c2.globalAlpha = 1;
      for (const f of floaters) {
        c2.globalAlpha = Math.max(0, Math.min(1, f.life));
        c2.font = `900 ${f.big ? 34 : 28}px Nunito, sans-serif`;
        c2.textAlign = 'center';
        c2.lineWidth = 6; c2.strokeStyle = '#fff'; c2.strokeText(f.text, f.x, f.y);
        c2.fillStyle = f.color; c2.fillText(f.text, f.x, f.y);
      }
      c2.globalAlpha = 1;
    }

    async function start() {
      await ready;
      resize();
      startCard.remove();
      stage.scrollIntoView({ behavior: 'smooth', block: 'end' });
      items = []; parts = []; floaters = []; won = [];
      pts = 0; timeLeft = ROUND; spawnT = 0.4; giftT = 2.5; last = 0;
      score.lastChild.textContent = '0'; gifts.lastChild.textContent = '0';
      basket.x = W / 2; basket.tx = W / 2;
      running = true; paused = false;
      music.play('disco');
      speak('Лови!');
      raf = requestAnimationFrame(frame);
    }

    function end() {
      running = false;
      cancelAnimationFrame(raf);
      music.stop();
      items = [];
      draw();
      const stars = pts >= 45 ? 3 : pts >= 22 ? 2 : 1;
      const bonuses = won.filter((w) => w.type === 'bonus');
      const tasks = won.filter((w) => w.type === 'task');
      const list = h('div.rain-summary');
      if (won.length) {
        if (bonuses.length) list.append(h('p.rs-head', {}, 'Призы в казне:'), h('ul.rs-list', {}, ...bonuses.map((b) => h('li', {}, `${b.emoji} ${b.text}`))));
        if (tasks.length) list.append(h('p.rs-head', {}, 'Задания:'), h('ul.rs-list.rs-tasks', {}, ...tasks.map((b) => h('li', {}, `${b.emoji} ${b.text}`))));
      } else list.append(h('p', {}, 'Подарков в этот раз не было. Попробуй ещё!'));
      if (bonuses.length) list.append(btn({ icon: '👑', text: 'В казну', variant: 'ghost', size: 'sm', onClick: () => { document.querySelector('.overlay')?.remove(); location.hash = '#/treasury'; } }));
      ctx.win({ title: 'Жарайсың!', text: `Ты набрала ${pts} очков!`, stars, extra: list, again: () => {
        stage.append(startCard);
      } });
    }

    // управление
    const toX = (e) => { const r = canvas.getBoundingClientRect(); return (e.clientX - r.left); };
    canvas.addEventListener('pointerdown', (e) => { basket.tx = toX(e); canvas.setPointerCapture?.(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons || e.pressure > 0) basket.tx = toX(e); });
    const kd = (e) => {
      if (e.key === 'ArrowLeft') { keys.l = true; e.preventDefault(); }
      if (e.key === 'ArrowRight') { keys.r = true; e.preventDefault(); }
      if ((e.key === ' ' || e.key === 'Enter') && !running && startCard.isConnected && document.activeElement === document.body) start();
    };
    const ku = (e) => { if (e.key === 'ArrowLeft') keys.l = false; if (e.key === 'ArrowRight') keys.r = false; };
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);
    window.addEventListener('resize', resize);
    ready.then(() => { resize(); draw(); });
    if (gsap() && !reduced()) gsap().from(startCard, { scale: 0.7, opacity: 0, duration: 0.6, ease: 'back.out(2)' });

    return () => {
      running = false; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', kd);
      document.removeEventListener('keyup', ku);
      window.removeEventListener('resize', resize);
    };
  }
};

function drawStar(c, x, y, r) {
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}

function basketSVG() {
  return `<svg class="doodle" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 26 L36 8 L60 30 L100 4 L140 30 L164 8 L180 26 L170 100 Q100 118 30 100Z" fill="#FFC93C" stroke="#5B1A4A" stroke-width="7" stroke-linejoin="round"/>
    <path d="M28 52 Q100 66 172 52" fill="none" stroke="#E8A200" stroke-width="6"/>
    <path d="M30 80 Q100 94 170 80" fill="none" stroke="#E8A200" stroke-width="6"/>
    <circle cx="60" cy="70" r="8" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="4"/>
    <circle cx="100" cy="74" r="10" fill="#3DDBB0" stroke="#5B1A4A" stroke-width="4"/>
    <circle cx="140" cy="70" r="8" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="4"/>
    <path d="M40 24 l10 -8" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>
  </svg>`;
}
