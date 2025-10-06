'use client';

import { useEffect, useState } from 'react';

export function useActiveSection(ids: string[], offsetPx = 0) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (!elements.length) return;

    const handle: IntersectionObserverCallback = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) setActive(visible[0].target.id);
    };

    const observer = new IntersectionObserver(handle, {
      root: null,
      threshold: 0.5,
    });

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids.join(','), offsetPx]);

  return active;
}
