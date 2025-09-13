'use client';
import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';

type SwipeableBoxProps = {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  direction?: 'horizontal' | 'vertical' | 'both';
  threshold?: number;
  lockThreshold?: number;
};

export default function SwipeableBox({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 80,
  lockThreshold = 10,
  direction = 'both',
  children,
}: SwipeableBoxProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const [dragging, setDragging] = useState(false);
  const axisRef = useRef<'x' | 'y' | null>(null);

  const begin = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    lastX.current = x;
    lastY.current = y;
    axisRef.current = null;
    setDragging(true);
  };

  const move = (x: number, y: number) => {
    if (!dragging || startX.current === null || startY.current === null) return;
    lastX.current = x;
    lastY.current = y;

    if (!axisRef.current) {
      const dx = Math.abs(lastX.current - startX.current);
      const dy = Math.abs(lastY.current - startY.current);
      if (dx >= lockThreshold || dy >= lockThreshold) {
        axisRef.current = dx > dy ? 'x' : 'y';
      }
    }
  };

  const end = () => {
    if (startX.current === null || startY.current === null) return;

    const dx = lastX.current - startX.current;
    const dy = lastY.current - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const dominantAxis = axisRef.current ?? (absDx >= absDy ? 'x' : 'y');

    // reset first to avoid re-entrancy
    setDragging(false);
    startX.current = null;
    startY.current = null;
    axisRef.current = null;

    if (direction === 'horizontal' && absDx >= threshold) {
      if (dx <= -threshold) onSwipeLeft?.();
      else if (dx >= threshold) onSwipeRight?.();
      return;
    }
    if (direction === 'vertical' && absDy >= threshold) {
      if (dy <= -threshold) onSwipeUp?.();
      else if (dy >= threshold) onSwipeDown?.();
      return;
    }
    if (dominantAxis === 'x' && absDx >= threshold) {
      if (dx <= -threshold) onSwipeLeft?.();
      else if (dx >= threshold) onSwipeRight?.();
      return;
    }
    if (dominantAxis === 'y' && absDy >= threshold) {
      if (dy <= -threshold) onSwipeUp?.();
      else if (dy >= threshold) onSwipeDown?.();
      return;
    }
  };

  // ---- Pointer Events (Android / desktop, works on modern iOS too but we also add touch fallback)
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Avoid setPointerCapture on iOS – it’s buggy in scrollables.
    begin(e.clientX, e.clientY);
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    move(e.clientX, e.clientY);
  };
  const onPointerEnd: React.PointerEventHandler<HTMLDivElement> = () => end();

  // ---- Touch fallback for iOS Safari weirdness
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const t = e.touches[0];
    begin(t.clientX, t.clientY);
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    move(t.clientX, t.clientY);

    // Once we've locked an axis that conflicts with page scroll, stop the browser from stealing the gesture.
    const axis = axisRef.current;
    if (
      direction === 'horizontal' ||
      (direction === 'both' && axis === 'x') ||
      direction === 'vertical' ||
      (direction === 'both' && axis === 'y')
    ) {
      e.preventDefault(); // React sets touchmove as non-passive, so this works.
    }
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => end();
  const onTouchCancel: React.TouchEventHandler<HTMLDivElement> = () => end();

  // Prefer keeping some native scrolling when possible
  const touchAction =
    direction === 'horizontal'
      ? 'pan-y'
      : direction === 'vertical'
        ? 'pan-x'
        : 'none';

  return (
    <Box
      sx={{
        touchAction,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'contain',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={dragging ? onPointerEnd : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {children}
    </Box>
  );
}
