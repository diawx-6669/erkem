// «Ритм-сердечки»: сердечки падают точно в долю музыки, нажимай, когда они в кружке.
import { h, btn, gsap, reduced } from '../core/ui.js';
import { doodle } from '../core/doodles.js';
import { music, now as audioNow, ready as audioReady, unlock } from '../core/audio.js';
import { speak } from '../core/speech.js';

const LANES = [
  { color: '#FF5FA2', keys: ['ArrowLeft', 'a', 'ф', '1'] },
  { color: '#FFC93C', keys: ['ArrowDown', 'ArrowUp', 's', 'ы', '2', ' '] },
  { color: '#3DDBB0', keys: ['ArrowRight', 'd', 'в', '3'] }
];
const FALL = 1.9;

function makeChart(beats = 72) {
  // Простой узор: первые такты — по одной доле, потом добавляем «двойные» сердечки.
  const notes = [];
  let lane = 1;
  for (let b = 8; b < 8 + beats; b++) {
    if (b % 16 === 15) continue; // передышка
    lane = (lane + [1, 2, 1, 0, 2][b % 5]) % 3;
    notes.push({ beat: b, lane });
    if (b > 40 && b % 4 === 1) notes.push({ beat: b + 0.5, lane: (lane + 1) % 3 });
  }
  return notes;
}

export default {
  mount(ctx) {
    const { root } = ctx;
    const hud = h('div.rhythm-hud', {}, h('span.score-pill', {}, 'Сердечки: ', h('b.rh-score', {}, '0')), h('span.rh-judge'));
    const stage = h('div.rhythm-stage');
    const canvas = h('canvas.rhythm-canvas');
    const lanesEl = h('div.rhythm-lanes');
    LANES.forEach((l, i) => {
      const lane = h('button.rlane', { type: 'button', style: `--c:${l.color}`, 'aria-label': `Дорожка ${i + 1}` }, h('span.rring', { html: doodle.heart({ fill: '#ffffff', w: 4 }) }));
      lane.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(i); });
      lanesEl.append(lane);
    });
    const startCard = h('div.rain-start', {},
      h('div.rhythm-art', { html: doodle.heart() + doodle.heart({ fill: '#FFC93C' }) + doodle.heart({ fill: '#3DDBB0' }) }),
      h('p.hand', {}, 'Нажимай, когда сердечко в кружке!'),
      btn({ icon: '💃', text: 'Танцуем!', variant: 'gold', size: 'xl', onClick: () => start() }),
      h('p.rain-keys', {}, 'Клавиши: ← ↓ →'));
    stage.append(h('div.rhythm-floor'), canvas, lanesEl, startCard);
    root.append(hud, stage);

    const c2 = canvas.getContext('2d');
    let W = 0, H = 0, notes = [], t0 = 0, beat = 60 / 118, raf = 0, running = false, score = 0, hits = 0, lastBeat = -1;
    const imgs = [];
    LANES.forEach((l, i) => { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(doodle.heart({ fill: l.color }).replace('class="doodle ', 'class="').replace('<svg ', '<svg width="160" height="160" ')); imgs[i] = im; });
    const fx = [];

    const clock = () => (audioReady() ? audioNow() : performance.now() / 1000);

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const hitY = () => H - Math.min(W / 3, 130) * 0.62;

    function start() {
      unlock();
      startCard.remove();
      resize();
      stage.scrollIntoView({ behavior: 'smooth', block: 'end' });
      const m = music.play('disco');
      const ck = music.clock();
      t0 = ck ? ck.start : clock() + 0.1;
      beat = ck ? ck.beat : 60 / 118;
      notes = makeChart().map((n) => ({ ...n, t: t0 + n.beat * beat, state: 0 }));
      score = 0; hits = 0; lastBeat = -1;
      hud.querySelector('.rh-score').textContent = '0';
      running = true;
      if (!m) speak('Танцуем!');
      raf = requestAnimationFrame(loop);
    }

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const t = clock();
      const b = Math.floor((t - t0) / beat);
      if (b !== lastBeat && b >= 0) { lastBeat = b; stage.classList.toggle('beat-b', b % 2 === 1); stage.classList.add('beat'); setTimeout(() => stage.classList.remove('beat'), 90); }
      c2.clearRect(0, 0, W, H);
      const lw = W / 3, size = Math.min(lw * 0.62, 84), y0 = hitY();
      for (const n of notes) {
        if (n.state === 1) continue;
        const dt = n.t - t;
        if (dt > FALL) continue;
        if (dt < -0.25 && n.state === 0) { n.state = 2; }
        const y = y0 - (dt / FALL) * (y0 + size);
        const x = lw * n.lane + lw / 2;
        c2.globalAlpha = n.state === 2 ? Math.max(0, 1 + (dt + 0.25) * 3) : 1;
        if (c2.globalAlpha <= 0) continue;
        const pulse = 1 + 0.06 * Math.sin(t * 12);
        c2.drawImage(imgs[n.lane], x - size * pulse / 2, y - size * pulse / 2, size * pulse, size * pulse);
      }
      c2.globalAlpha = 1;
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i]; f.life -= 0.035;
        if (f.life <= 0) { fx.splice(i, 1); continue; }
        c2.globalAlpha = f.life;
        c2.strokeStyle = f.color; c2.lineWidth = 6;
        c2.beginPath(); c2.arc(f.x, f.y, (1 - f.life) * 70 + 20, 0, Math.PI * 2); c2.stroke();
        c2.fillStyle = '#5B1A4A'; c2.font = '900 26px Nunito, sans-serif'; c2.textAlign = 'center';
        c2.fillText(f.text, f.x, f.y - 60 - (1 - f.life) * 30);
      }
      c2.globalAlpha = 1;
      if (notes.length && t > notes[notes.length - 1].t + 1.2) end();
    }

    function hit(lane) {
      const laneEl = lanesEl.children[lane];
      laneEl.classList.remove('press'); void laneEl.offsetWidth; laneEl.classList.add('press');
      if (!running) return;
      const t = clock();
      let best = null;
      for (const n of notes) { if (n.state === 0 && n.lane === lane && Math.abs(n.t - t) < 0.24 && (!best || Math.abs(n.t - t) < Math.abs(best.t - t))) best = n; }
      if (!best) return;
      best.state = 1;
      const good = Math.abs(best.t - t) < 0.1;
      hits++; score += good ? 2 : 1;
      hud.querySelector('.rh-score').textContent = String(score);
      const judge = hud.querySelector('.rh-judge');
      judge.textContent = good ? 'Супер!' : 'Хорошо!';
      judge.classList.remove('show'); void judge.offsetWidth; judge.classList.add('show');
      fx.push({ x: (W / 3) * lane + W / 6, y: hitY(), life: 1, color: LANES[lane].color, text: good ? '♥♥' : '♥' });
    }

    function end() {
      running = false;
      cancelAnimationFrame(raf);
      music.stop();
      const ratio = hits / notes.length;
      const stars = ratio >= 0.75 ? 3 : ratio >= 0.45 ? 2 : 1;
      ctx.win({ title: 'Ты танцевала супер!', text: `Поймано ${hits} сердечек из ${notes.length}.`, stars, again: () => { stage.append(startCard); } });
    }

    const kd = (e) => {
      if (e.repeat) return;
      const i = LANES.findIndex((l) => l.keys.includes(e.key));
      if (i >= 0 && running) { e.preventDefault(); hit(i); }
    };
    document.addEventListener('keydown', kd);
    window.addEventListener('resize', resize);
    requestAnimationFrame(resize);
    if (gsap() && !reduced()) gsap().from(startCard, { scale: 0.7, opacity: 0, duration: 0.6, ease: 'back.out(2)' });
    return () => { running = false; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); window.removeEventListener('resize', resize); };
  }
};
