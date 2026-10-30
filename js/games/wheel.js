// «Колесо фортуны королевы»: крутится по-настоящему (инерция и трение), щёлкает на каждом секторе.
import { h, btn, revealCard, drawPrize, gsap, reduced } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

const FILLS = ['#FF5FA2', '#FFC93C', '#3DDBB0', '#C2185B', '#FF9CC6', '#FFC93C', '#3DDBB0', '#FF5FA2'];
const TEXT_ON = { '#FF5FA2': '#fff', '#C2185B': '#fff', '#FFC93C': '#5B1A4A', '#3DDBB0': '#5B1A4A', '#FF9CC6': '#5B1A4A' };

export default {
  mount(ctx) {
    const { root, data, store } = ctx;
    const wrap = h('div.wheel-wrap');
    const canvas = h('canvas.wheel-canvas', { 'aria-label': 'Колесо фортуны' });
    const pointer = h('div.wheel-pointer', { html: pointerSVG() });
    const hub = h('button.wheel-hub', { type: 'button', 'aria-label': 'Крутить колесо', html: doodle.crown() });
    wrap.append(h('div.wheel-lights'), canvas, pointer, hub);
    const spins = h('p.wheel-count.hand', {}, 'Крути, королева!');
    const spinBtn = btn({ icon: '🌀', text: 'Крутить!', variant: 'gold', size: 'xl', onClick: () => spin() });
    const shuffleBtn = btn({ icon: '🔀', text: 'Другие призы', variant: 'ghost', size: 'sm', onClick: () => { if (!spinning) { makeSegments(); draw(); sfx.sparkle(); } } });
    root.append(h('div.center-col', {}, wrap, spins, h('div.choose-row', {}, spinBtn, shuffleBtn)));

    const c2 = canvas.getContext('2d');
    let size = 0, segs = [], angle = 0, vel = 0, spinning = false, raf = 0, last = 0, lastIdx = -1, count = 0;

    function makeSegments() {
      const out = [];
      const ids = new Set();
      const want = ['bonus', 'task', 'bonus', 'bonus', 'task', 'bonus', 'task', 'bonus'];
      for (const type of want) {
        let item = null;
        for (let k = 0; k < 20 && (!item || ids.has(item.id)); k++) item = drawPrize(data.prizes, { type, isOnceWon: (id) => store.isOnceWon(id) });
        ids.add(item.id); out.push(item);
      }
      segs = out;
    }

    function resize() {
      size = Math.min(wrap.clientWidth, 560);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr; canvas.height = size * dpr;
      canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      const r = size / 2, n = segs.length, seg = (Math.PI * 2) / n;
      c2.clearRect(0, 0, size, size);
      c2.save(); c2.translate(r, r); c2.rotate(angle);
      for (let i = 0; i < n; i++) {
        const fill = FILLS[i % FILLS.length];
        c2.beginPath(); c2.moveTo(0, 0); c2.arc(0, 0, r - 8, i * seg, (i + 1) * seg); c2.closePath();
        c2.fillStyle = fill; c2.fill();
        c2.lineWidth = 4; c2.strokeStyle = '#5B1A4A'; c2.stroke();
        // подпись вдоль радиуса
        c2.save(); c2.rotate(i * seg + seg / 2);
        c2.textAlign = 'right'; c2.textBaseline = 'middle';
        c2.font = `${Math.round(size * 0.075)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        c2.fillText(segs[i].emoji || '🎁', r - 18, 0);
        c2.fillStyle = TEXT_ON[fill] || '#fff';
        c2.font = `900 ${Math.max(11, Math.round(size * 0.028))}px Nunito, sans-serif`;
        const lines = wrapText(segs[i].text, 13).slice(0, 2);
        lines.forEach((ln, k) => c2.fillText(ln, r - 18 - size * 0.1, (k - (lines.length - 1) / 2) * size * 0.034));
        c2.restore();
      }
      // золотые гвоздики по краю
      for (let i = 0; i < n; i++) {
        const a = i * seg;
        c2.beginPath(); c2.arc(Math.cos(a) * (r - 16), Math.sin(a) * (r - 16), 6, 0, Math.PI * 2);
        c2.fillStyle = '#FFC93C'; c2.fill(); c2.lineWidth = 3; c2.strokeStyle = '#5B1A4A'; c2.stroke();
      }
      c2.restore();
      c2.beginPath(); c2.arc(r, r, r - 6, 0, Math.PI * 2); c2.lineWidth = 8; c2.strokeStyle = '#5B1A4A'; c2.stroke();
    }

    function indexAtPointer() {
      const seg = (Math.PI * 2) / segs.length;
      let a = (-Math.PI / 2 - angle) % (Math.PI * 2);
      if (a < 0) a += Math.PI * 2;
      return Math.floor(a / seg) % segs.length;
    }

    function spin(v0) {
      if (spinning) return;
      unlock();
      spinning = true;
      spinBtn.disabled = true;
      vel = v0 || (14 + Math.random() * 8);
      last = 0; lastIdx = indexAtPointer();
      wrap.classList.add('is-spinning');
      raf = requestAnimationFrame(tick);
    }

    function tick(ts) {
      const dt = Math.min(0.04, (ts - (last || ts)) / 1000); last = ts;
      angle += vel * dt;
      // трение: быстро в начале, мягко в конце
      vel *= Math.pow(0.55, dt);
      vel -= 0.35 * dt;
      const idx = indexAtPointer();
      if (idx !== lastIdx) {
        lastIdx = idx;
        sfx.tick();
        pointer.classList.remove('kick'); void pointer.offsetWidth; pointer.classList.add('kick');
      }
      draw();
      if (vel <= 0.02) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }

    async function stop() {
      spinning = false;
      wrap.classList.remove('is-spinning');
      const item = segs[indexAtPointer()];
      count++;
      spins.textContent = `Прокруток: ${count}`;
      if (item.type === 'bonus') store.addCoupon(item, 'wheel');
      await revealCard(item);
      spinBtn.disabled = false;
      const stars = count >= 5 ? 3 : count >= 3 ? 2 : 1;
      ctx.award(stars);
      if (count === 1) speak('Можно крутить ещё!');
    }

    // крутить можно и пальцем: резкий взмах по колесу
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (spinning) return;
      const r = canvas.getBoundingClientRect();
      drag = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, a: 0, t: performance.now(), v: 0, start: angle };
      drag.a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
      let d = a - drag.a; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      const now = performance.now();
      drag.v = d / Math.max(0.008, (now - drag.t) / 1000);
      drag.a = a; drag.t = now;
      angle += d; draw();
    });
    canvas.addEventListener('pointerup', () => {
      if (!drag) return;
      const v = drag.v; drag = null;
      if (Math.abs(v) > 3) spin(Math.min(30, Math.max(10, Math.abs(v))));
    });
    hub.addEventListener('click', () => spin());

    makeSegments();
    window.addEventListener('resize', resize);
    requestAnimationFrame(resize);
    if (gsap() && !reduced()) gsap().from(wrap, { rotation: -200, scale: 0.4, duration: 1, ease: 'back.out(1.4)' });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }
};

function wrapText(t, max) {
  const words = t.replace(/[«»]/g, '').split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) lines[1] = lines[1].replace(/.{0,1}$/, '…');
  return lines;
}

function pointerSVG() {
  return `<svg viewBox="0 0 60 80" aria-hidden="true"><path d="M30 76 L8 22 C4 10 14 2 30 2 C46 2 56 10 52 22Z" fill="#C2185B" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/><circle cx="30" cy="22" r="9" fill="#FFC93C" stroke="#5B1A4A" stroke-width="4"/></svg>`;
}
