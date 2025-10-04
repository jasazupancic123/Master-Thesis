// app/(coach)/MinDurationGate.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';

import { LOADING_ANIMATION_MIN_DURATION_MS } from '@/common/constant/loading.constant';
import Animation from '@/components/animation/animation';

// Fires once its children actually mount (i.e., when Suspense reveals)
function RevealSensor({
  onReveal,
  children,
}: {
  onReveal: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => onReveal(), [onReveal]);
  return <>{children}</>;
}

export default function AnimationMinDurationGate({
  children,
  minMs = LOADING_ANIMATION_MIN_DURATION_MS,
}: {
  children: React.ReactNode;
  minMs?: number;
}) {
  const [timeUp, setTimeUp] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimeUp(true), minMs);
    return () => clearTimeout(id);
  }, [minMs]);

  const hideOverlay = revealed && timeUp;

  return (
    <>
      <Suspense fallback={null}>
        <RevealSensor onReveal={() => setRevealed(true)}>
          {children}
        </RevealSensor>
      </Suspense>

      {!hideOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animation />
        </div>
      )}
    </>
  );
}
