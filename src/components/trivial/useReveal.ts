import { type RefObject, useEffect } from 'react';

/**
 * Revela al hacer scroll los elementos `.reveal-item` dentro de `ref`,
 * reutilizando las clases globales de `global.css` (`.reveal-item` / `.in-view`).
 *
 * El script global de BaseLayout solo escanea en carga y en `astro:page-load`,
 * así que no ve los nodos que inserta React (islas `client:visible` que se
 * hidratan/re-montan tarde). Este hook es la versión acotada: observa SOLO los
 * nodos del contenedor, se desconecta al desmontar y no toca otras páginas.
 * Con `prefers-reduced-motion` no observa: el CSS ya deja los items visibles.
 */
export function useReveal<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = root.querySelectorAll<HTMLElement>('.reveal-item:not(.in-view)');
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    for (const el of els) observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);
}
