// «Волшебная рисовалка»: блестящие краски, радужная кисть, штампы. Рисунок сохраняется на устройство.
import { h, btn, overlay, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';

const COLORS = ['#2A1340', '#E94C8F', '#FFB020', '#FFC93C', '#2FC49C', '#4F8DFF', '#8C5BFF', 'rainbow'];
const STAMPS = { star: () => doodle.star(), heart: () => doodle.heart(), crown: () => doodle.crown(), flower: () => doodle.flower() };

export default {
  mount(ctx) {
    const { root } = ctx;
    const canvas = h('canvas.draw-canvas', { 'aria-label': 'Холст для рисования' });
    const pad = h('div.draw-pad', {}, canvas);
    const tools = h('div.draw-tools');
    let color = '#E94C8F', size = 14, tool = 'brush', glitter = true, hue = 0;
    const colorBtns = COLORS.map((c) => {
      const b = h('button.swatch', { type: 'button', 'aria-label': c === 'rainbow' ? 'Радуга' : 'Цвет', style: c === 'rainbow' ? 'background:conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' : `background:${c}` });
      b.addEventListener('click', () => { color = c; tool = 'brush'; mark(); sfx.click(); });
      tools.append(b); b.dataset.c = c; return b;
    });
    const stampBtns = Object.entries(STAMPS).map(([k, fn]) => {
      const b = h('button.swatch.stamp-btn', { type: 'button', 'aria-label': 'Штамп', html: fn() });
      b.addEventListener('click', () => { tool = 'stamp:' + k; mark(); sfx.click(); });
      tools.append(b); b.dataset.t = 'stamp:' + k; return b;
    });
    const sizes = h('div.choose-row', {},
      btn({ text: 'Тонко', variant: 'ghost', size: 'sm', onClick: () => { size = 7; } }),
      btn({ text: 'Толсто', variant: 'ghost', size: 'sm', onClick: () => { size = 22; } }),
      btn({ icon: '✨', text: 'Блёстки', variant: 'ghost', size: 'sm', onClick: (e) => { glitter = !glitter; e.currentTarget.setAttribute('aria-pressed', String(glitter)); } }),
      btn({ icon: '🧽', text: 'Стереть всё', variant: 'ghost', size: 'sm', onClick: () => { paper(); sfx.whoosh(); } }),
      btn({ icon: '💾', text: 'Сохранить', variant: 'gold', size: 'sm', onClick: save }));
    sizes.children[2].setAttribute('aria-pressed', 'true');
    root.append(pad, tools, sizes);
    const mark = () => {
      colorBtns.forEach((b) => b.classList.toggle('on', tool === 'brush' && b.dataset.c === color));
      stampBtns.forEach((b) => b.classList.toggle('on', tool === b.dataset.t));
    };
    mark();

    const g = canvas.getContext('2d');
    let dpr = 1;
    function fit() {
      const snapshot = canvas.width ? canvas.toDataURL() : null;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = pad.clientWidth, hgt = Math.min(Math.max(300, window.innerHeight - 440), w * 1.1);
      canvas.width = w * dpr; canvas.height = hgt * dpr; canvas.style.height = hgt + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      paper();
      if (snapshot) { const i = new Image(); i.onload = () => g.drawImage(i, 0, 0, w, hgt); i.src = snapshot; }
    }
    function paper() { g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.height); }

    const stampImgs = {};
    Object.entries(STAMPS).forEach(([k, fn]) => { const i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fn().replace('<svg ', '<svg width="200" height="200" ')); stampImgs[k] = i; });

    let last = null;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const strokeColor = () => { if (color !== 'rainbow') return color; hue = (hue + 4) % 360; return `hsl(${hue} 90% 58%)`; };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault(); canvas.setPointerCapture?.(e.pointerId);
      const [x, y] = pos(e);
      if (tool.startsWith('stamp:')) {
        const img = stampImgs[tool.slice(6)]; const s = 70 + Math.random() * 30;
        g.save(); g.translate(x, y); g.rotate((Math.random() - 0.5) * 0.6); g.drawImage(img, -s / 2, -s / 2, s, s); g.restore();
        sfx.pop(); return;
      }
      last = [x, y]; dot(x, y);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!last) return;
      const [x, y] = pos(e);
      g.strokeStyle = strokeColor(); g.lineWidth = size; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(x, y); g.stroke();
      if (glitter && Math.random() < 0.6) sparkle(x, y);
      last = [x, y];
    });
    const up = () => { last = null; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    function dot(x, y) { g.fillStyle = strokeColor(); g.beginPath(); g.arc(x, y, size / 2, 0, Math.PI * 2); g.fill(); }
    function sparkle(x, y) {
      const r = 2 + Math.random() * 3, ox = x + (Math.random() - 0.5) * size * 2.2, oy = y + (Math.random() - 0.5) * size * 2.2;
      g.fillStyle = Math.random() < 0.5 ? '#FFE08A' : '#fff';
      g.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, rr = k % 2 ? r * 0.35 : r * 1.6; g.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    }

    function save() {
      canvas.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = h('a', { href: url, download: 'risunok-erkem.png' }); document.body.append(a); a.click(); a.remove();
        sfx.shutter(); confetti({ particleCount: 60, spread: 80 });
        const ov = overlay(h('div.saved', {}, h('p.hand.menu-title', {}, 'Шедевр готов!'), h('img.saved-img', { src: url, alt: 'Рисунок Еркем' }),
          h('p.dress-help', {}, 'Рисунок сохранён на это устройство.'), h('div.win-actions', {}, btn({ icon: '🖍️', text: 'Рисовать ещё', variant: 'mint', onClick: () => ov.close() }))));
        ctx.award(2);
      }, 'image/png');
    }

    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(fit, 200); };
    window.addEventListener('resize', onResize);
    requestAnimationFrame(fit);
    return () => window.removeEventListener('resize', onResize);
  }
};
