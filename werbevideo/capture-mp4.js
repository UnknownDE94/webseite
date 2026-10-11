// Rendert den 48-s-Loop Bild für Bild (deterministisch über renderAt(t)) und kodiert ihn als MP4.
// Aufruf: NODE_PATH=$(npm root -g) node capture-mp4.js [ausgabe.mp4]
// Voraussetzungen: npm i -g playwright && npx playwright install chromium, ffmpeg im PATH
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const FPS = 30, SECONDS = 48, W = 1920, H = 1080;

(async () => {
  const file = path.resolve(__dirname, 'erfahrung-statt-software.html');
  const out = process.argv[2] || 'erfahrung-statt-software.mp4';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + file + '?t=0');

  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let i = 0; i < FPS * SECONDS; i++) {
    await page.evaluate(t => renderAt(t), i / FPS);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('fertig:', out);
})().catch(e => { console.error(e); process.exit(1); });
