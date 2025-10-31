import React from 'react';
import { useEffect, useState } from 'react';

// A tiny, isolated ticker that only re-renders itself
export const ElapsedTime = React.memo(({ startMs }: { startMs: number }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timeoutId: number | undefined;
    let rafId: number | undefined;

    const scheduleNext = () => {
      // align updates to the next whole second boundary
      const delta = Date.now() - startMs;
      const msToNextSecond = 1000 - (delta % 1000);
      timeoutId = window.setTimeout(() => {
        setNow(Date.now());
        rafId = requestAnimationFrame(scheduleNext);
      }, msToNextSecond);
    };

    rafId = requestAnimationFrame(scheduleNext);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [startMs]);

  const secs = Math.max(0, Math.floor((now - startMs) / 1000));
  return <span>{formatSeconds(secs)}</span>;
});

function formatSeconds(s: number) {
  const hh = Math.floor(s / 3600)
    .toString()
    .padStart(2, '0');
  const mm = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
