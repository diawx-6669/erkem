// «Королевская фотобудка»: камера + корона + рамка, отсчёт 3-2-1 и вспышка.
// Снимок остаётся только на этом устройстве: никуда не отправляется.
import { h, btn, hint, gsap, reduced, wait, confetti } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { sfx } from '../core/audio.js';
import { speak } from '../core/speech.js';

export default {
  mount(ctx) {
    const { root } = ctx;
    const booth = h('div.booth');
    const video = h('video.booth-video', { autoplay: true, playsinline: true, muted: true });
    const crown = h('div.booth-crown', { html: doodle.crown(), 'aria-label': 'Корону можно подвинуть' });
    const frame = h('div.booth-frame', { 'aria-hidden': 'true' },
      h('span.bf-title', {}, 'Королева Еркем'),
      h('span.bf-heart.a', { html: doodle.heart() }), h('span.bf-heart.b', { html: doodle.star() }), h('span.bf-heart.c', { html: doodle.sparkle() }), h('span.bf-heart.d', { html: doodle.heart({ fill: '#FFC93C' }) }));
    const count = h('div.booth-count');
    const flash = h('div.booth-flash');
    const startCard = h('div.booth-start', {},
      h('div.booth-cam-art', { html: camSVG() }),
      btn({ icon: '📷', text: 'Включить камеру', variant: 'gold', size: 'xl', onClick: () => startCam() }),
      h('p.booth-note', {}, 'Фото сохраняется только на этом телефоне и никуда не отправляется.'));
    booth.append(video, frame, crown, count, flash, startCard);
    const shootBtn = btn({ icon: '📸', text: 'Снимок!', variant: 'pink', size: 'xl', onClick: () => shoot() });
    const tip = hint('Подвинь корону пальцем прямо на голову!');
    const controls = h('div.center-col.booth-controls', { hidden: true }, tip, shootBtn);
    const shots = h('div.booth-shots');
    root.append(booth, controls, shots);

    let stream = null, crownY = 0.06, crownX = 0.5, busy = false, taken = 0;
    const placeCrown = () => { crown.style.left = (crownX * 100) + '%'; crown.style.top = (crownY * 100) + '%'; };
    placeCrown();

    async function startCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      } catch (e) {
        startCard.innerHTML = '';
        startCard.append(h('p.hand.menu-title', {}, 'Камера не включилась'),
          h('p.booth-note', {}, 'Разреши доступ к камере в браузере или попробуй на телефоне. А пока можно нарядить фото наклейками!'),
          btn({ icon: '👑', text: 'Наряди королеву', variant: 'gold', onClick: () => { location.hash = '#/room/dressup'; } }));
        speak('Камера не включилась. Можно нарядить фото наклейками!');
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      startCard.remove();
      booth.classList.add('is-live');
      controls.hidden = false;
      speak('Подвинь корону на голову и нажми «Снимок»!');
      if (gsap() && !reduced()) gsap().from(crown, { y: -300, rotation: -30, duration: 0.9, ease: 'bounce.out' });
    }

    // корону двигаем пальцем
    let drag = null;
    crown.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, cx: crownX, cy: crownY }; crown.setPointerCapture?.(e.pointerId); crown.classList.add('is-drag'); });
    crown.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = booth.getBoundingClientRect();
      crownX = Math.min(0.9, Math.max(0.1, drag.cx + (e.clientX - drag.x) / r.width));
      crownY = Math.min(0.8, Math.max(-0.05, drag.cy + (e.clientY - drag.y) / r.height));
      placeCrown();
    });
    const end = () => { drag = null; crown.classList.remove('is-drag'); };
    crown.addEventListener('pointerup', end); crown.addEventListener('pointercancel', end);

    async function shoot() {
      if (busy || !stream) return;
      busy = true; shootBtn.disabled = true;
      for (const n of [3, 2, 1]) {
        count.textContent = n; count.classList.remove('pop'); void count.offsetWidth; count.classList.add('pop');
        sfx.beep(n === 1);
        speak(['', 'Один', 'Два', 'Три'][n]);
        await wait(900);
      }
      count.textContent = '';
      sfx.shutter();
      flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
      const url = await capture();
      taken++;
      addShot(url);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 } });
      if (taken === 1) ctx.award(2);
      if (taken === 3) ctx.award(3);
      busy = false; shootBtn.disabled = false;
    }

    async function capture() {
      const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
      const r = booth.getBoundingClientRect();
      // кадр как на экране (object-fit: cover)
      const ar = r.width / r.height;
      let sw = vw, sh = vw / ar;
      if (sh > vh) { sh = vh; sw = vh * ar; }
      const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
      const W = Math.min(1080, Math.round(sw)), H = Math.round(W / ar);
      const c = h('canvas', { width: W, height: H });
      const g = c.getContext('2d');
      g.save(); g.translate(W, 0); g.scale(-1, 1);
      g.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
      g.restore();
      // рамка
      const bw = W * 0.04;
      g.lineWidth = bw * 2; g.strokeStyle = '#FF5FA2'; g.strokeRect(0, 0, W, H);
      g.lineWidth = bw * 0.35; g.strokeStyle = '#5B1A4A'; g.strokeRect(bw, bw, W - bw * 2, H - bw * 2);
      const k = W / r.width;
      const ci = await svgImage(doodle.crown());
      const cw = crown.offsetWidth * k;
      if (ci) g.drawImage(ci, crownX * W - cw / 2, crownY * H, cw, cw);
      for (const el of frame.querySelectorAll('.bf-heart')) {
        const er = el.getBoundingClientRect();
        const img = await svgImage(el.innerHTML);
        if (img) g.drawImage(img, (er.left - r.left) * k, (er.top - r.top) * k, er.width * k, er.height * k);
      }
      try { await document.fonts.load(`700 ${Math.round(W * 0.07)}px Caveat`); } catch (e) { /* ignore */ }
      g.font = `700 ${Math.round(W * 0.07)}px Caveat, cursive`;
      g.textAlign = 'center';
      g.lineWidth = W * 0.012; g.strokeStyle = '#fff'; g.strokeText('Королева Еркем', W / 2, H - bw * 1.6);
      g.fillStyle = '#C2185B'; g.fillText('Королева Еркем', W / 2, H - bw * 1.6);
      return new Promise((res) => c.toBlob((b) => res(URL.createObjectURL(b)), 'image/jpeg', 0.9));
    }

    function addShot(url) {
      const card = h('figure.booth-shot', { style: `--rot:${(Math.random() * 8 - 4).toFixed(1)}deg` }, h('img', { src: url, alt: 'Снимок из фотобудки' }));
      const save = btn({ icon: '💾', text: 'Сохранить', variant: 'gold', size: 'sm', onClick: () => {
        const a = h('a', { href: url, download: `fotobudka-erkem-${taken}.jpg` }); document.body.append(a); a.click(); a.remove();
      } });
      card.append(save);
      shots.prepend(card);
      if (gsap() && !reduced()) gsap().from(card, { y: -200, rotation: -20, opacity: 0, duration: 0.7, ease: 'back.out(1.5)' });
    }

    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }
};

function svgImage(markup) {
  return new Promise((res) => {
    const src = markup.replace('<svg ', '<svg width="400" height="400" ');
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null);
    i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  });
}

function camSVG() {
  return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="8" y="22" width="104" height="62" rx="12" fill="#FF5FA2" stroke="#5B1A4A" stroke-width="5"/><path d="M38 22 l8 -12 h28 l8 12" fill="#C2185B" stroke="#5B1A4A" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="53" r="20" fill="#fff" stroke="#5B1A4A" stroke-width="5"/><circle cx="60" cy="53" r="10" fill="#5B1A4A"/><circle cx="64" cy="49" r="3" fill="#fff"/><rect x="90" y="30" width="12" height="8" rx="3" fill="#FFC93C" stroke="#5B1A4A" stroke-width="3"/></svg>`;
}
