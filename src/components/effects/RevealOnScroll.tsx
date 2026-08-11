import { useEffect } from 'react';

export default function RevealOnScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    function initObserver() {
      const elements = document.querySelectorAll<HTMLElement>('.reveal-item:not(.in-view)');
      if (elements.length === 0) return;

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

      for (const el of elements) observer.observe(el);
    }

    // Initial run
    initObserver();

    // Re-run after each View Transition navigation
    document.addEventListener('astro:page-load', initObserver);
    return () => {
      document.removeEventListener('astro:page-load', initObserver);
    };
  }, []);

  return null;
}
