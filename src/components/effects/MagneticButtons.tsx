import { useEffect } from 'react';

export default function MagneticButtons() {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;

    const buttons = document.querySelectorAll<HTMLElement>('.magnetic');
    if (buttons.length === 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLElement;
      btn.style.transform = 'translate(0, 0)';
    };

    for (const btn of buttons) {
      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      for (const btn of buttons) {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return null;
}
