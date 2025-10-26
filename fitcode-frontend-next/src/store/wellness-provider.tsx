'use client';

import { createContext, useContext, useMemo, useState } from 'react';

import type { Wellness } from '@/core/profile/type/wellness.type';

interface Props {
  wellness: Wellness;
}

interface IWellnessContext extends Props {
  setWellness: (_wellness: Wellness) => void;
}

const WellnessContext = createContext<IWellnessContext | null>(null);

export const useWellness = () => useContext(WellnessContext)!;

export function WellnessProvider(props: Props & React.PropsWithChildren) {
  const { children, wellness: providedWellness } = props;
  const [wellness, setWellness] = useState<Wellness>(providedWellness);
  const value = useMemo(() => ({ wellness, setWellness }), [wellness]);

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}
