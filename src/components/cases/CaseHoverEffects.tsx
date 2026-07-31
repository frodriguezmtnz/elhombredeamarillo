import { useEffect } from 'react';

export default function CaseHoverEffects() {
  useEffect(() => {
    const isMobile = window.innerWidth <= 900;
    const cards = document.querySelectorAll<HTMLElement>('[data-case-id]');
    if (cards.length === 0) return;

    if (isMobile) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              const rect = el.getBoundingClientRect();
              const centerY = window.innerHeight / 2;
              const offset = (rect.top + rect.height / 2 - centerY) / centerY;
              const rotateX = offset * -5;
              const scale = 1 - Math.abs(offset) * 0.03;
              el.style.transform = `perspective(800px) rotateX(${rotateX}deg) scale(${scale})`;
              el.style.opacity = String(1 - Math.abs(offset) * 0.2);
            }
          }
        },
        { threshold: Array.from({ length: 20 }, (_, i) => i / 19) },
      );

      for (const card of cards) observer.observe(card);
      return () => observer.disconnect();
    }

    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = y * -8;
      const rotateY = x * 8;
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
    };

    for (const card of cards) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      for (const card of cards) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return null;
}
