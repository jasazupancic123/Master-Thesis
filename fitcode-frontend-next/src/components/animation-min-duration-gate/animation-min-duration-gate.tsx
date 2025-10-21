'use client';

import { Suspense, useEffect, useState } from 'react';

import { RevealSensor } from './reveal-sensor';
import { LOADING_ANIMATION_MIN_DURATION_MS } from '@/lib/common/const/animation.const';
import Animation from '@/util/animation';

interface Props extends React.PropsWithChildren {
  minMs?: number;
}

export default function AnimationMinDurationGate({
  children,
  minMs = LOADING_ANIMATION_MIN_DURATION_MS,
}: Props) {
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
