'use client';

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

import {
  LINK_TRAININGS,
  LINKS_SIDEBAR,
} from '@/common/constant/navigation.constant';
import type { ILink } from '@/common/type/link.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import { UserRole } from '@/controller/profile/enum/user-role.enum';

interface AthleteContextProps {
  selectedDate: Dayjs;
  setSelectedDate: SetState<Dayjs>;
  hasJustLoggedIn: boolean;
  setHasJustLoggedIn: SetState<boolean>;
  filter: ILink;
  setFilter: SetState<ILink>;
}

const AthleteContext = createContext<AthleteContextProps | null>(null);

export const useAthlete = () => useContext(AthleteContext)!;

export function AthleteProvider(props: ChildrenProps) {
  const { children } = props;
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(true);

  let currentFilter = LINK_TRAININGS;
  const url = new URL(window.location.href);
  const lastItemInUrl = url.pathname.split('/').pop();
  Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map((link) => {
    if (lastItemInUrl && link?.href.endsWith(lastItemInUrl)) {
      currentFilter = link;
    }
  });

  const [filter, setFilter] = useState<ILink>(currentFilter);

  const value: AthleteContextProps = {
    selectedDate,
    setSelectedDate,
    hasJustLoggedIn,
    setHasJustLoggedIn,
    filter,
    setFilter,
  };

  return (
    <AthleteContext.Provider value={value}>{children}</AthleteContext.Provider>
  );
}
