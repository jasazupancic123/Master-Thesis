'use client';

import dayjs, { Dayjs } from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';
import { ChildrenProps } from '@/common/type/props.type';

interface AthleteContextProps {
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
  hasJustLoggedIn: boolean;
  setHasJustLoggedIn: (value: boolean) => void;
}

const AthleteContext = createContext<AthleteContextProps | null>(null);

export const useAthlete = () => useContext(AthleteContext)!;

export function AthleteProvider(props: ChildrenProps) {
  const { children } = props;
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(true);

  const value: AthleteContextProps = {
    selectedDate,
    setSelectedDate,
    hasJustLoggedIn,
    setHasJustLoggedIn,
  };

  return (
    <AthleteContext.Provider value={value}>{children}</AthleteContext.Provider>
  );
}
