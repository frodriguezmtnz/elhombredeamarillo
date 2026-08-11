import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollY / docHeight) * 100 : 0);
    };

    // Update on scroll
    window.addEventListener('scroll', update, { passive: true });

    // Also update after View Transition navigation (scroll position may change)
    document.addEventListener('astro:page-load', update);

    return () => {
      window.removeEventListener('scroll', update);
      document.removeEventListener('astro:page-load', update);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[2px] bg-yellow z-[60] transition-none"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}
