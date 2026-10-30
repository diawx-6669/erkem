// «Пазл»: фото Еркем на выбор, 3×3 или 4×4. Кусочки перетаскиваются и магнитятся.
import { h, btn, rand, shuffle, gsap, reduced, burstAt } from '../core/ui.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';
import { photoByName } from '../core/data.js';

const CHOICES = ['00-queen', '13-orange', '24-peace', '06-apple', '16-red', '20-trench', '15-beach-night-peace', '22-cap'];

export default {
  mount(ctx) {
    const { root, data } = ctx;
    const pickBox = h('div.center-col.puzzle-pick');
    const area = h('div.puzzle-area');
    const tools = h('div.choose-row.puzzle-tools');
    root.append(pickBox, tools, area);

    let state = null;

    function showPick() {
      area.innerHTML = ''; tools.innerHTML = ''; area.hidden = true; tools.hidden = true;
      pickBox.hidden = false; pickBox.innerHTML = '';
      let n = 3;
      const sizeRow = h('div.choose-row');
      const b3 = btn({ icon: '🧩', text: '3 × 3', variant: 'ghost', onClick: () => setN(3) });
      const b4 = btn({ icon: '🧩', text: '4 × 4', variant: 'ghost', onClick: () => setN(4) });
      const setN = (v) => { n = v; b3.setAttribute('aria-pressed', String(v === 3)); b4.setAttribute('aria-pressed', String(v === 4)); };
      setN(3);
      sizeRow.append(b3, b4);
      const grid = h('div.photo-pick');
      CHOICES.map((c) => photoByName(data, c)).forEach((p, i) => {
        const b = h('button.pick-photo', { type: 'button', style: `--rot:${[-4, 3, -2, 4, -3, 2, -1, 3][i]}deg`, 'aria-label': p.note },
          h('img', { src: p.thumb, alt: '', loading: 'lazy' }));
        b.addEventListener('click', () => { sfx.click(); start(p, n); });
        grid.append(b);
      });
      pickBox.append(h('p.hand.menu-title', {}, 'Сколько кусочков?'), sizeRow, h('p.hand.menu-title', {}, 'Выбери фото'), grid);
    }

    function start(photo, n) {
      const img = new Image();
      img.onload = () => {
        pickBox.hidden = true; area.hidden = false; tools.hidden = false;
        state = { photo, n, ar: img.naturalWidth / img.naturalHeight, pieces: [], placed: 0 };
        tools.innerHTML = '';
        tools.append(
          btn({ icon: '💡', text: 'Подсказка', variant: 'gold', size: 'sm', onClick: hintPiece }),
          btn({ icon: '↩', text: 'Другое фото', variant: 'ghost', size: 'sm', onClick: showPick })
        );
        build();
        area.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      };
      img.src = photo.src;
    }

    function geometry() {
      const W = area.clientWidth;
      const wide = W >= 760;
      const maxH = Math.max(300, window.innerHeight - (wide ? 230 : 330));
      let bw = wide ? Math.min(W * 0.5, maxH * state.ar) : Math.min(W - 8, maxH * 0.62 * state.ar);
      let bh = bw / state.ar;
      const trayH = wide ? bh : Math.max(bh * 0.9, 220);
      const H = wide ? bh + 20 : bh + trayH + 30;
      area.style.height = H + 'px';
      const bx = wide ? 10 : (W - bw) / 2, by = 10;
      const tray = wide ? { x: bx + bw + 24, y: 10, w: W - bw - 44, h: bh } : { x: 4, y: bh + 26, w: W - 8, h: trayH };
      return { bw, bh, bx, by, tray };
    }

    function build() {
      area.innerHTML = '';
      const g = geometry();
      state.g = g;
      const { n } = state;
      const board = h('div.puzzle-board', { style: `left:${g.bx}px;top:${g.by}px;width:${g.bw}px;height:${g.bh}px;background-image:url("${state.photo.src}")` });
      area.append(board, h('div.puzzle-tray', { style: `left:${g.tray.x}px;top:${g.tray.y}px;width:${g.tray.w}px;height:${g.tray.h}px` }));
      const pw = g.bw / n, ph = g.bh / n;
      state.pieces = [];
      state.placed = 0;
      const cells = shuffle([...Array(n * n).keys()]);
      cells.forEach((cell, k) => {
        const r = Math.floor(cell / n), c = cell % n;
        const el = h('div.piece', { style: `width:${pw}px;height:${ph}px;background-image:url("${state.photo.src}");background-size:${g.bw}px ${g.bh}px;background-position:${-c * pw}px ${-r * ph}px` });
        const piece = { el, r, c, placed: false, tx: g.bx + c * pw, ty: g.by + r * ph };
        const x = g.tray.x + rand(0, Math.max(0, g.tray.w - pw)), y = g.tray.y + rand(0, Math.max(0, g.tray.h - ph));
        place(piece, x, y, rand(-12, 12));
        el.style.zIndex = 10 + k;
        drag(piece);
        area.append(el);
        state.pieces.push(piece);
      });
      if (gsap() && !reduced()) gsap().from(state.pieces.map((p) => p.el), { scale: 0, stagger: 0.03, duration: 0.35, ease: 'back.out(2)' });
    }

    function place(p, x, y, rot = 0) { p.x = x; p.y = y; p.el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`; }

    let z = 100;
    function drag(p) {
      let sx, sy, ox, oy, active = false;
      p.el.addEventListener('pointerdown', (e) => {
        if (p.placed) return;
        active = true; sx = e.clientX; sy = e.clientY; ox = p.x; oy = p.y;
        p.el.style.zIndex = ++z;
        p.el.classList.add('is-drag');
        p.el.setPointerCapture?.(e.pointerId);
        sfx.flip();
        e.preventDefault();
      });
      p.el.addEventListener('pointermove', (e) => {
        if (!active) return;
        place(p, ox + e.clientX - sx, oy + e.clientY - sy, 0);
      });
      const up = () => {
        if (!active) return;
        active = false;
        p.el.classList.remove('is-drag');
        const g = state.g, pw = g.bw / state.n;
        if (Math.hypot(p.x - p.tx, p.y - p.ty) < pw * 0.38) snap(p);
      };
      p.el.addEventListener('pointerup', up);
      p.el.addEventListener('pointercancel', up);
    }

    function snap(p) {
      p.placed = true;
      p.el.classList.add('is-placed');
      p.el.style.zIndex = 5;
      if (gsap() && !reduced()) gsap().to(p, { x: p.tx, y: p.ty, duration: 0.18, ease: 'power2.out', onUpdate: () => place(p, p.x, p.y), onComplete: () => place(p, p.tx, p.ty) });
      else place(p, p.tx, p.ty);
      sfx.snap();
      state.placed++;
      if (state.placed === state.pieces.length) setTimeout(win, 500);
    }

    function hintPiece() {
      const left = state.pieces.filter((p) => !p.placed);
      if (!left.length) return;
      const p = left[Math.floor(Math.random() * left.length)];
      p.el.style.zIndex = ++z;
      snap(p);
    }

    function win() {
      const board = area.querySelector('.puzzle-board');
      board.classList.add('is-done');
      burstAt(board, { particleCount: 80, spread: 100 });
      speak('Пазл собран!');
      ctx.win({ title: 'Пазл собран!', text: state.n === 4 ? 'Целых 16 кусочков!' : '9 кусочков на месте!', stars: state.n === 4 ? 3 : 2, again: showPick });
    }

    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (!state || area.hidden) return;
        const placed = state.pieces.filter((p) => p.placed).map((p) => p.r * state.n + p.c);
        build();
        state.pieces.forEach((p) => { if (placed.includes(p.r * state.n + p.c)) { p.placed = true; p.el.classList.add('is-placed'); p.el.style.zIndex = 5; place(p, p.tx, p.ty); state.placed++; } });
      }, 200);
    };
    window.addEventListener('resize', onResize);
    showPick();
    return () => window.removeEventListener('resize', onResize);
  }
};
