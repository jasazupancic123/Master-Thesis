'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { Wellness } from '@/controller/user/type/wellness.type';
import { createContext, useContext, useMemo, useState } from 'react';

export interface WellnessProviderProps {
  wellness: Wellness;
}

interface WellnessContextProps extends WellnessProviderProps {
  setWellness: (wellness: Wellness) => void;
}

const WellnessContext = createContext<WellnessContextProps | null>(null);

export const useWellness = () => useContext(WellnessContext)!;

export function WellnessProvider(props: WellnessProviderProps & ChildrenProps) {
  const { children, wellness: providedWellness } = props;
  const [wellness, setWellness] = useState<Wellness>(providedWellness);

  const value = useMemo(
    () => ({
      wellness,
      setWellness,
    }),
    [wellness]
  );

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}
