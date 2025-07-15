'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { Wellness } from '@/controller/user/type/wellness.type';
import { createContext, useContext, useState } from 'react';

export interface WellnessProviderProps {
  wellness: Wellness;
}

const WellnessContext = createContext<WellnessProviderProps | null>(null);

export const useWellness = () => useContext(WellnessContext)!;

export function WellnessProvider(props: WellnessProviderProps & ChildrenProps) {
  const { children, wellness } = props;

  const value: WellnessProviderProps = {
    wellness,
  };

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}
