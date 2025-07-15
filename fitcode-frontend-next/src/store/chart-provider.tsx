'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { User } from '@/controller/user/type/user.type';
import { createContext, useContext, useState } from 'react';

export interface ChartContextProps {
  profile: User;
  components: Component[];
  exercises: Exercise[];
}

interface ChartProviderProps extends ChartContextProps {
  setProfile: SetState<User>;
}

const ChartContext = createContext<ChartProviderProps | null>(null);

export const useChart = () => useContext(ChartContext)!;

export function ChartProvider(props: ChartContextProps & ChildrenProps) {
  const { children, profile: providedProfile, components, exercises } = props;

  const [profile, setProfile] = useState<User>(providedProfile);

  const value: ChartProviderProps = {
    profile,
    setProfile,
    components,
    exercises,
  };

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
}
