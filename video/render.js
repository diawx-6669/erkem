// Покадровый рендер видео: Playwright ставит таймлайн на нужное время, делает кадр,
// ffmpeg кодирует каждую сцену отдельно, потом всё склеивается и добавляется музыка.
// Запуск (из корня репозитория, при запущенном `python3 -m http.server 8123`):
//   node video/render.js v   → erkem-video.mp4    (1080×1920)
//   node video/render.js h   → erkem-video-tv.mp4 (1920×1080)
//   node video/render.js v preview 3 12 30 → отдельные кадры для проверки
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const O = process.argv[2] || 'v';
const MODE = process.argv[3] || 'full';
const FPS = 30;
const W = O === 'v' ? 1080 : 1920, H = O === 'v' ? 1920 : 1080;
const BUILD = path.join(__dirname, 'build');
const SCENES = [[0, 6], [6, 24], [24, 36], [36, 48], [48, 60], [60, 76]];
const VENDOR = process.env.GSAP_LOCAL; // путь к gsap.min.js, если CDN недоступен

(async () => {
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  if (VENDOR) await page.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ path: VENDOR, contentType: 'application/javascript' }));
  page.on('pageerror', (e) => console.error('PAGEERR', e.message));
  await page.goto(`http://localhost:8123/video/scenes.html?o=${O}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(500);

  if (MODE === 'preview') {
    for (const t of process.argv.slice(4).map(Number)) {
      await page.evaluate((t) => window.__seek(t), t);
      await page.screenshot({ path: path.join(BUILD, `preview-${O}-${t}.jpg`), type: 'jpeg', quality: 80 });
    }
    await browser.close();
    return;
  }

  const parts = [];
  for (let i = 0; i < SCENES.length; i++) {
    const [a, b] = SCENES[i];
    const out = path.join(BUILD, `scene-${O}-${i}.mp4`);
    parts.push(out);
    // ONLY=3,5 — перерисовать только эти сцены, остальные взять готовыми
    if (process.env.ONLY && !process.env.ONLY.split(',').map(Number).includes(i) && fs.existsSync(out)) continue;
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const f0 = Math.round(a * FPS), f1 = Math.round(b * FPS);
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      await page.evaluate((t) => window.__seek(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.log(`scene ${i}: ${f1 - f0} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();

  const list = path.join(BUILD, `list-${O}.txt`);
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  const silent = path.join(BUILD, `silent-${O}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  const music = path.join(BUILD, 'music.wav');
  const final = path.join(__dirname, '..', O === 'v' ? 'erkem-video.mp4' : 'erkem-video-tv.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', silent, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-t', String(SCENES[SCENES.length - 1][1]), '-movflags', '+faststart', final]);
  console.log('done', final);
})();
