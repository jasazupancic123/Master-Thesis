'use client';
import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';

type SwipeableBoxProps = {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number; // px to trigger a swipe
};

export default function SwipeableBox({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  children,
}: SwipeableBoxProps) {
  const startX = useRef<number | null>(null);
  const lastX = useRef(0);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    lastX.current = e.clientX;
    setDragging(true);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragging || startX.current === null) return;
    lastX.current = e.clientX;
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (startX.current === null) return;
    const deltaX = lastX.current - startX.current;
    const swipedLeft = deltaX <= -threshold;
    const swipedRight = deltaX >= threshold;

    setDragging(false);
    startX.current = null;

    if (swipedLeft) onSwipeLeft();
    if (swipedRight) onSwipeRight();
  };

  return (
    <Box
      sx={{
        touchAction: 'pan-y', // allow vertical scrolling, capture horizontal
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={dragging ? handlePointerUp : undefined}
    >
      {children}
    </Box>
  );
}