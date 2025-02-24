'use client';

import dayjs, { Dayjs } from 'dayjs';
import { createContext, useContext, useEffect, useState } from 'react';
import { ChildrenProps } from '@/common/type/props.type';

interface AthleteContextProps {
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
  selectedPeriod: 'AM' | 'PM';
  setSelectedPeriod: (period: 'AM' | 'PM') => void;
  hasJustLoggedIn: boolean;
    setHasJustLoggedIn: (value: boolean) => void;
}

const AthleteContext = createContext<AthleteContextProps | null>(null);

export const useAthlete = () => useContext(AthleteContext)!;

export function AthleteProvider(props: ChildrenProps) {
  const { children } = props;
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(dayjs().hour() < 12 ? 'AM' : 'PM');
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(true);

  const value: AthleteContextProps = {
    selectedDate,
    setSelectedDate,
    selectedPeriod,
    setSelectedPeriod,
    hasJustLoggedIn,
    setHasJustLoggedIn,
  };

  return (
    <AthleteContext.Provider value={value}>{children}</AthleteContext.Provider>
  );
}
