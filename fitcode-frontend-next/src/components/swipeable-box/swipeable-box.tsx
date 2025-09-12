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
  threshold?: number; // px to trigger a swipe
  lockThreshold?: number; // px to lock axis
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
  // track both axes
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const [dragging, setDragging] = useState(false);
  const axisRef = useRef<'x' | 'y' | null>(null);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    axisRef.current = null;
    setDragging(true);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragging || startX.current === null || startY.current === null) return;

    lastX.current = e.clientX;
    lastY.current = e.clientY;

    // lock axis early for better feel
    if (!axisRef.current) {
      const dx = Math.abs(lastX.current - startX.current);
      const dy = Math.abs(lastY.current - startY.current);

      if (dx >= lockThreshold || dy >= lockThreshold) {
        axisRef.current = dx > dy ? 'x' : 'y';
      }
    }
  };

  const handlePointerEnd: React.PointerEventHandler<HTMLDivElement> = () => {
    if (startX.current === null || startY.current === null) return;

    const dx = lastX.current - startX.current;
    const dy = lastY.current - startY.current;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const dominantAxis = axisRef.current ?? (absDx >= absDy ? 'x' : 'y');

    // reset
    setDragging(false);
    startX.current = null;
    startY.current = null;
    axisRef.current = null;

    // obey the `direction` prop
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

    // direction === 'both' (or unspecified)
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

  // touch-action: for 'both' we generally need 'none' to receive both axes.
  // if you want the page to still scroll in the non-dominant axis, set 'pan-x' or 'pan-y'.
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
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={dragging ? handlePointerEnd : undefined}
    >
      {children}
    </Box>
  );
}
