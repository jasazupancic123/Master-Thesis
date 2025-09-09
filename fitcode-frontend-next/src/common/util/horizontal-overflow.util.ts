import { useCallback, useEffect, useRef, useState } from 'react';

export function useHorizontalOverflow() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const check = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    setIsOverflowing(inner.scrollWidth > outer.clientWidth);
  }, [outerRef.current, innerRef.current]);

  useEffect(() => {
    check();

    const onResize = () => check();
    window.addEventListener('resize', onResize);

    const ro = new ResizeObserver(() => check());
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);

    document.fonts?.ready?.then(check);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [check]);

  return { outerRef, innerRef, isOverflowing };
}
