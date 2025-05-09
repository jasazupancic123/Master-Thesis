'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { createContext, useContext, useState } from 'react';

interface DashboardContextProps {
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
}

const DashboardContext = createContext<DashboardContextProps | null>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: ChildrenProps) {
  const {
    children,
  } = props;

  const [detectedChanges, setDetectedChanges] = useState(false);

  const value: DashboardContextProps = {
    detectedChanges,
    setDetectedChanges,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
