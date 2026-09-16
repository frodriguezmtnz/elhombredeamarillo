/**
 * Ensambla los playgrounds autocontenidos A/C/D desde plantillas + parciales.
 * Todo (CSS, JS, talismán, araña) se INLYECTA inline: con file:// los orígenes
 * son opacos y no se pueden cargar .css/.js/.svg hermanos.
 *
 * Uso:  node scripts/build-neon-sandbox.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SB = join(ROOT, 'sandbox');

const css = readFileSync(join(SB, '_neon-base.css'), 'utf8');
const js = readFileSync(join(SB, '_neon-sign.js'), 'utf8');
const talisman = readFileSync(join(SB, '_p-talisman.svg'), 'utf8');
const spider = readFileSync(join(SB, '_p-spider.svg'), 'utf8');

function assemble(tpl, out) {
  const src = join(SB, tpl);
  if (!existsSync(src)) {
    console.warn(`[neon] falta plantilla ${tpl}`);
    return;
  }
  const html = readFileSync(src, 'utf8')
    .replace('/*__NEON_CSS__*/', () => css)
    .replace('/*__NEON_JS__*/', () => js)
    .replace('<!--__NEON_TALISMAN__-->', () => talisman)
    .replace('<!--__NEON_SPIDER__-->', () => spider);
  writeFileSync(join(SB, out), html);
  console.log(`[neon] ${out}  (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
}

assemble('_tpl-a.html', 'neon-trivial-svg.html');
assemble('_tpl-c.html', 'neon-trivial-fromville.html');
assemble('_tpl-d.html', 'neon-trivial-fromville-only.html');
