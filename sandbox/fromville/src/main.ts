import { Game } from './core/Game';
import { isWebGL2Supported } from './core/Renderer';

async function boot(): Promise<void> {
  const fallback = document.getElementById('no-webgl');
  if (!isWebGL2Supported()) {
    fallback?.removeAttribute('hidden');
    document.getElementById('ui-root')?.remove();
    document.getElementById('no-webgl-retry')?.addEventListener('click', () => window.location.reload());
    return;
  }
  fallback?.remove();
  const game = new Game();
  await game.init();
  (window as Window & { __FROMVILLE__?: Game }).__FROMVILLE__ = game;
}

void boot();
