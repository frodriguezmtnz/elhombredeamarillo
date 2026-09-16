/**
 * Servidor estático mínimo (sin dependencias) para ver el sandbox con http://.
 * Con http:// no hay orígenes opacos: iframes, fetch y fuentes hermanas funcionan
 * igual que en producción. file:// también va (todo autocontenido), pero http://
 * es la vía recomendada para la comparativa.
 *
 * Uso:  node scripts/serve-sandbox.mjs   (o  pnpm sandbox)
 * Abre: http://localhost:4599/sandbox/neon-trivial-compare.html
 */

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4599);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === '/' || pathname === '') pathname = '/sandbox/neon-trivial-compare.html';

  const filePath = normalize(join(ROOT, pathname));
  // guarda anti-traversal: solo dentro del repo
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    res.writeHead(403).end('403');
    return;
  }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end(`404 ${pathname}`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`[sandbox] puerto ${PORT} ocupado → prueba: PORT=4600 pnpm sandbox`);
  else console.error('[sandbox]', err.message);
  process.exit(1);
});
server.listen(PORT, () => {
  console.log(`[sandbox] http://localhost:${PORT}/  →  /sandbox/neon-trivial-compare.html`);
});
