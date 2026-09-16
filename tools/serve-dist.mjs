/* Serves the production build (dist/client) locally with byte-range support, so films stream as they do on Vercel.
   The Vercel adapter does not support `astro preview`. Run: npm run build && node tools/serve-dist.mjs [port] */
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../dist/client');
const PORT = Number(process.argv[2] || process.env.PORT || 4330);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  let st;
  try { st = statSync(file); if (st.isDirectory()) { file = path.join(file, 'index.html'); st = statSync(file); } }
  catch { res.writeHead(404).end('Not found'); return; }
  const type = TYPES[path.extname(file)] || 'application/octet-stream';
  const cache = p.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': cache });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': cache });
    createReadStream(file).pipe(res);
  }
}).listen(PORT, () => console.log(`dist on http://localhost:${PORT}`));
