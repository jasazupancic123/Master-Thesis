'use client';

import { useEffect, useState } from 'react';

import {
  getCachedWellness,
  setCachedWellness,
} from '../session-cache/wellness.session-cache';
import Alert from '../ui/alert';
import type {
  Wellness,
  WellnessZScore,
} from '@/core/profile/type/wellness.type';
import { useMain } from '@/store/main.provider';
import { WellnessProvider } from '@/store/wellness-provider';

export default function WellnessInitializer(props: React.PropsWithChildren) {
  const { children } = props;

  const { profile } = useMain();
  const [wellness, setWellness] = useState<Wellness | null>(
    getCachedWellness()
  );

  useEffect(() => {
    if (wellness) return; // already cached

    const wellnessToSet: WellnessZScore = profile.wellness
      ? profile.wellness
      : {
          date: new Date(),
          userId: profile.uid,
          fatigue: 0,
          sleep: 0,
          soreness: 0,
          zScoreFatigue: 0,
          zScoreSleep: 0,
          zScoreSoreness: 0,
        };

    setCachedWellness(wellnessToSet);
    setWellness(wellnessToSet);
  }, [wellness]);

  if (!wellness) {
    console.log('Loading in wellness.initializer.tsx');
    return <Alert type="loading" />;
  }

  return <WellnessProvider wellness={wellness}>{children}</WellnessProvider>;
}
