/* The link-preview card (public/og.jpg, 2400x1260, shown at 1200x630).
   Built as an HTML page with the site's own fonts, colours and product screens, then captured by headless Chrome.
   Run: node tools/make_og.mjs   (needs Google Chrome in /Applications) */
import sharp from 'sharp';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/og.jpg');
const tmp = mkdtempSync(path.join(tmpdir(), 'og-'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// cut the product UI out of each cover (the covers carry a coloured margin around the screen), losslessly
const crop = async (name, box) => {
  const file = path.join(tmp, `${name}.png`);
  await sharp(path.join(ROOT, `public/covers/${name}-2400.png`)).extract(box).png().toFile(file);
  return pathToFileURL(file).href;
};
const orbit = await crop('orbitform', { left: 286, top: 216, width: 1830, height: 1125 });
const collga = await crop('collga', { left: 286, top: 196, width: 1826, height: 1136 });
const luca = await crop('luca', { left: 850, top: 350, width: 702, height: 1207 });
const portrait = pathToFileURL(path.join(ROOT, 'src/assets/portrait.jpg')).href;
const font = (f) => pathToFileURL(path.join(ROOT, 'node_modules', f)).href;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Archivo; font-weight: 100 900; src: url('${font('@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2')}'); }
@font-face { font-family: Plex; font-weight: 400; src: url('${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}'); }
@font-face { font-family: Plex; font-weight: 500; src: url('${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')}'); }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; background: #09090A; }
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; font-family: Archivo; color: #EBEEF5;
  background: radial-gradient(900px 620px at 88% 30%, rgba(59,111,235,0.30), transparent 62%),
              radial-gradient(700px 500px at -10% 110%, rgba(97,144,255,0.10), transparent 60%), #09090A; }
.grid { position: absolute; inset: 0; opacity: 0.5;
  background-image: linear-gradient(rgba(235,238,245,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(235,238,245,0.045) 1px, transparent 1px);
  background-size: 48px 48px; -webkit-mask-image: radial-gradient(700px 520px at 78% 45%, #000 20%, transparent 75%); }

.copy { position: absolute; left: 72px; top: 64px; bottom: 60px; width: 560px; display: flex; flex-direction: column; }
.id { display: flex; align-items: center; gap: 14px; }
.face { width: 52px; height: 52px; border-radius: 50%; background: url('${portrait}') 36% 34% / 150% no-repeat; box-shadow: 0 0 0 2px #09090A, 0 0 0 3.5px rgba(235,238,245,0.28); }
.mark { font-size: 32px; font-weight: 600; letter-spacing: -1.2px; }
.mark i { font-style: normal; color: #6190FF; }
.eyebrow { margin-top: auto; display: flex; align-items: center; gap: 10px; font: 500 14px/1 Plex; letter-spacing: 2.4px; text-transform: uppercase; color: #6190FF; }
.eyebrow b { width: 8px; height: 8px; border-radius: 50%; background: #6190FF; box-shadow: 0 0 0 6px rgba(97,144,255,0.16); }
h1 { margin-top: 22px; font-size: 66px; line-height: 1.02; font-weight: 600; letter-spacing: -2.9px; }
h1 .sel { position: relative; display: inline-block; padding: 0 10px; margin: 0 6px 0 -10px; }
h1 .sel::before { content: ''; position: absolute; inset: 6px 0 -2px; border: 1.5px solid #6190FF; background: rgba(97,144,255,0.08); }
h1 .sel s { position: absolute; width: 9px; height: 9px; background: #09090A; border: 1.5px solid #6190FF; }
h1 .sel s:nth-of-type(1) { left: -4px; top: 2px } h1 .sel s:nth-of-type(2) { right: -4px; top: 2px }
h1 .sel s:nth-of-type(3) { left: -4px; bottom: -6px } h1 .sel s:nth-of-type(4) { right: -4px; bottom: -6px }
.foot { margin-top: auto; padding-top: 22px; border-top: 1px solid rgba(235,238,245,0.12); display: flex; justify-content: space-between;
  font: 400 13px/1 Plex; letter-spacing: 1.8px; text-transform: uppercase; color: #8E9299; }
.foot span:first-child { color: #EBEEF5; }

.stage { position: absolute; left: 640px; top: 0; width: 560px; height: 630px; perspective: 1600px; }
.win { position: absolute; border-radius: 12px; overflow: hidden; background: #fff;
  box-shadow: 0 0 0 1px rgba(235,238,245,0.16), 0 40px 80px -20px rgba(0,0,0,0.75), 0 0 60px rgba(59,111,235,0.18); }
.win::before { content: ''; display: block; height: 22px; background: #16181D; border-bottom: 1px solid rgba(235,238,245,0.08);
  background-image: radial-gradient(circle at 14px 11px, #3A3D45 3.5px, transparent 4px), radial-gradient(circle at 28px 11px, #3A3D45 3.5px, transparent 4px), radial-gradient(circle at 42px 11px, #3A3D45 3.5px, transparent 4px); }
.win img { display: block; width: 100%; }
.back { left: 170px; top: 40px; width: 560px; transform: rotateY(-16deg) rotateX(4deg); opacity: 0.55; filter: saturate(0.8); }
.front { left: 70px; top: 170px; width: 600px; transform: rotateY(-16deg) rotateX(4deg); }
.phone { position: absolute; left: 20px; top: 300px; width: 176px; height: 300px; border-radius: 28px; overflow: hidden; background: #fff;
  box-shadow: 0 0 0 5px #16181D, 0 0 0 6px rgba(235,238,245,0.22), 0 40px 70px -10px rgba(0,0,0,0.8); transform: rotate(-4deg); }
.phone img { width: 100%; display: block; }
.fade { position: absolute; inset: auto 0 0 0; height: 150px; background: linear-gradient(transparent, #09090A); }
</style></head><body><div class="card">
  <div class="grid"></div>
  <div class="stage">
    <div class="win back"><img src="${collga}"></div>
    <div class="win front"><img src="${orbit}"></div>
    <div class="fade"></div>
    <div class="phone"><img src="${luca}"></div>
  </div>
  <div class="copy">
    <div class="id"><span class="face"></span><span class="mark">yemmy<i>.</i></span></div>
    <p class="eyebrow"><b></b>Senior Service &amp; UX Designer</p>
    <h1>Designing the <span class="sel">systems<s></s><s></s><s></s><s></s></span> behind public services.</h1>
    <p class="foot"><span>Oluwayemi Akinbande</span><span>yemmy.design</span></p>
  </div>
</div></body></html>`;

const page = path.join(tmp, 'og.html');
const png = path.join(tmp, 'og.png');
writeFileSync(page, html);
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
  '--force-device-scale-factor=2', '--window-size=1200,630', '--virtual-time-budget=3000', `--screenshot=${png}`, pathToFileURL(page).href], { stdio: 'ignore' });
const info = await sharp(png).jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(OUT);
console.log(`og.jpg ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);
