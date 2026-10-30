// «Наряди королеву»: стикеры на фото. Перетаскивать, вращать, увеличивать, сохранить.
import { h, btn, overlay, gsap, reduced, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';
import { photoByName } from '../core/data.js';

const CHOICES = ['00-queen', '13-orange', '24-peace', '21-bob', '26-car', '23-bandana', '18-selfie', '19-marble'];
const STICKERS = [
  ['crown', () => doodle.crown()], ['tiara', () => doodle.tiara()], ['heartGlasses', () => doodle.heartGlasses()],
  ['sunglasses', () => doodle.sunglasses()], ['bow', () => doodle.bow()], ['bow2', () => doodle.bow({ color: '#3DDBB0', knot: '#1FA88A' })],
  ['catEars', () => doodle.catEars()], ['heart', () => doodle.heart()], ['star', () => doodle.star()], ['sparkle', () => doodle.sparkle()],
  ['lips', () => doodle.lips()], ['wand', () => doodle.wand()], ['flower', () => doodle.flower()], ['flower2', () => doodle.flower({ color: '#FFC93C' })],
  ['mustache', () => doodle.mustache()], ['seven', () => doodle.seven()]
];

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const pick = h('div.center-col');
    const editor = h('div.dress-editor', { hidden: true });
    root.append(pick, editor);

    let photo = null, items = [], sel = null, stage = null;

    function showPick() {
      editor.hidden = true; pick.hidden = false; pick.innerHTML = '';
      const grid = h('div.photo-pick');
      CHOICES.map((c) => photoByName(data, c)).forEach((p, i) => {
        const b = h('button.pick-photo', { type: 'button', style: `--rot:${[-4, 3, -2, 4, -3, 2, -1, 3][i]}deg`, 'aria-label': p.note }, h('img', { src: p.thumb, alt: '', loading: 'lazy' }));
        b.addEventListener('click', () => { sfx.click(); open(p); });
        grid.append(b);
      });
      pick.append(h('p.hand.menu-title', {}, 'Какую королеву наряжаем?'), grid);
    }

    function open(p) {
      photo = p; items = []; sel = null;
      pick.hidden = true; editor.hidden = false; editor.innerHTML = '';
      stage = h('div.dress-stage', {}, h('img.dress-photo', { src: p.src, alt: p.note, draggable: 'false' }));
      const tray = h('div.dress-tray');
      STICKERS.forEach(([key, fn]) => {
        const b = h('button.tray-item', { type: 'button', 'aria-label': 'Добавить наклейку', html: fn() });
        b.addEventListener('click', () => add(key, fn));
        tray.append(b);
      });
      const tools = h('div.choose-row',
        {},
        btn({ icon: '💾', text: 'Сохранить', variant: 'gold', onClick: save }),
        btn({ icon: '🧽', text: 'Очистить', variant: 'ghost', size: 'sm', onClick: () => { items.forEach((it) => it.el.remove()); items = []; select(null); } }),
        btn({ icon: '↩', text: 'Другое фото', variant: 'ghost', size: 'sm', onClick: showPick })
      );
      const help = h('p.dress-help', {}, 'Тащи наклейку пальцем. Двумя пальцами — крутить и увеличивать. Или кружок в углу.');
      editor.append(h('div.dress-layout', {}, stage, h('div.dress-side', {}, h('p.hand.menu-title', {}, 'Наклейки'), tray)), h('div.dress-bottom', {}, help, tools));
      stage.addEventListener('pointerdown', (e) => { if (e.target === stage || e.target.classList.contains('dress-photo')) select(null); });
      speak('Выбирай наклейки и укрась королеву!');
    }

    function add(key, fn) {
      sfx.pop();
      const el = h('div.dsticker', { tabindex: '0', html: fn() });
      el.append(h('span.ds-del', { 'aria-label': 'Убрать', role: 'button' }, '×'), h('span.ds-rot', { 'aria-hidden': 'true' }));
      const it = { key, fn, el, x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.32 + (Math.random() - 0.5) * 0.2, r: (Math.random() - 0.5) * 20, s: 1 };
      items.push(it);
      stage.append(el);
      apply(it);
      bind(it);
      select(it);
      if (gsap() && !reduced()) gsap().from(el.firstElementChild, { scale: 0, rotation: -90, duration: 0.45, ease: 'back.out(2.2)' });
    }

    function apply(it) {
      const W = stage.clientWidth;
      const base = W * 0.32;
      it.el.style.width = base + 'px';
      it.el.style.transform = `translate(${it.x * W - base / 2}px, ${it.y * stage.clientHeight - base / 2}px) rotate(${it.r}deg) scale(${it.s})`;
      it.el.style.setProperty('--inv', 1 / it.s);
    }
    function select(it) {
      items.forEach((x) => x.el.classList.toggle('is-sel', x === it));
      sel = it;
      if (it) { stage.append(it.el); it.el.focus({ preventScroll: true }); }
    }

    function bind(it) {
      const pts = new Map();
      let start = null;
      const snapshot = () => {
        const arr = [...pts.values()];
        const r = stage.getBoundingClientRect();
        if (arr.length >= 2) {
          const [a, b] = arr;
          return { mode: 'pinch', d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), s: it.s, r: it.r, rect: r };
        }
        const [a] = arr;
        return { mode: 'move', px: a.x, py: a.y, x: it.x, y: it.y, rect: r };
      };
      it.el.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('ds-del')) { e.stopPropagation(); remove(it); return; }
        e.stopPropagation();
        select(it);
        it.el.setPointerCapture?.(e.pointerId);
        if (e.target.classList.contains('ds-rot')) {
          const r = it.el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          start = { mode: 'handle', cx, cy, d: Math.hypot(e.clientX - cx, e.clientY - cy), ang: Math.atan2(e.clientY - cy, e.clientX - cx), s: it.s, r: it.r };
          pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          return;
        }
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        start = snapshot();
      });
      it.el.addEventListener('pointermove', (e) => {
        if (!pts.has(e.pointerId) || !start) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (start.mode === 'handle') {
          const d = Math.hypot(e.clientX - start.cx, e.clientY - start.cy);
          const ang = Math.atan2(e.clientY - start.cy, e.clientX - start.cx);
          it.s = clamp(start.s * d / start.d, 0.3, 4);
          it.r = start.r + (ang - start.ang) * 180 / Math.PI;
        } else if (start.mode === 'pinch' && pts.size >= 2) {
          const [a, b] = [...pts.values()];
          it.s = clamp(start.s * Math.hypot(b.x - a.x, b.y - a.y) / start.d, 0.3, 4);
          it.r = start.r + (Math.atan2(b.y - a.y, b.x - a.x) - start.ang) * 180 / Math.PI;
        } else if (start.mode === 'move') {
          it.x = clamp(start.x + (e.clientX - start.px) / start.rect.width, 0, 1);
          it.y = clamp(start.y + (e.clientY - start.py) / start.rect.height, 0, 1);
        }
        apply(it);
      });
      const up = (e) => { pts.delete(e.pointerId); start = pts.size ? snapshot() : null; };
      it.el.addEventListener('pointerup', up);
      it.el.addEventListener('pointercancel', up);
      it.el.addEventListener('wheel', (e) => { e.preventDefault(); it.s = clamp(it.s * (e.deltaY < 0 ? 1.08 : 0.93), 0.3, 4); apply(it); }, { passive: false });
      it.el.addEventListener('keydown', (e) => {
        const k = e.key, step = e.shiftKey ? 0.05 : 0.015;
        if (k === 'ArrowLeft') it.x -= step; else if (k === 'ArrowRight') it.x += step;
        else if (k === 'ArrowUp') it.y -= step; else if (k === 'ArrowDown') it.y += step;
        else if (k === '+' || k === '=') it.s = clamp(it.s * 1.1, 0.3, 4); else if (k === '-') it.s = clamp(it.s / 1.1, 0.3, 4);
        else if (k === '[') it.r -= 8; else if (k === ']') it.r += 8;
        else if (k === 'Delete' || k === 'Backspace') { remove(it); return; } else return;
        e.preventDefault(); apply(it);
      });
    }
    function remove(it) { it.el.remove(); items = items.filter((x) => x !== it); sfx.puff(); select(null); }

    async function save() {
      select(null);
      const img = stage.querySelector('.dress-photo');
      const scale = Math.min(1, 1400 / img.naturalWidth);
      const W = Math.round(img.naturalWidth * scale), H = Math.round(img.naturalHeight * scale);
      const pad = Math.round(W * 0.05), cap = Math.round(W * 0.16);
      const c = h('canvas', { width: W + pad * 2, height: H + pad + cap });
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, pad, pad, W, H);
      const k = W / stage.clientWidth;
      for (const it of items) {
        const si = await svgToImage(it.fn());
        if (!si) continue;
        const base = stage.clientWidth * 0.32 * k;
        g.save();
        g.translate(pad + it.x * W, pad + it.y * H);
        g.rotate(it.r * Math.PI / 180);
        g.scale(it.s, it.s);
        const ratio = si.height / si.width;
        g.drawImage(si, -base / 2, -base * ratio / 2, base, base * ratio);
        g.restore();
      }
      try { await document.fonts.load(`700 ${Math.round(cap * 0.5)}px Caveat`); } catch (e) { /* ignore */ }
      g.fillStyle = '#C2185B'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 ${Math.round(cap * 0.5)}px Caveat, cursive`;
      g.fillText('Королева Еркем, 7 лет', c.width / 2, H + pad + cap / 2);
      c.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = h('a', { href: url, download: 'koroleva-erkem.png' });
        document.body.append(a); a.click(); a.remove();
        sfx.shutter(); confetti({ particleCount: 70, spread: 80 });
        const box = h('div.saved', {}, h('p.hand.menu-title', {}, 'Готово!'), h('img.saved-img', { src: url, alt: 'Наряженная королева' }),
          h('p.dress-help', {}, 'Картинка сохранена на это устройство. Если не видно — нажми на неё и удерживай.'),
          h('div.win-actions', {}, btn({ icon: '✨', text: 'Ещё наряжать', variant: 'mint', onClick: () => ov.close() })));
        const ov = overlay(box);
        ctx.award(2);
      }, 'image/png');
    }

    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => items.forEach(apply), 100); };
    window.addEventListener('resize', onResize);
    showPick();
    return () => window.removeEventListener('resize', onResize);
  }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function svgToImage(markup) {
  return new Promise((res) => {
    const m = markup.match(/viewBox="([\d.\s-]+)"/);
    const [, , vw, vh] = m ? m[1].split(/\s+/).map(Number) : [0, 0, 100, 100];
    const src = markup.replace('<svg ', `<svg width="${vw * 4}" height="${vh * 4}" `);
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
    i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  });
}
