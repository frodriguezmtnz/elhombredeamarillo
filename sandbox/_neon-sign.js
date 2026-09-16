/**
 * Motor de letras neón + efectos de cursor compartido por A/C/D.
 * scripts/build-neon-sandbox.mjs lo INYECTA inline en cada HTML:
 * con file:// los orígenes son opacos y no se pueden cargar .js hermanos.
 */
(() => {
  const stage = document.getElementById('stage');
  const spot = document.getElementById('spot');
  const sel = document.getElementById('selFx');
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. construir letras desde data-word ── */
  const buildLetters = () => {
    const lines = stage.querySelectorAll('.line[data-word]');
    lines.forEach((line, i) => {
      const word = line.getAttribute('data-word');
      line.innerHTML = '';
      for (let j = 0; j < word.length; j++) {
        const span = document.createElement('span');
        span.className = 'ltr';
        span.textContent = word[j];
        span.style.setProperty('--i', String(i * 10 + j));
        line.appendChild(span);
      }
    });
  };
  buildLetters();

  const letters = [...stage.querySelectorAll('.ltr')];
  const pupils = [...stage.querySelectorAll('.pupil')];

  /* ── 2. ignición (encendido escalonado) ── */
  const ignite = () => {
    stage.classList.remove('lit');
    void stage.offsetWidth; // reflow para reiniciar animaciones
    stage.classList.add('lit');
  };
  window.__neonReplay = ignite;
  if (reduce) stage.classList.add('lit', 'static');
  else ignite();

  /* ── 3. efectos de cursor ── */
  let fx = sel ? sel.value : 'spotlight';
  let px = -9999;
  let py = -9999;
  let sx = -9999;
  let sy = -9999;
  let centers = [];

  const measure = () => {
    const r = stage.getBoundingClientRect();
    centers = letters.map((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
    });
  };
  measure();
  window.addEventListener('resize', measure);

  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    px = e.clientX - r.left;
    py = e.clientY - r.top;
  });
  stage.addEventListener('pointerleave', () => {
    px = -9999;
    py = -9999;
  });

  const clearFx = () => {
    for (const el of letters) el.style.transform = '';
    for (const el of pupils) el.style.transform = '';
    spot.classList.remove('on');
    stage.style.setProperty('--tilt', '');
  };

  const setFx = (m) => {
    fx = m;
    if (sel) sel.value = m;
    clearFx();
  };
  if (sel) sel.addEventListener('change', () => setFx(sel.value));

  const frame = () => {
    requestAnimationFrame(frame);
    if (reduce) return;
    sx += (px - sx) * 0.16;
    sy += (py - sy) * 0.16;
    const active = px > -999;
    const r = stage.getBoundingClientRect();

    if (fx === 'spotlight' || fx === 'combo') {
      spot.classList.toggle('on', active);
      if (active) {
        spot.style.setProperty('--sx', `${sx}px`);
        spot.style.setProperty('--sy', `${sy}px`);
      }
    }

    if (fx === 'tilt' || fx === 'combo') {
      if (active) {
        const nx = (sx - r.width / 2) / (r.width / 2);
        const ny = (sy - r.height / 2) / (r.height / 2);
        stage.style.setProperty(
          '--tilt',
          `perspective(900px) rotateY(${(nx * 7).toFixed(2)}deg) rotateX(${(-ny * 7).toFixed(2)}deg)`,
        );
      } else {
        stage.style.setProperty('--tilt', '');
      }
    }

    if (fx === 'magnetic') {
      for (let i = 0; i < letters.length; i++) {
        const c = centers[i];
        if (!c) continue;
        const dx = c.x - sx;
        const dy = c.y - sy;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = Math.max(0, 1 - d / 230);
        const push = f * f * 26;
        letters[i].style.transform = `translate(${((dx / d) * push).toFixed(1)}px, ${((dy / d) * push).toFixed(1)}px)`;
      }
    }

    if (fx === 'eye') {
      for (let k = 0; k < pupils.length; k++) {
        const pb = pupils[k].getBoundingClientRect();
        const cx = pb.left - r.left + pb.width / 2;
        const cy = pb.top - r.top + pb.height / 2;
        const edx = px - cx;
        const edy = py - cy;
        const ed = Math.sqrt(edx * edx + edy * edy) || 1;
        const reach = Math.min(6, ed / 30);
        pupils[k].style.transform =
          `translate(${((edx / ed) * reach).toFixed(1)}px, ${((edy / ed) * reach).toFixed(1)}px)`;
      }
    }
  };
  requestAnimationFrame(frame);

  /* ── 4. controles de la página ── */
  const btnReplay = document.getElementById('btnReplay');
  if (btnReplay) btnReplay.addEventListener('click', ignite);
  const btnStatic = document.getElementById('btnStatic');
  if (btnStatic) {
    btnStatic.addEventListener('click', () => {
      const on = !btnStatic.classList.contains('active');
      btnStatic.classList.toggle('active', on);
      stage.classList.toggle('static', on);
    });
  }

  /* ── 5. la comparativa manda por postMessage (sin acceso cross-frame) ── */
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.neonFx) setFx(d.neonFx);
    if (d.neonReplay) ignite();
    if (typeof d.neonStatic === 'boolean' && btnStatic) {
      if (btnStatic.classList.contains('active') !== d.neonStatic) btnStatic.click();
    }
  });
})();
