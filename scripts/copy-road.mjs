import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'sandbox/the-road/dist');
const out = resolve(root, 'dist/the-road');

if (!existsSync(src)) {
  console.error('[copy-road] No existe sandbox/the-road/dist — ejecuta `pnpm build:road` antes.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
cpSync(src, out, { recursive: true });
// controls-sandbox.html es una herramienta de desarrollo, no se despliega
rmSync(resolve(out, 'controls-sandbox.html'), { force: true });

console.log('[copy-road] Juego copiado a dist/the-road/');
