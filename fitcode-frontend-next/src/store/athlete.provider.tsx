'use client';

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import {
  LINK_TRAININGS,
  LINKS_SIDEBAR_GROUP_VIEW,
} from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';

interface AthleteProviderProps {
  trainings: Training[];
  reports: TrainingReport[];
}

interface AthleteContext extends AthleteProviderProps {
  selectedDate: Dayjs;
  setSelectedDate: SetState<Dayjs>;
  hasJustLoggedIn: boolean;
  setHasJustLoggedIn: SetState<boolean>;
  filter: ILink;
  setFilter: SetState<ILink>;
}

const AthleteContext = createContext<AthleteContext | null>(null);

export const useAthlete = () => useContext(AthleteContext)!;

export function AthleteProvider(
  props: AthleteProviderProps & React.PropsWithChildren
) {
  const { children, trainings, reports } = props;
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(true);

  let currentFilter = LINK_TRAININGS;
  const url = new URL(window.location.href);
  const lastItemInUrl = url.pathname.split('/').pop();
  Object.values(LINKS_SIDEBAR_GROUP_VIEW[UserRole.ATHLETE]).map((link) => {
    if (lastItemInUrl && link?.href.endsWith(lastItemInUrl)) {
      currentFilter = link;
    }
  });

  const [filter, setFilter] = useState<ILink>(currentFilter);

  const value: AthleteContext = {
    selectedDate,
    setSelectedDate,
    hasJustLoggedIn,
    setHasJustLoggedIn,
    filter,
    setFilter,
    trainings,
    reports,
  };

  return (
    <AthleteContext.Provider value={value}>{children}</AthleteContext.Provider>
  );
}
