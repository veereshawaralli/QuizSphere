// Lightweight IntersectionObserver — adds `is-visible` to elements with `.reveal`.
// Senior note: shared observer + once-only reveal keeps cost negligible on long pages.

import { useEffect } from 'react';

export function useReveal(selector = '.reveal') {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
}