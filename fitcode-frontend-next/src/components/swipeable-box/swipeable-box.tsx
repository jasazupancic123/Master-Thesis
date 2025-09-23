'use client';
import { Box } from '@mui/material';
import React, { useRef } from 'react';

type SwipeableBoxProps = {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number; // px to trigger a swipe
  slop?: number; // px before we consider it a drag
};

export default function SwipeableBox({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  slop = 8,
  children,
}: SwipeableBoxProps) {
  const startX = useRef<number | null>(null);
  const lastX = useRef(0);
  const dragging = useRef(false);
  const captured = useRef(false);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Do NOT capture yet; allow normal clicks to bubble if it ends as a tap.
    startX.current = e.clientX;
    lastX.current = e.clientX;
    dragging.current = false;
    captured.current = false;
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (startX.current === null) return;

    // Always keep lastX current so a single late move still updates distance
    lastX.current = e.clientX;

    const dx = e.clientX - startX.current;

    // If we've exceeded slop, we are dragging horizontally
    if (!dragging.current && Math.abs(dx) > slop) {
      dragging.current = true;

      // Capture so we keep getting moves even if finger/mouse leaves
      if (
        !captured.current &&
        (e.currentTarget as HTMLDivElement).setPointerCapture
      ) {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        captured.current = true;
      }
    }

    // While dragging, prevent accidental text selection / scrolling
    if (dragging.current && e.cancelable) e.preventDefault();
  };

  const endGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;

    const dx = (lastX.current ?? 0) - startX.current;
    const swipedLeft = dx <= -threshold;
    const swipedRight = dx >= threshold;

    // Release capture if we took it
    if (
      captured.current &&
      (e.currentTarget as HTMLDivElement).releasePointerCapture
    ) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        /* already released, ignore */
      }
    }

    // If we were dragging, we handled the gesture; avoid firing a stray click
    if (dragging.current && e.cancelable) e.preventDefault();

    // Reset
    startX.current = null;
    dragging.current = false;
    captured.current = false;

    if (swipedLeft) onSwipeLeft();
    else if (swipedRight) onSwipeRight();
    // else: small move → let child's onClick happen
  };

  return (
    <Box
      sx={{
        touchAction: 'pan-y', // vertical scroll allowed; we handle horizontal
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onPointerLeave={(e) => {
        // Only treat leave as end if we were dragging; otherwise, let clicks work
        if (dragging.current) endGesture(e);
      }}
    >
      {children}
    </Box>
  );
}
